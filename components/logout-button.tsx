"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = useCallback(async () => {
    setLoading(true)
    try {
      await fetch("/auth/logout", { method: "POST" })
    } finally {
      router.replace("/")
      router.refresh()
    }
  }, [router])

  return (
    <Button onClick={handleLogout} variant="outline" disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  )
}