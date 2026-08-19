import { NextRequest } from "next/server"

import {
  deleteJudgmentById,
  getJudgment,
  getReplayById,
  listJudgments,
  replayToApiForViewer,
  updateJudgmentById,
  upsertJudgment,
} from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import { canAdmin, canJudge } from "@/lib/roles"

export const dynamic = "force-dynamic"

function parseScoreComment(body: unknown): {
  score: number
  comment: string
} | null {
  if (!body || typeof body !== "object") {
    return null
  }
  const { score, comment } = body as Record<string, unknown>
  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 5 ||
    typeof comment !== "string"
  ) {
    return null
  }
  return { score: Math.round(score * 100) / 100, comment }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!canJudge(user.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  const { id } = await params
  const replay = getReplayById(Number(id))
  if (!replay) {
    return Response.json({ error: "not found" }, { status: 404 })
  }
  return Response.json(listJudgments(replay.id))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!canJudge(user.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  const { id } = await params
  const replay = getReplayById(Number(id))
  if (!replay) {
    return Response.json({ error: "not found" }, { status: 404 })
  }
  const input = parseScoreComment(await request.json().catch(() => null))
  if (!input) {
    return Response.json({ error: "invalid score or comment" }, { status: 400 })
  }
  upsertJudgment(replay.id, user.osu_id, input.score, input.comment)
  return Response.json(replayToApiForViewer(replay.id, user.osu_id))
}

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
  const judgeOsuId = Number(request.nextUrl.searchParams.get("judgeOsuId"))
  if (!Number.isInteger(judgeOsuId)) {
    return Response.json({ error: "invalid judge" }, { status: 400 })
  }
  const judgment = getJudgment(replay.id, judgeOsuId)
  if (!judgment) {
    return Response.json({ error: "not found" }, { status: 404 })
  }
  const input = parseScoreComment(await request.json().catch(() => null))
  if (!input) {
    return Response.json({ error: "invalid score or comment" }, { status: 400 })
  }
  updateJudgmentById(judgment.id, replay.id, input.score, input.comment)
  return Response.json(listJudgments(replay.id))
}

export async function DELETE(
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
  const judgeOsuId = Number(request.nextUrl.searchParams.get("judgeOsuId"))
  if (!Number.isInteger(judgeOsuId)) {
    return Response.json({ error: "invalid judge" }, { status: 400 })
  }
  const judgment = getJudgment(replay.id, judgeOsuId)
  if (!judgment) {
    return Response.json({ error: "not found" }, { status: 404 })
  }
  deleteJudgmentById(judgment.id, replay.id)
  return new Response(null, { status: 204 })
}