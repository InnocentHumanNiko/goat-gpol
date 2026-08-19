import type { ReplayStatus } from "@/lib/replay-types"

export type JudgeSettings = {
  thresholdScore: number
  thresholdPercent: number
}

export const DEFAULT_JUDGE_SETTINGS: JudgeSettings = {
  thresholdScore: 3,
  thresholdPercent: 50,
}

export function statusFromJudgments(
  scores: number[],
  eligibleJudges: number,
  settings: JudgeSettings,
): ReplayStatus {
  if (eligibleJudges <= 0) {
    return "pool"
  }
  const good = scores.filter((s) => s > settings.thresholdScore).length
  if (good > (eligibleJudges * settings.thresholdPercent) / 100) {
    return "render"
  }
  return "pool"
}