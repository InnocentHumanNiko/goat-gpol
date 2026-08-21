import { createWriteStream } from "node:fs"
import { mkdir, rename, rm } from "node:fs/promises"
import path from "node:path"
import { Readable, Transform } from "node:stream"
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web"
import { pipeline } from "node:stream/promises"
import { NextRequest } from "next/server"

import {
  deleteSkin,
  getSkinById,
  insertSkin,
  listSkinsByUser,
  updateSkinFilePath,
} from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import { SKIN_RULESETS, SKIN_TYPES } from "@/lib/skin-upload"

export const dynamic = "force-dynamic"

const MAX_SKIN_BYTES = 500 * 1024 * 1024

const OSK_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

const VALID_RULESETS = new Set<string>(SKIN_RULESETS)

const VALID_TYPES = new Set<string>(SKIN_TYPES)

function parseRulesets(raw: string | null): string[] | null {
  const rulesets = (raw ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter((r) => VALID_RULESETS.has(r))
  return rulesets.length > 0 ? [...new Set(rulesets)] : null
}

function parseType(raw: string | null): string | null {
  return raw !== null && VALID_TYPES.has(raw) ? raw : null
}

function parseScrollSpeed(raw: string | null): number | null {
  if (raw === null || raw === "") {
    return null
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 1 || value > 40) {
    return null
  }
  return Math.round(value * 2) / 2
}

class SkinUploadError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

class UploadGuard extends Transform {
  private seen = 0
  _transform(chunk: Buffer, _enc: BufferEncoding, cb: (e?: Error | null, d?: Buffer) => void) {
    if (this.seen === 0 && !chunk.subarray(0, OSK_MAGIC.length).equals(OSK_MAGIC)) {
      cb(new SkinUploadError("invalid file type", 400))
      return
    }
    this.seen += chunk.length
    if (this.seen > MAX_SKIN_BYTES) {
      cb(new SkinUploadError("file too large", 413))
      return
    }
    cb(null, chunk)
  }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  return Response.json(
    listSkinsByUser(user.osu_id).map((skin) => ({
      id: skin.id,
      name: skin.name,
      rulesets: JSON.parse(skin.rulesets) as string[],
      type: skin.type,
      description: skin.description,
      scrollSpeed: skin.scroll_speed,
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

  const name = (request.nextUrl.searchParams.get("name") ?? "").trim()
  const fileName = request.nextUrl.searchParams.get("fileName") ?? ""
  const rulesets = parseRulesets(request.nextUrl.searchParams.get("rulesets"))
  const type = parseType(request.nextUrl.searchParams.get("type"))
  const scrollSpeed = parseScrollSpeed(
    request.nextUrl.searchParams.get("scrollSpeed"),
  )
  const description = (
    request.nextUrl.searchParams.get("description") ?? ""
  )
    .trim()
    .slice(0, 500)
  if (!name || name.length > 100) {
    return Response.json({ error: "invalid name" }, { status: 400 })
  }
  if (!rulesets) {
    return Response.json({ error: "invalid rulesets" }, { status: 400 })
  }
  if (!type) {
    return Response.json({ error: "invalid type" }, { status: 400 })
  }
  if (
    request.nextUrl.searchParams.get("scrollSpeed") !== null &&
    scrollSpeed === null
  ) {
    return Response.json({ error: "invalid scroll speed" }, { status: 400 })
  }
  if (!fileName.toLowerCase().endsWith(".osk")) {
    return Response.json({ error: "invalid file type" }, { status: 400 })
  }
  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_SKIN_BYTES) {
    return Response.json({ error: "file too large" }, { status: 413 })
  }
  if (!request.body) {
    return Response.json({ error: "missing file" }, { status: 400 })
  }

  const id = insertSkin(
    user.osu_id,
    name,
    JSON.stringify(rulesets),
    type,
    description,
    scrollSpeed,
  )

  const dir = path.join(process.cwd(), "data", "skins")
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${id}.osk`)
  const tempPath = `${filePath}.part`

  try {
    await pipeline(
      Readable.fromWeb(request.body as unknown as NodeWebReadableStream),
      new UploadGuard(),
      createWriteStream(tempPath),
    )
  } catch (error) {
    await rm(tempPath, { force: true })
    deleteSkin(id)
    if (error instanceof SkinUploadError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    return Response.json({ error: "upload failed" }, { status: 500 })
  }

  await rename(tempPath, filePath)
  updateSkinFilePath(id, filePath)

  const row = getSkinById(id)
  if (!row) {
    return Response.json({ error: "internal error" }, { status: 500 })
  }
  return Response.json(
    {
      id: row.id,
      name: row.name,
      rulesets: JSON.parse(row.rulesets) as string[],
      type: row.type,
      description: row.description,
      scrollSpeed: row.scroll_speed,
      createdAt: row.created_at,
    },
    { status: 201 },
  )
}
