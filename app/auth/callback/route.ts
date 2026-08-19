import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authorizeWithCode, getRedirectUri, getResourceOwner } from "@/lib/auth"
import { upsertUser } from "@/lib/db"
import { createSessionCookie } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const cookieStore = await cookies()
  const expectedState = cookieStore.get("osu_oauth_state")?.value
  cookieStore.delete("osu_oauth_state")

  const home = () => new URL("/", request.url)

  if (error || !code || !state || state !== expectedState) {
    const redirect = home()
    redirect.searchParams.set("auth_error", error ?? "invalid_authorization")
    return NextResponse.redirect(redirect)
  }

  try {
    const api = await authorizeWithCode(code, getRedirectUri(request.nextUrl.origin))
    const user = await getResourceOwner(api)

    upsertUser({
      osuId: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      countryCode: user.country_code,
      accessToken: api.access_token,
      refreshToken: api.refresh_token ?? null,
      tokenExpiresAt: api.expires.getTime(),
    })

    await createSessionCookie(user.id)
  } catch {
    const redirect = home()
    redirect.searchParams.set("auth_error", "authorization_failed")
    return NextResponse.redirect(redirect)
  }

  return NextResponse.redirect(home())
}