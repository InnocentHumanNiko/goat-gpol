import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ authenticated: false })
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      osuId: user.osu_id,
      username: user.username,
      avatarUrl: user.avatar_url,
      countryCode: user.country_code,
    },
  })
}