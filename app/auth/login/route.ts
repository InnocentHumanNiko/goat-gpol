import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { buildAuthorizationUrl } from "@/lib/auth"

export const dynamic = "force-dynamic"

export function GET(request: NextRequest) {
  const state = randomBytes(16).toString("hex")
  const url = buildAuthorizationUrl(request.nextUrl.origin, state)

  const res = NextResponse.json({ url })
  res.cookies.set("osu_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  })
  return res
}