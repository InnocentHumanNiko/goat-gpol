import { NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  await deleteSession()
  return NextResponse.redirect(new URL("/", request.url))
}