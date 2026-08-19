import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextRequest } from "next/server"

import {
  getReplayById,
  insertReplay,
  listReplays,
  replayRowToApi,
  updateReplayFilePath,
} from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import type { ReplayMetadata } from "@/lib/replay-types"

export const dynamic = "force-dynamic"

const MAX_REPLAY_BYTES = 50 * 1024 * 1024

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseReplayMetadata(raw: string): ReplayMetadata | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) {
      return null
    }
    const beatmap = value.beatmap
    const score = value.score
    if (!isRecord(beatmap) || !isRecord(score)) {
      return null
    }
    const num = (x: unknown) => typeof x === "number" && Number.isFinite(x)
    const str = (x: unknown) => typeof x === "string"
    const valid =
      str(value.fileName) &&
      (value.skinName === null || str(value.skinName)) &&
      str(value.notes) &&
      str(value.beatmapChecksum) &&
      num(beatmap.id) &&
      str(beatmap.title) &&
      str(beatmap.artist) &&
      str(beatmap.creator) &&
      str(beatmap.version) &&
      num(beatmap.starRating) &&
      num(beatmap.maxCombo) &&
      str(beatmap.url) &&
      str(beatmap.backgroundUrl) &&
      str(beatmap.coverListUrl) &&
      str(score.rank) &&
      str(score.username) &&
      num(score.date) &&
      num(score.totalScore) &&
      num(score.maxCombo) &&
      num(score.accuracy) &&
      Array.isArray(score.mods) &&
      score.mods.every((m) => str(m)) &&
      num(score.countGeki) &&
      num(score.countKatu) &&
      num(score.count300) &&
      num(score.count100) &&
      num(score.count50) &&
      num(score.countMiss)
    if (!valid) {
      return null
    }
    return value as unknown as ReplayMetadata
  } catch {
    return null
  }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  return Response.json(listReplays().map(replayRowToApi))
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const form = await request.formData()
  const file = form.get("file")
  const metadata = form.get("metadata")
  if (!(file instanceof File) || typeof metadata !== "string") {
    return Response.json({ error: "missing file or metadata" }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_REPLAY_BYTES) {
    return Response.json({ error: "invalid file size" }, { status: 400 })
  }
  const input = parseReplayMetadata(metadata)
  if (!input) {
    return Response.json({ error: "invalid metadata" }, { status: 400 })
  }

  const id = insertReplay({
    osuId: user.osu_id,
    fileName: input.fileName,
    skinName: input.skinName,
    notes: input.notes,
    beatmapChecksum: input.beatmapChecksum,
    beatmap: input.beatmap,
    score: input.score,
  })

  const dir = path.join(process.cwd(), "data", "replays")
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${id}.osr`)
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()))
  updateReplayFilePath(id, filePath)

  const row = getReplayById(id)
  if (!row) {
    return Response.json({ error: "internal error" }, { status: 500 })
  }
  return Response.json(replayRowToApi(row), { status: 201 })
}