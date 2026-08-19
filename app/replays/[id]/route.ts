import { rm } from "node:fs/promises"
import { NextRequest } from "next/server"

import {
  deleteReplayRow,
  getReplayById,
  replayToApiForViewer,
  updateReplayStatus,
} from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import { canAdmin } from "@/lib/roles"
import type { ReplayStatus } from "@/lib/replay-types"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!canAdmin(user.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  const { id } = await params
  const replay = getReplayById(Number(id))
  if (!replay) {
    return Response.json({ error: "not found" }, { status: 404 })
  }
  const body = await request.json().catch(() => null)
  const status: unknown = body?.status
  if (status !== "pool" && status !== "render") {
    return Response.json({ error: "invalid status" }, { status: 400 })
  }
  updateReplayStatus(replay.id, status as ReplayStatus)
  const updated = replayToApiForViewer(replay.id, user.osu_id)
  return Response.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!canAdmin(user.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  const { id } = await params
  const replay = getReplayById(Number(id))
  if (!replay) {
    return Response.json({ error: "not found" }, { status: 404 })
  }
  deleteReplayRow(replay.id)
  await rm(replay.file_path, { force: true })
  return new Response(null, { status: 204 })
}