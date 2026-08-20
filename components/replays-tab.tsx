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
import { ReplayCard, ScoreStatsPanel } from "@/components/replay-card"
import {
  Select,
  SelectItem,
  SelectItemText,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconExternalLink, IconFile, IconUpload } from "@tabler/icons-react"
import { decodeReplayFile, type DecodedScore } from "@/lib/replay-decode"
import type {
  BeatmapInfo,
  Replay,
  ReplayInput,
  Skin,
} from "@/components/app-shell"

type ConfirmData = {
  file: File
  fileName: string
  beatmapChecksum: string
  beatmap: BeatmapInfo
  score: DecodedScore
  skinName: string | null
  notes: string
}

function ReplaySubmitForm({
  skins,
  onSubmit,
}: {
  skins: Skin[]
  onSubmit: (input: ReplayInput, file: File) => Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [skinId, setSkinId] = useState("")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
        file,
        fileName: file.name,
        beatmapChecksum: score.beatmapHash,
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

  const handleConfirmSubmit = async () => {
    if (!confirm || submitting) {
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(
        {
          fileName: confirm.fileName,
          skinName: confirm.skinName,
          notes: confirm.notes,
          beatmapChecksum: confirm.beatmapChecksum,
          beatmap: confirm.beatmap,
          score: confirm.score,
        },
        confirm.file,
      )
    } catch {
      setSubmitError("Could not submit the replay. Please try again.")
      setSubmitting(false)
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
          <Button onClick={handleConfirmSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit replay"}
          </Button>
        </DialogFooter>
        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}
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
            value={skinId}
            onValueChange={(value) => setSkinId(value ?? "")}
            disabled={skins.length === 0}
          >
            <SelectTrigger id="replay-skin">
              <SelectValue
                placeholder={skins.length === 0 ? "None selected" : "Select a skin"}
              />
            </SelectTrigger>
            <SelectPopup>
              {skins.map((skin) => (
                <SelectItem key={skin.id} value={String(skin.id)}>
                  <SelectItemText>{skin.name}</SelectItemText>
                </SelectItem>
              ))}
            </SelectPopup>
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

export function ReplaysTab({
  replays,
  skins,
  onSubmit,
  canSubmit,
}: {
  replays: Replay[]
  skins: Skin[]
  onSubmit: (input: ReplayInput, file: File) => Promise<void>
  canSubmit: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold">Replays</h1>
          <p className="text-sm text-muted-foreground">
            Replays you have submitted will show here.
          </p>
        </div>
        {canSubmit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <IconUpload />
              Submit
            </DialogTrigger>
            <DialogContent className="w-fit min-w-[min(24rem,calc(100%-2rem))] max-w-[min(42rem,calc(100%-2rem))] py-8">
              <ReplaySubmitForm
                skins={skins}
                onSubmit={async (input, file) => {
                  await onSubmit(input, file)
                  setOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are banned from submitting new replays.
          </p>
        )}
      </header>

      {replays.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          {replays.map((replay) => (
            <ReplayCard
              key={replay.id}
              replay={replay}
            />
          ))}
        </ul>
      )}
    </div>
  )
}