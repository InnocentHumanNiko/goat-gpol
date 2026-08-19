"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReplayCard } from "@/components/replay-card"
import { IconDownload } from "@tabler/icons-react"
import { replayFromApi, type Replay } from "@/components/app-shell"
import type { ReplayApi } from "@/lib/replay-types"

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
              badges={
                replay.judgmentSummary.average !== null ? (
                  <Badge variant="secondary">
                    {replay.judgmentSummary.count}×{" "}
                    {replay.judgmentSummary.average.toFixed(2)}
                  </Badge>
                ) : undefined
              }
              actions={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  render={<a href={`/replays/${replay.id}/file`} />}
                >
                  <IconDownload />
                </Button>
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}