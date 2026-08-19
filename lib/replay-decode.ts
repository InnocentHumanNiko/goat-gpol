import { ScoreDecoder } from "osu-parsers"

export type DecodedScore = {
  beatmapHash: string
  username: string
  date: Date
  rank: string
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

const MOD_ORDER: { bit: number; acronym: string }[] = [
  { bit: 1, acronym: "NF" },
  { bit: 2, acronym: "EZ" },
  { bit: 4, acronym: "TD" },
  { bit: 8, acronym: "HD" },
  { bit: 16, acronym: "HR" },
  { bit: 32, acronym: "SD" },
  { bit: 512, acronym: "NC" },
  { bit: 64, acronym: "DT" },
  { bit: 128, acronym: "RX" },
  { bit: 256, acronym: "HT" },
  { bit: 1024, acronym: "FL" },
  { bit: 2048, acronym: "AT" },
  { bit: 4096, acronym: "SO" },
  { bit: 8192, acronym: "AP" },
  { bit: 16384, acronym: "PF" },
  { bit: 4194304, acronym: "CN" },
  { bit: 268435456, acronym: "MR" },
]

export function modsToAcronyms(rawMods: number): string[] {
  const acronyms: string[] = []
  for (const { bit, acronym } of MOD_ORDER) {
    if ((rawMods & bit) === bit) {
      if (acronym === "DT" && acronyms.includes("NC")) {
        continue
      }
      acronyms.push(acronym)
    }
  }
  return acronyms
}

export async function decodeReplayFile(file: File): Promise<DecodedScore> {
  const buffer = await file.arrayBuffer()
  const score = await new ScoreDecoder().decodeFromBuffer(buffer, false)
  const info = score.info
  info.passed = true
  return {
    beatmapHash: info.beatmapHashMD5,
    username: info.username,
    date: info.date,
    rank: info.rank,
    totalScore: info.totalScore,
    maxCombo: info.maxCombo,
    accuracy: info.accuracy,
    mods: modsToAcronyms(
      typeof info.rawMods === "number" ? info.rawMods : 0,
    ),
    countGeki: info.countGeki,
    countKatu: info.countKatu,
    count300: info.count300,
    count100: info.count100,
    count50: info.count50,
    countMiss: info.countMiss,
  }
}