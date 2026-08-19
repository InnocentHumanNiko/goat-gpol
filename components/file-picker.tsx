"use client"

import { useRef, useState, type DragEvent } from "react"

import { cn } from "@/lib/utils"

export function FilePicker({
  accept,
  label,
  hint,
  onFileChange,
}: {
  accept: string
  label: string
  hint: string
  onFileChange?: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const selectFile = (file: File | null) => {
    setFileName(file?.name ?? null)
    onFileChange?.(file)
  }

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0] ?? null
    selectFile(file)
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        dragging
          ? "border-ring bg-muted/60"
          : fileName
            ? "border-ring bg-muted/40"
            : "border-border hover:border-ring hover:bg-muted/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          selectFile(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />
      {fileName ? (
        <>
          <span className="truncate text-sm font-medium">{fileName}</span>
          <span className="text-xs text-muted-foreground">
            Click to choose a different file
          </span>
        </>
      ) : (
        <>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </>
      )}
    </button>
  )
}