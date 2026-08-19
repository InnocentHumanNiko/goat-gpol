"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ReplayCard } from "@/components/replay-card"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { isManager } from "@/lib/roles"
import {
  replayFromApi,
  type SessionUser,
  type Replay,
} from "@/components/app-shell"
import type { JudgmentApi, ReplayApi } from "@/lib/replay-types"
import type { JudgeSettings } from "@/lib/judging"

type ManageUser = {
  osuId: number
  username: string
  avatarUrl: string
  role: "basic" | "judge" | "admin" | "manager"
  bannedAt: number | null
}

const SCORES = [0, 1, 2, 3, 4, 5]

function RoleSelect({
  user,
  actor,
  onChange,
}: {
  user: ManageUser
  actor: SessionUser
  onChange: (role: string) => void
}) {
  const isManagerTarget = user.role === "manager"
  const canChangeAdmin = isManager(actor.role)
  const canGrantAdmin = canChangeAdmin || actor.role === "admin"
  const isSelf = user.osuId === actor.osuId
  const disabled =
    isSelf || isManagerTarget || (user.role === "admin" && !canChangeAdmin)

  if (isManagerTarget) {
    return <span className="text-xs font-medium">manager</span>
  }
  return (
    <Select
      value={user.role}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-28 text-xs"
    >
      <option value="basic">basic</option>
      <option value="judge">judge</option>
      {canGrantAdmin && <option value="admin">admin</option>}
    </Select>
  )
}

