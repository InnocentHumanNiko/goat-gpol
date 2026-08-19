"use client"

import Image from "next/image"
import { useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FilePicker } from "@/components/file-picker"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconExternalLink, IconFile, IconUpload } from "@tabler/icons-react"
import { decodeReplayFile, type DecodedScore } from "@/lib/replay-decode"
import { cn } from "@/lib/utils"
import type {
  BeatmapInfo,
  Replay,
  ReplayInput,
  ScoreStats,
  Skin,
} from "@/components/app-shell"

type ConfirmData = {
  fileName: string
  beatmap: BeatmapInfo
  score: DecodedScore
  skinName: string | null
  notes: string
}

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

function ScoreStatsPanel({
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

function ReplaySubmitForm({
  skins,
  onSubmit,
}: {
  skins: Skin[]
  onSubmit: (input: ReplayInput) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [skinId, setSkinId] = useState("")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmData | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const score = await decodeReplayFile(file)
      const res = await fetch(
        `/beatmap/lookup?checksum=${encodeURIComponent(score.beatmapHash)}`,
      )
      if (!res.ok) {
        throw new Error("beatmap-lookup-failed")
      }
      const beatmap = (await res.json()) as BeatmapInfo
      setConfirm({
        fileName: file.name,
        beatmap,
        score,
        skinName: skins.find((s) => s.id === Number(skinId))?.name ?? null,
        notes: notes.trim(),
      })
    } catch (err) {
      setError(
        err instanceof Error && err.message === "beatmap-lookup-failed"
          ? "Could not find the beatmap for this replay. It may have been deleted or the replay is too old."
          : "That file could not be decoded as an osu! replay.",
      )
    } finally {
      setBusy(false)
    }
  }

  if (confirm) {
    const { beatmap, score, skinName, notes: confirmNotes } = confirm
    return (
      <div className="flex flex-col gap-5">
        <div className="relative -mx-6 -mt-6 h-40 w-[calc(100%+3rem)] overflow-hidden rounded-t-xl">
          <Image
            src={beatmap.backgroundUrl}
            alt={`${beatmap.artist} - ${beatmap.title} background`}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <DialogHeader>
          <DialogDescription className="text-xs">
            Mapped by {beatmap.creator}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg">
              {beatmap.artist} - {beatmap.title} [{beatmap.version}]
            </DialogTitle>
            <Badge variant="secondary">
              {beatmap.starRating.toFixed(2)}★
            </Badge>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={
                      <a
                        href={beatmap.url}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  />
                }
              >
                <IconExternalLink />
                <span className="sr-only">View beatmap</span>
              </TooltipTrigger>
              <TooltipContent>View beatmap</TooltipContent>
            </Tooltip>
          </div>
          <DialogDescription>
            Score set by {score.username} on {score.date.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <ScoreStatsPanel score={score} beatmapMaxCombo={beatmap.maxCombo} />
          {(skinName || confirmNotes !== "") && (
            <div className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm">
              {skinName && (
                <p className="text-muted-foreground">
                  Skin: <span className="font-medium text-foreground">{skinName}</span>
                </p>
              )}
              {confirmNotes !== "" && (
                <p className="text-muted-foreground">{confirmNotes}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Back
          </Button>
          <DialogClose
            render={<Button />}
            onClick={() =>
              onSubmit({
                fileName: confirm.fileName,
                skinName: confirm.skinName,
                notes: confirm.notes,
                beatmap: confirm.beatmap,
                score: confirm.score,
              })
            }
          >
            Submit replay
          </DialogClose>
        </DialogFooter>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Submit a replay</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Replay file</span>
          <FilePicker
            accept=".osr"
            label="Choose a .osr replay"
            hint="or drag and drop it here"
            onFileChange={setFile}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="replay-skin" className="text-sm font-medium">
            Skin
          </label>
          <Select
            id="replay-skin"
            value={skinId}
            onChange={(e) => setSkinId(e.target.value)}
            disabled={skins.length === 0}
          >
            <option value="">
              {skins.length === 0 ? "None selected" : "Select a skin"}
            </option>
            {skins.map((skin) => (
              <option key={skin.id} value={skin.id}>
                {skin.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="replay-notes" className="text-sm font-medium">
            Comments
          </label>
          <Textarea
            id="replay-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="goated score frfr"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {busy && (
          <p className="text-sm text-muted-foreground">Decoding replay…</p>
        )}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={!file || busy}>
          Next
        </Button>
      </DialogFooter>
    </form>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <IconFile className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No replays yet</p>
      </CardContent>
    </Card>
  )
}

function ReplayCard({ replay }: { replay: Replay }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<li className="flex items-stretch" />}
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
          </div>
          <p className="text-xs text-muted-foreground">
            Score set by{" "}
            <span className="font-medium text-foreground">
              {replay.score.username}
            </span>{" "}
            on {replay.score.date.toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Submitted on {new Date(replay.createdAt).toLocaleDateString()}
          </p>
          {replay.notes !== "" && (
            <p className="text-sm text-muted-foreground">{replay.notes}</p>
          )}
        </div>
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

export function ReplaysTab({
  replays,
  skins,
  onSubmit,
}: {
  replays: Replay[]
  skins: Skin[]
  onSubmit: (input: ReplayInput) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold">Replays</h1>
          <p className="text-sm text-muted-foreground">
            All submitted replays will show here.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <IconUpload />
            Submit
          </DialogTrigger>
          <DialogContent className="w-fit min-w-[min(24rem,calc(100%-2rem))] max-w-[min(42rem,calc(100%-2rem))] py-8">
            <ReplaySubmitForm
              skins={skins}
              onSubmit={(input) => {
                onSubmit(input)
                setOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </header>

      {replays.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          {replays.map((replay) => (
            <ReplayCard key={replay.id} replay={replay} />
          ))}
        </ul>
      )}
    </div>
  )
}