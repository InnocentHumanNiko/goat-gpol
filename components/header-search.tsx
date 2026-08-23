"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconSearch, IconX } from "@tabler/icons-react"

export function HeaderSearch({
  onChange,
}: {
  onChange: (query: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const close = () => {
    setOpen(false)
    setValue("")
    onChange("")
  }

  if (!open) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setOpen(true)}
            />
          }
        >
          <IconSearch />
        </TooltipTrigger>
        <TooltipContent>Search</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="relative">
      <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            close()
          }
        }}
        placeholder="Search"
        className="w-44 pr-8 pl-8"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close search"
        onClick={close}
        className="absolute top-1/2 right-0.5 -translate-y-1/2"
      >
        <IconX />
      </Button>
    </div>
  )
}
