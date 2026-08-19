import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { buildAuthorizationUrl } from "@/lib/auth"

export const dynamic = "force-dynamic"

export function GET() {
  const state = randomBytes(16).toString("hex")
  const url = buildAuthorizationUrl(state)

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