"use client"

import { useState } from "react"

import { ReplaysTab } from "@/components/replays-tab"
import { SiteNav } from "@/components/site-nav"
import { SkinsTab } from "@/components/skins-tab"

export type Tab = "replays" | "skins"

export type SessionUser = {
  osuId: number
  username: string
  avatarUrl: string
  countryCode: string
}

export type Skin = {
  id: number
  name: string
  createdAt: number
}

export type ReplayInput = {
  fileName: string
  skinName: string | null
  notes: string
}

export type Replay = ReplayInput & {
  id: number
  createdAt: number
}

export function AppShell({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState<Tab>("replays")
  const [replays, setReplays] = useState<Replay[]>([])
  const [skins, setSkins] = useState<Skin[]>([])

  const addSkin = (name: string) => {
    setSkins((prev) => [...prev, { id: Date.now(), name, createdAt: Date.now() }])
  }

  const addReplay = (input: ReplayInput) => {
    setReplays((prev) => [{ id: Date.now(), ...input, createdAt: Date.now() }, ...prev])
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav tab={tab} onTabChange={setTab} user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {tab === "replays" ? (
          <ReplaysTab replays={replays} skins={skins} onSubmit={addReplay} />
        ) : (
          <SkinsTab skins={skins} onUpload={addSkin} />
        )}
      </main>
    </div>
  )
}