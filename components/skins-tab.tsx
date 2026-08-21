"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FilePicker } from "@/components/file-picker"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import {
  IconChevronDown,
  IconPalette,
  IconUpload,
} from "@tabler/icons-react"
import type { SkinRuleset, UploadProgress } from "@/lib/skin-upload"
import { cn } from "@/lib/utils"
import {
  OsuCatchIcon,
  OsuIcon,
  OsuManiaIcon,
  OsuTaikoIcon,
} from "@/components/ruleset-icons"
import type { Skin } from "@/components/app-shell"

const RULESET_OPTIONS: {
  id: SkinRuleset
  label: string
  icon: typeof OsuIcon
}[] = [
  { id: "osu", label: "osu!", icon: OsuIcon },
  { id: "mania", label: "osu!mania", icon: OsuManiaIcon },
  { id: "catch", label: "osu!catch", icon: OsuCatchIcon },
  { id: "taiko", label: "osu!taiko", icon: OsuTaikoIcon },
]

function SkinUploadForm({
  onUpload,
}: {
  onUpload: (
    name: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    rulesets?: SkinRuleset[],
    scrollSpeed?: number,
  ) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [rulesets, setRulesets] = useState<SkinRuleset[]>(["osu"])
  const [scrollSpeed, setScrollSpeed] = useState(25)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleRuleset = (id: SkinRuleset, checked: boolean) => {
    setRulesets((prev) =>
      checked ? [...prev, id] : prev.filter((r) => r !== id),
    )
  }

  const selectedLabels = RULESET_OPTIONS.filter((option) =>
    rulesets.includes(option.id),
  ).map((option) => option.label)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || name.trim() === "" || uploading || rulesets.length === 0) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      await onUpload(
        name.trim(),
        file,
        setProgress,
        [...rulesets],
        rulesets.includes("mania") ? scrollSpeed : undefined,
      )
    } catch {
      setError("Could not upload the skin. Please try again.")
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Upload a skin</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Skin file</span>
          <FilePicker
            accept=".osk"
            label="Pick a skin file"
            hint="or drag and drop it here"
            onFileChange={setFile}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Ruleset</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Ruleset"
              className={cn(
                "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50",
                rulesets.length === 0 && "text-muted-foreground",
              )}
            >
              <span className="line-clamp-1 truncate">
                {selectedLabels.length > 0 ? selectedLabels.join(", ") : "None selected"}
              </span>
              <IconChevronDown className="size-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {RULESET_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.id}
                  checked={rulesets.includes(option.id)}
                  onCheckedChange={(checked) =>
                    toggleRuleset(option.id, checked === true)
                  }
                  closeOnClick={false}
                >
                  <span className="flex items-center gap-2">
                    <option.icon className="size-3.5 shrink-0" />
                    {option.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {rulesets.includes("mania") && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scroll Speed</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {scrollSpeed.toFixed(1)}
              </span>
            </div>
            <Slider
              value={scrollSpeed}
              onValueChange={(value) =>
                setScrollSpeed(Array.isArray(value) ? value[0] : value)
              }
              min={1}
              max={40}
              step={0.5}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="skin-name" className="text-sm font-medium">
            Skin name
          </label>
          <Input
            id="skin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="leaked owc skin"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        {uploading && progress && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground sm:mr-auto">
            <Spinner />
            {progress.percent}% done ({progress.mbps.toFixed(1)}mb/s)
          </p>
        )}
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button
          type="submit"
          disabled={
            !file ||
            name.trim() === "" ||
            rulesets.length === 0 ||
            uploading
          }
        >
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
  onUpload: (
    name: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    rulesets?: SkinRuleset[],
    scrollSpeed?: number,
  ) => Promise<void>
  canSubmit: boolean
}) {
  const [open, setOpen] = useState(false)

  const handleUpload = async (
    name: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    rulesets?: SkinRuleset[],
    scrollSpeed?: number,
  ) => {
    await onUpload(name, file, onProgress, rulesets, scrollSpeed)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold">Skins</h1>
          <p className="text-sm text-muted-foreground">
            Custom skins to be used when rendering.
          </p>
        </div>
        {canSubmit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <IconUpload />
              Upload skin
            </DialogTrigger>
            <DialogContent>
              <SkinUploadForm onUpload={handleUpload} />
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
              <div className="flex min-w-0 items-start gap-2">
                <IconPalette className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {skin.name}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Uploaded by{" "}
                    <a
                      href={`https://osu.ppy.sh/users/${skin.submitter.osuId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground hover:underline underline-offset-2"
                    >
                      {skin.submitter.username}
                    </a>{" "}
                    on {new Date(skin.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}