"use client"

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
import { FilePicker } from "@/components/file-picker"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconFile, IconUpload } from "@tabler/icons-react"
import type { Replay, ReplayInput, Skin } from "@/components/app-shell"

function ReplaySubmitForm({
  skins,
  onSubmit,
}: {
  skins: Skin[]
  onSubmit: (input: ReplayInput) => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [skinId, setSkinId] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fileName) {
      return
    }
    onSubmit({
      fileName,
      skinName: skins.find((s) => s.id === Number(skinId))?.name ?? null,
      notes: notes.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Submit a replay</DialogTitle>
        <DialogDescription>
          Upload a .osr replay and tell the admins why it deserves a closer look.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Replay file</span>
          <FilePicker
            accept=".osr"
            label="Choose a .osr replay"
            hint="or drag and drop it here"
            onFileChange={setFileName}
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
              {skins.length === 0 ? "No skins yet" : "Select a skin"}
            </option>
            {skins.map((skin) => (
              <option key={skin.id} value={skin.id}>
                {skin.name}
              </option>
            ))}
          </Select>
          {skins.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No skins yet — upload one in the Skins tab so you can pick it here.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="replay-notes" className="text-sm font-medium">
            Why should we look at this?
          </label>
          <Textarea
            id="replay-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. the slider velocity here is unhinged and the aim is questionable…"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={!fileName}>
          Submit replay
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
        <p className="text-sm text-muted-foreground">
          Submit your first .osr replay and it will show up here.
        </p>
      </CardContent>
    </Card>
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
            Replays you have submitted to the judging pool.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <IconUpload />
            Submit replay
          </DialogTrigger>
          <DialogContent>
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
        <ul className="flex flex-col divide-y rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          {replays.map((replay) => (
            <li key={replay.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <IconFile className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {replay.fileName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {replay.skinName && (
                    <Badge variant="outline">{replay.skinName}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(replay.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {replay.notes !== "" && (
                <p className="pl-6 text-sm text-muted-foreground">
                  {replay.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}