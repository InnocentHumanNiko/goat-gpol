import { NextRequest } from "next/server"

import { insertSkin, listSkinsByUser } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  return Response.json(
    listSkinsByUser(user.osu_id).map((skin) => ({
      id: skin.id,
      name: skin.name,
      createdAt: skin.created_at,
    })),
  )
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (user.banned_at !== null) {
    return Response.json({ error: "banned" }, { status: 403 })
  }
  const body = await request.json().catch(() => null)
  const name = body && typeof body.name === "string" ? body.name.trim() : ""
  if (!name || name.length > 100) {
    return Response.json({ error: "invalid name" }, { status: 400 })
  }
  const id = insertSkin(user.osu_id, name)
  return Response.json({ id, name, createdAt: Date.now() }, { status: 201 })
}