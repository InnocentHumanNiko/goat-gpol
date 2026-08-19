export type Role = "basic" | "judge" | "admin" | "manager"

export type ReplayStatus = "pool" | "render"

export type BeatmapApi = {
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

export type ScoreApi = {
  rank: string
  username: string
  date: number
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

export type ReplayMetadata = {
  fileName: string
  skinName: string | null
  notes: string
  beatmapChecksum: string
  beatmap: BeatmapApi
  score: ScoreApi
}

export type ReplayApi = ReplayMetadata & {
  id: number
  createdAt: number
  submitter: { osuId: number; username: string }
  status: ReplayStatus
  manual: boolean
  myJudgment: { score: number; comment: string } | null
  judgmentSummary: { count: number; average: number | null }
}

export type JudgmentApi = {
  id: number
  replayId: number
  judgeOsuId: number
  judgeUsername: string
  judgeAvatarUrl: string
  score: number
  comment: string
  createdAt: number
  updatedAt: number
}

export type SkinApi = {
  id: number
  name: string
  createdAt: number
}