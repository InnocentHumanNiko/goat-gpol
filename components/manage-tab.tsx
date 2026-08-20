"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ReplayCard } from "@/components/replay-card"
import {
  Select,
  SelectItem,
  SelectItemText,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { VotingStatsDialog } from "@/components/voting-stats-dialog"
import {
  IconFileMusic,
  IconSettings,
  IconTrash,
  IconUserCheck,
  IconUserOff,
  IconUsers,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { isManager } from "@/lib/roles"
import {
  replayFromApi,
  type SessionUser,
  type Replay,
} from "@/components/app-shell"
import type { ReplayApi } from "@/lib/replay-types"
import type { JudgeSettings } from "@/lib/judging"

type ManageUser = {
  osuId: number
  username: string
  avatarUrl: string
  role: "basic" | "judge" | "admin" | "manager"
  bannedAt: number | null
}

type ManageSection = "thresholds" | "users" | "replays"

const MANAGE_SECTIONS: { id: ManageSection; label: string; icon: Icon }[] = [
  { id: "thresholds", label: "Thresholds", icon: IconSettings },
  { id: "users", label: "Users", icon: IconUsers },
  { id: "replays", label: "Replays", icon: IconFileMusic },
]

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
      onValueChange={(value) => onChange(value ?? "")}
    >
      <SelectTrigger className="h-8 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="basic">
          <SelectItemText>basic</SelectItemText>
        </SelectItem>
        <SelectItem value="judge">
          <SelectItemText>judge</SelectItemText>
        </SelectItem>
        {canGrantAdmin && (
          <SelectItem value="admin">
            <SelectItemText>admin</SelectItemText>
          </SelectItem>
        )}
      </SelectPopup>
    </Select>
  )
}

function ThresholdsPanel({
  settings,
  scoreDraft,
  percentDraft,
  onScoreChange,
  onPercentChange,
  onSave,
  saving,
  error,
}: {
  settings: JudgeSettings | null
  scoreDraft: string
  percentDraft: string
  onScoreChange: (value: string) => void
  onPercentChange: (value: string) => void
  onSave: () => void
  saving: boolean
  error: string | null
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">Judging thresholds</h2>
      <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">
          A replay moves to the Render pool when{" "}
          <span className="font-medium text-foreground">
            more than {settings?.thresholdPercent ?? 50}%
          </span>{" "}
          of all judges (users with Judge, Admin or Manager level) score it above{" "}
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
              onChange={(e) => onScoreChange(e.target.value)}
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
              onChange={(e) => onPercentChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save thresholds"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </section>
  )
}

function UsersPanel({
  users,
  actor,
  onChangeRole,
  onToggleBan,
}: {
  users: ManageUser[]
  actor: SessionUser
  onChangeRole: (user: ManageUser, role: string) => void
  onToggleBan: (user: ManageUser) => void
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">Users</h2>
      <div className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        {users.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No users yet.</p>
        ) : (
          users.map((u) => (
            <div
              key={u.osuId}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{u.username}</span>
                {u.bannedAt !== null && (
                  <Badge variant="destructive">banned</Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RoleSelect
                  user={u}
                  actor={actor}
                  onChange={(role) => onChangeRole(u, role)}
                />
                {u.role !== "manager" && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={
                            u.osuId === actor.osuId ||
                            (u.role === "admin" && !isManager(actor.role))
                          }
                          onClick={() => onToggleBan(u)}
                        />
                      }
                    >
                      {u.bannedAt === null ? <IconUserOff /> : <IconUserCheck />}
                    </TooltipTrigger>
                    <TooltipContent>
                      {u.bannedAt === null ? "Ban" : "Unban"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function ReplaysPanel({
  replays,
  onChangeStatus,
  onRemove,
}: {
  replays: Replay[]
  onChangeStatus: (replay: Replay, status: "pool" | "render") => void
  onRemove: (replay: Replay) => void
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">Replays</h2>
      <div className="flex flex-col divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        {replays.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            No replays submitted yet.
          </p>
        ) : (
          replays.map((replay) => (
            <ReplayCard
              key={replay.id}
              as="div"
              replay={replay}
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChangeStatus(
                        replay,
                        replay.status === "render" ? "pool" : "render",
                      )
                    }
                  >
                    {replay.status === "render" ? "Demote" : "Promote"}
                  </Button>
                  <VotingStatsDialog replay={replay} />
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Remove replay"
                    onClick={() => onRemove(replay)}
                  >
                    <IconTrash />
                  </Button>
                </>
              }
            />
          ))
        )}
      </div>
    </section>
  )
}

export function ManageTab({ user }: { user: SessionUser }) {
  const [section, setSection] = useState<ManageSection>("thresholds")
  const [users, setUsers] = useState<ManageUser[]>([])
  const [replays, setReplays] = useState<Replay[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
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
  }

  return (
    <div className="flex flex-col gap-6">
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
        <div className="grid md:grid-cols-[200px_1fr] md:items-start">
          <nav className="flex flex-col gap-1 pb-6 md:sticky md:top-20 md:border-r md:pb-0 md:pr-8">
            {MANAGE_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                aria-pressed={section === s.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  section === s.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <s.icon className="size-4" />
                {s.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 md:pl-8">
            {section === "thresholds" && (
              <ThresholdsPanel
                settings={settings}
                scoreDraft={scoreDraft}
                percentDraft={percentDraft}
                onScoreChange={setScoreDraft}
                onPercentChange={setPercentDraft}
                onSave={saveSettings}
                saving={savingSettings}
                error={settingsError}
              />
            )}
            {section === "users" && (
              <UsersPanel
                users={users}
                actor={user}
                onChangeRole={changeUserRole}
                onToggleBan={toggleBan}
              />
            )}
            {section === "replays" && (
              <ReplaysPanel
                replays={replays}
                onChangeStatus={setReplayStatus}
                onRemove={removeReplay}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}