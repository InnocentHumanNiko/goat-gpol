"use client"

import { useState } from "react"

import { ReplaysTab } from "@/components/replays-tab"
import { SiteNav } from "@/components/site-nav"
import { SkinsTab } from "@/components/skins-tab"
import type { ReplayApi } from "@/lib/replay-types"

export type Tab = "replays" | "skins"

export type SessionUser = {
  osuId: number
  username: string
  avatarUrl: string
  countryCode: string
}

export type Skin = {
  id: number
  name: string
  createdAt: number
}

export type BeatmapInfo = {
  id: number
  title: string
  artist: string
  creator: string
  version: string
  starRating: number
  maxCombo: number
  url: string
  backgroundUrl: string
  coverListUrl: string
}

export type ScoreStats = {
  rank: string
  username: string
  date: Date
  totalScore: number
  maxCombo: number
  accuracy: number
  mods: string[]
  countGeki: number
  countKatu: number
  count300: number
  count100: number
  count50: number
  countMiss: number
}

export type ReplayInput = {
  fileName: string
  skinName: string | null
  notes: string
  beatmapChecksum: string
  beatmap: BeatmapInfo
  score: ScoreStats
}

export type Replay = ReplayInput & {
  id: number
  createdAt: number
  submitter: { osuId: number; username: string }
}

function replayFromApi(api: ReplayApi): Replay {
  return {
    id: api.id,
    createdAt: api.createdAt,
    fileName: api.fileName,
    skinName: api.skinName,
    notes: api.notes,
    beatmapChecksum: api.beatmapChecksum,
    beatmap: api.beatmap,
    score: { ...api.score, date: new Date(api.score.date) },
    submitter: api.submitter,
  }
}

export function AppShell({
  user,
  initialReplays,
}: {
  user: SessionUser
  initialReplays: ReplayApi[]
}) {
  const [tab, setTab] = useState<Tab>("replays")
  const [replays, setReplays] = useState<Replay[]>(() =>
    initialReplays.map(replayFromApi),
  )
  const [skins, setSkins] = useState<Skin[]>([])

  const addSkin = (name: string) => {
    setSkins((prev) => [...prev, { id: Date.now(), name, createdAt: Date.now() }])
  }

  const addReplay = async (input: ReplayInput, file: File) => {
    const form = new FormData()
    form.append("file", file)
    form.append(
      "metadata",
      JSON.stringify({
        fileName: input.fileName,
        skinName: input.skinName,
        notes: input.notes,
        beatmapChecksum: input.beatmapChecksum,
        beatmap: input.beatmap,
        score: { ...input.score, date: input.score.date.getTime() },
      }),
    )
    const res = await fetch("/replays", { method: "POST", body: form })
    if (!res.ok) {
      throw new Error("submit-failed")
    }
    const created = (await res.json()) as ReplayApi
    setReplays((prev) => [replayFromApi(created), ...prev])
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav tab={tab} onTabChange={setTab} user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {tab === "replays" ? (
          <ReplaysTab replays={replays} skins={skins} onSubmit={addReplay} />
        ) : (
          <SkinsTab skins={skins} onUpload={addSkin} />
        )}
      </main>
    </div>
  )
}