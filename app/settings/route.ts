import { NextRequest } from "next/server"

import {
  getJudgeSettings,
  recomputeAllReplayStatuses,
  updateJudgeSettings,
} from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import { canAdmin } from "@/lib/roles"
import type { JudgeSettings } from "@/lib/judging"

export const dynamic = "force-dynamic"

function parseSettings(body: unknown): Partial<JudgeSettings> | null {
  if (!body || typeof body !== "object") {
    return null
  }
  const { thresholdScore, thresholdPercent } = body as Record<
    string,
    unknown
  >
  const out: Partial<JudgeSettings> = {}
  const int = (value: unknown) =>
    typeof value === "number" && Number.isInteger(value) ? value : undefined

  const score = int(thresholdScore)
  if (score !== undefined) {
    if (score < 0 || score > 4) {
      return null
    }
    out.thresholdScore = score
  }
  const percent = int(thresholdPercent)
  if (percent !== undefined) {
    if (percent < 1 || percent > 100) {
      return null
    }
    out.thresholdPercent = percent
  }
  return out
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!canAdmin(user.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  return Response.json(getJudgeSettings())
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!canAdmin(user.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  const input = parseSettings(await request.json().catch(() => null))
  if (!input) {
    return Response.json({ error: "invalid settings" }, { status: 400 })
  }
  updateJudgeSettings(input)
  recomputeAllReplayStatuses()
  return Response.json(getJudgeSettings())
}