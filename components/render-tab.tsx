"use client"

import { useEffect, useState } from "react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconChartBar, IconDownload } from "@tabler/icons-react"
import { replayFromApi, type Replay } from "@/components/app-shell"
import type { JudgmentApi, ReplayApi } from "@/lib/replay-types"

function VotingStatsDialog({ replay }: { replay: Replay }) {
  const [open, setOpen] = useState(false)
  const [judgments, setJudgments] = useState<JudgmentApi[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    fetch(`/replays/${replay.id}/judgment`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("load-failed")
        }
        const data = (await res.json()) as JudgmentApi[]
        if (!cancelled) {
          setJudgments(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, replay.id])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setJudgments(null)
          setFailed(false)
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <IconChartBar />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voting stats</DialogTitle>
          <DialogDescription>
            {replay.beatmap.artist} - {replay.beatmap.title} [
            {replay.beatmap.version}]
          </DialogDescription>
        </DialogHeader>
        {failed ? (
          <p className="text-sm text-muted-foreground">
            Could not load the votes.
          </p>
        ) : judgments === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : judgments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No votes yet.</p>
        ) : (
          <ul className="flex flex-col divide-y overflow-hidden rounded-md border">
            {judgments.map((judgment) => (
              <li key={judgment.id} className="flex flex-col gap-1 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage
                        src={judgment.judgeAvatarUrl}
                        alt={`${judgment.judgeUsername} avatar`}
                      />
                      <AvatarFallback>
                        {judgment.judgeUsername.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">
                      {judgment.judgeUsername}
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {judgment.score.toFixed(2)}
                  </span>
                </div>
                {judgment.comment && (
                  <p className="text-sm text-muted-foreground">
                    {judgment.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter className="mt-4">
          <DialogClose render={<Button variant="outline" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RenderTab() {
  const [replays, setReplays] = useState<Replay[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/replays?scope=render")
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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-xl font-semibold">Render</h1>
        <p className="text-sm text-muted-foreground">
          Passed quality control
        </p>
      </header>

      {failed ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load the render pool.
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
            No replays in the render pool yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          {replays.map((replay) => (
            <ReplayCard
              key={replay.id}
              replay={replay}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<a href={`/replays/${replay.id}/file`} />}
                  >
                    <IconDownload />
                  </Button>
                  {replay.manual && replay.status === "render" ? (
                    <Button variant="ghost" size="icon-sm" disabled>
                      <IconChartBar />
                    </Button>
                  ) : (
                    <VotingStatsDialog replay={replay} />
                  )}
                </>
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}