function JudgmentEditRow({
  judgment,
  onUpdate,
  onReset,
}: {
  judgment: JudgmentApi
  onUpdate: (score: number, comment: string) => Promise<void>
  onReset: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [score, setScore] = useState(judgment.score)
  const [comment, setComment] = useState(judgment.comment)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await onUpdate(score, comment)
      setEditing(false)
    } catch {
      setError("Could not update the judgment.")
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!window.confirm("Reset this judge's vote and comment?")) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onReset()
    } catch {
      setError("Could not reset the judgment.")
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">
          {judgment.judgeUsername}
        </span>
        {!editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">{judgment.score}</Badge>
            <Button variant="ghost" size="xs" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="ghost" size="xs" onClick={reset}>
              Reset
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="xs" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {judgment.comment !== "" ? judgment.comment : "No comment."}
      </p>
      {editing && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5">
            {SCORES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                aria-pressed={score === value}
                className="h-7 min-w-8 rounded-md border text-xs font-medium"
              >
                {value}
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment"
            className="min-h-0 text-sm"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button size="xs" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ManageTab({ user }: { user: SessionUser }) {
  const [users, setUsers] = useState<ManageUser[]>([])
  const [replays, setReplays] = useState<Replay[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [judgments, setJudgments] = useState<JudgmentApi[]>([])
  const [settings, setSettings] = useState<JudgeSettings | null>(null)
  const [scoreDraft, setScoreDraft] = useState("")
  const [percentDraft, setPercentDraft] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const refreshReplays = async () => {
    const res = await fetch("/replays?scope=all")
    if (!res.ok) {
      throw new Error("load-failed")
    }
    const data = (await res.json()) as ReplayApi[]
    setReplays(data.map(replayFromApi))
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([fetch("/users"), fetch("/replays?scope=all"), fetch("/settings")])
      .then(([usersRes, replaysRes, settingsRes]) =>
        Promise.all([
          usersRes.ok ? usersRes.json() : [],
          replaysRes.ok ? replaysRes.json() : [],
          settingsRes.ok ? settingsRes.json() : null,
        ]),
      )
      .then(([usersData, replaysData, settingsData]) => {
        if (cancelled) {
          return
        }
        setUsers(usersData as ManageUser[])
        setReplays((replaysData as ReplayApi[]).map(replayFromApi))
        if (settingsData) {
          const s = settingsData as JudgeSettings
          setSettings(s)
          setScoreDraft(String(s.thresholdScore))
          setPercentDraft(String(s.thresholdPercent))
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

  const saveSettings = async () => {
    const body: Partial<JudgeSettings> = {}
    const score = Number(scoreDraft)
    const percent = Number(percentDraft)
    if (Number.isInteger(score)) {
      body.thresholdScore = score
    }
    if (Number.isInteger(percent)) {
      body.thresholdPercent = percent
    }
    setSavingSettings(true)
    setSettingsError(null)
    try {
      const res = await fetch("/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        throw new Error("save-failed")
      }
      const updated = (await res.json()) as JudgeSettings
      setSettings(updated)
      setScoreDraft(String(updated.thresholdScore))
      setPercentDraft(String(updated.thresholdPercent))
      await refreshReplays()
    } catch {
      setSettingsError("Could not save the thresholds.")
    } finally {
      setSavingSettings(false)
    }
  }

  const toggleJudgments = async (replayId: number) => {
    if (expanded === replayId) {
      setExpanded(null)
      setJudgments([])
      return
    }
    const res = await fetch(`/replays/${replayId}/judgment`)
    if (res.ok) {
      setJudgments((await res.json()) as JudgmentApi[])
      setExpanded(replayId)
    }
  }

  const changeUserRole = async (target: ManageUser, role: string) => {
    const res = await fetch("/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ osuId: target.osuId, role }),
    })
    if (!res.ok) {
      window.alert("Could not change the user's role.")
      return
    }
    const updated = (await res.json()) as ManageUser
    setUsers((prev) => prev.map((u) => (u.osuId === updated.osuId ? updated : u)))
  }

  const toggleBan = async (target: ManageUser) => {
    const res = await fetch("/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ osuId: target.osuId, banned: target.bannedAt === null }),
    })
    if (!res.ok) {
      window.alert("Could not update the user.")
      return
    }
    const updated = (await res.json()) as ManageUser
    setUsers((prev) => prev.map((u) => (u.osuId === updated.osuId ? updated : u)))
  }

  const setReplayStatus = async (replay: Replay, status: "pool" | "render") => {
    const res = await fetch(`/replays/${replay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      window.alert("Could not change the replay's status.")
      return
    }
    const updated = (await res.json()) as ReplayApi
    setReplays((prev) => prev.map((r) => (r.id === updated.id ? replayFromApi(updated) : r)))
  }

  const removeReplay = async (replay: Replay) => {
    if (!window.confirm("Remove this replay and its file permanently?")) {
      return
    }
    const res = await fetch(`/replays/${replay.id}`, { method: "DELETE" })
    if (!res.ok) {
      window.alert("Could not remove the replay.")
      return
    }
    setReplays((prev) => prev.filter((r) => r.id !== replay.id))
    if (expanded === replay.id) {
      setExpanded(null)
      setJudgments([])
    }
  }

  const updateJudgment = async (judgment: JudgmentApi, score: number, comment: string) => {
    const res = await fetch(`/replays/${judgment.replayId}/judgment?judgeOsuId=${judgment.judgeOsuId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment }),
    })
    if (!res.ok) {
      throw new Error("update-failed")
    }
    setJudgments((await res.json()) as JudgmentApi[])
    await refreshReplays()
  }

  const resetJudgment = async (judgment: JudgmentApi) => {
    const res = await fetch(`/replays/${judgment.replayId}/judgment?judgeOsuId=${judgment.judgeOsuId}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      throw new Error("reset-failed")
    }
    setJudgments((prev) => prev.filter((j) => j.id !== judgment.id))
    await refreshReplays()
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-xl font-semibold">Manage</h1>
        <p className="text-sm text-muted-foreground">
          Don&apos;t abuse please...
        </p>
      </header>

      {failed ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load the dashboard.
          </CardContent>
        </Card>
      ) : !loaded ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold">
              Judging thresholds
            </h2>
            <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
              <p className="text-sm text-muted-foreground">
                A replay moves to the Render pool when{" "}
                <span className="font-medium text-foreground">
                  more than {settings?.thresholdPercent ?? 50}%
                </span>{" "}
                of all judges (users with Judge, Admin or Manager level) score it
                above{" "}
                <span className="font-medium text-foreground">
                  {settings?.thresholdScore ?? 3}
                </span>
                .
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="threshold-score" className="text-sm font-medium">
                    Vote must be above
                  </label>
                  <Input
                    id="threshold-score"
                    type="number"
                    min={0}
                    max={4}
                    value={scoreDraft}
                    onChange={(e) => setScoreDraft(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="threshold-percent" className="text-sm font-medium">
                    Percent of judges
                  </label>
                  <Input
                    id="threshold-percent"
                    type="number"
                    min={1}
                    max={100}
                    value={percentDraft}
                    onChange={(e) => setPercentDraft(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? "Saving…" : "Save thresholds"}
                </Button>
                {settingsError && (
                  <p className="text-sm text-destructive">{settingsError}</p>
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold">Users</h2>
            <div className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
              {users.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No users yet.
                </p>
              ) : (
                users.map((u) => (
                  <div
                    key={u.osuId}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {u.username}
                      </span>
                      {u.bannedAt !== null && (
                        <Badge variant="destructive">banned</Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RoleSelect
                        user={u}
                        actor={user}
                        onChange={(role) => changeUserRole(u, role)}
                      />
                      {u.role !== "manager" && (
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={
                            u.osuId === user.osuId ||
                            (u.role === "admin" && !isManager(user.role))
                          }
                          onClick={() => toggleBan(u)}
                        >
                          {u.bannedAt === null ? "Ban" : "Unban"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold">Replays</h2>
            <div className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
              {replays.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No replays submitted yet.
                </p>
              ) : (
                replays.map((replay) => (
                  <div key={replay.id} className="flex flex-col">
                    <ReplayCard
                      as="div"
                      replay={replay}
                      actions={
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setReplayStatus(
                                replay,
                                replay.status === "render" ? "pool" : "render",
                              )
                            }
                          >
                            {replay.status === "render" ? "Demote" : "Promote"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleJudgments(replay.id)}
                          >
                            {expanded === replay.id ? (
                              <IconChevronUp />
                            ) : (
                              <IconChevronDown />
                            )}
                            Judgments
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeReplay(replay)}
                          >
                            Remove
                          </Button>
                        </>
                      }
                    />
                    {expanded === replay.id && (
                      <div className="flex flex-col gap-2 border-t px-4 py-3">
                        {judgments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No judgments yet.
                          </p>
                        ) : (
                          judgments.map((judgment) => (
                            <JudgmentEditRow
                              key={judgment.id}
                              judgment={judgment}
                              onUpdate={(score, comment) =>
                                updateJudgment(judgment, score, comment)
                              }
                              onReset={() => resetJudgment(judgment)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}