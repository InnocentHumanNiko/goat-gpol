"use client"

import { useEffect, useState } from "react"

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
import { ReplayCard } from "@/components/replay-card"
import { Textarea } from "@/components/ui/textarea"
import { IconDownload, IconScale } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { replayFromApi, type Replay } from "@/components/app-shell"
import type { ReplayApi } from "@/lib/replay-types"

const SCORES = [0, 1, 2, 3, 4, 5]

function JudgeDialog({
  replay,
  onJudged,
}: {
  replay: Replay
  onJudged: (updated: Replay) => void
}) {
  const [score, setScore] = useState(replay.myJudgment?.score ?? 0)
  const [comment, setComment] = useState(replay.myJudgment?.comment ?? "")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (saving) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/replays/${replay.id}/judgment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      })
      if (!res.ok) {
        throw new Error("judge-failed")
      }
      onJudged(replayFromApi((await res.json()) as ReplayApi))
      setOpen(false)
    } catch {
      setError("Could not save the judgment. Please try again.")
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={replay.myJudgment ? "secondary" : "default"} size="sm" />
        }
      >
        <IconScale />
        {replay.myJudgment ? "Edit judgment" : "Judge"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {replay.beatmap.artist} - {replay.beatmap.title} [
            {replay.beatmap.version}]
          </DialogTitle>
          <DialogDescription>
            Score set by {replay.score.username} on{" "}
            {replay.score.date.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Score</span>
            <div className="flex flex-wrap gap-1.5">
              {SCORES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  aria-pressed={score === value}
                  className={cn(
                    "h-9 min-w-10 rounded-md border text-sm font-medium transition-colors",
                    score === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="judge-comment" className="text-sm font-medium">
              Comments
            </label>
            <Textarea
              id="judge-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Why this score?"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save judgment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function JudgeTab() {
  const [replays, setReplays] = useState<Replay[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/replays?scope=judge")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReplayApi[]) => {
        if (!cancelled) {
          setReplays(data.map(replayFromApi))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleJudged = (updated: Replay) => {
    setReplays((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-xl font-semibold">Judge</h1>
        <p className="text-sm text-muted-foreground">
          Replays in the pool, newest first. Judge them to help good scores get
          rendered.
        </p>
      </header>

      {failed ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load the replay pool.
          </CardContent>
        </Card>
      ) : !loaded ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : replays.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm font-medium">
            No replays in the pool yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          {replays.map((replay) => (
            <ReplayCard
              key={replay.id}
              replay={replay}
              badges={
                replay.myJudgment ? (
                  <Badge variant="secondary">
                    My score: {replay.myJudgment.score}
                  </Badge>
                ) : (
                  <Badge variant="outline">Unjudged</Badge>
                )
              }
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<a href={`/replays/${replay.id}/file`} />}
                  >
                    <IconDownload />
                    Download
                  </Button>
                  <JudgeDialog replay={replay} onJudged={handleJudged} />
                </>
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}