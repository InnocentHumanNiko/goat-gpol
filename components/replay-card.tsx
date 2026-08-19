"use client"

import Image from "next/image"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IconFile } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { Replay, ScoreStats } from "@/components/app-shell"

function Stat({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md bg-muted/50 px-2.5 py-2",
        className
      )}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap text-sm font-medium">{value}</dd>
    </div>
  )
}

export function ScoreStatsPanel({
  score,
  beatmapMaxCombo,
}: {
  score: ScoreStats
  beatmapMaxCombo: number
}) {
  return (
    <dl className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <Stat label="Grade" value={score.rank} className="flex-1" />
        <Stat
          label="Score"
          value={score.totalScore.toLocaleString()}
          className="flex-1"
        />
        <Stat
          label="Accuracy"
          value={`${(score.accuracy * 100).toFixed(2)}%`}
          className="flex-1"
        />
        <Stat
          label="Combo"
          value={`${score.maxCombo} / ${beatmapMaxCombo}`}
          className="flex-1"
        />
        <Stat
          label="Mods"
          value={score.mods.join("") || "NM"}
          className="flex-1"
        />
      </div>
      <div className="flex divide-x overflow-hidden rounded-md border bg-muted/50">
        {(
          [
            { label: "300", value: score.count300 },
            { label: "100", value: score.count100 },
            { label: "50", value: score.count50 },
            { label: "Miss", value: score.countMiss },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2"
          >
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="whitespace-nowrap text-sm font-medium">{s.value}</dd>
          </div>
        ))}
      </div>
    </dl>
  )
}

export function ReplayCard({
  replay,
  actions,
  badges,
  as = "li",
}: {
  replay: Replay
  actions?: ReactNode
  badges?: ReactNode
  as?: "li" | "div"
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          as === "div" ? (
            <div className="flex items-stretch" />
          ) : (
            <li className="flex items-stretch" />
          )
        }
      >
        <div className="relative w-28 shrink-0 bg-muted/50">
          {replay.beatmap.coverListUrl ? (
            <Image
              src={replay.beatmap.coverListUrl}
              alt={`${replay.beatmap.artist} - ${replay.beatmap.title} cover`}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <IconFile className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate text-sm font-medium">
              {replay.beatmap.artist} - {replay.beatmap.title} [
              {replay.beatmap.version}]
            </span>
            <Badge variant="outline">
              {replay.beatmap.starRating.toFixed(2)}★
            </Badge>
            {replay.score.maxCombo === replay.beatmap.maxCombo && (
              <Badge variant="secondary">PFC</Badge>
            )}
            {badges}
          </div>
          <p className="text-xs text-muted-foreground">
            Score set by{" "}
            <span className="font-medium text-foreground">
              {replay.score.username}
            </span>{" "}
            on {replay.score.date.toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Submitted by{" "}
            <span className="font-medium text-foreground">
              {replay.submitter.username}
            </span>{" "}
            on {new Date(replay.createdAt).toLocaleDateString()}
          </p>
          {replay.notes !== "" && (
            <p className="text-sm text-muted-foreground">{replay.notes}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2 px-4">{actions}</div>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        hideArrow
        className="w-fit max-w-none items-stretch gap-3 rounded-xl border bg-card px-4 py-3 text-foreground shadow-lg"
      >
        <ScoreStatsPanel
          score={replay.score}
          beatmapMaxCombo={replay.beatmap.maxCombo}
        />
      </TooltipContent>
    </Tooltip>
  )
}