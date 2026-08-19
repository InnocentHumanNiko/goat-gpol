"use client"

import { useState, type FormEvent } from "react"

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
import { Input } from "@/components/ui/input"
import { IconPalette, IconUpload } from "@tabler/icons-react"
import type { Skin } from "@/components/app-shell"

function SkinUploadForm({
  onUpload,
}: {
  onUpload: (name: string) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || name.trim() === "" || uploading) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      await onUpload(name.trim())
    } catch {
      setError("Could not upload the skin. Please try again.")
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Upload a skin</DialogTitle>
        <DialogDescription>
          Skins are attached to replay submissions and used when your replay gets
          rendered.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Skin file</span>
          <FilePicker
            accept=".osk"
            label="Choose a .osk skin"
            hint="or drag and drop it here"
            onFileChange={setFile}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="skin-name" className="text-sm font-medium">
            Skin name
          </label>
          <Input
            id="skin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. vaxei skin edit"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={!file || name.trim() === "" || uploading}>
          {uploading ? "Uploading…" : "Upload skin"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <IconPalette className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No skins yet</p>
        <p className="text-sm text-muted-foreground">
          Upload a skin and it will be available when you submit a replay.
        </p>
      </CardContent>
    </Card>
  )
}

export function SkinsTab({
  skins,
  onUpload,
  canSubmit,
}: {
  skins: Skin[]
  onUpload: (name: string) => Promise<void>
  canSubmit: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold">Skins</h1>
          <p className="text-sm text-muted-foreground">
            Skins you have uploaded to use in replay submissions.
          </p>
        </div>
        {canSubmit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <IconUpload />
              Upload skin
            </DialogTrigger>
            <DialogContent>
              <SkinUploadForm
                onUpload={async (name) => {
                  await onUpload(name)
                  setOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are banned from uploading new skins.
          </p>
        )}
      </header>

      {skins.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col divide-y rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          {skins.map((skin) => (
            <li
              key={skin.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <IconPalette className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{skin.name}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(skin.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}