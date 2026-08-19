import { NextRequest } from "next/server"

import { withUserApi } from "@/lib/auth"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const checksum = request.nextUrl.searchParams.get("checksum")
  if (!checksum) {
    return Response.json({ error: "missing checksum" }, { status: 400 })
  }
  try {
    const beatmap = await withUserApi(user.osu_id, (api) =>
      api.lookupBeatmap({ checksum }),
    )
    return Response.json({
      id: beatmap.id,
      title: beatmap.beatmapset.title,
      artist: beatmap.beatmapset.artist,
      creator: beatmap.beatmapset.creator,
      version: beatmap.version,
      starRating: beatmap.difficulty_rating,
      maxCombo: beatmap.max_combo,
      url: beatmap.url,
      backgroundUrl: beatmap.beatmapset.covers.cover,
      coverListUrl: beatmap.beatmapset.covers.list,
    })
  } catch {
    return Response.json({ error: "beatmap not found" }, { status: 404 })
  }
}