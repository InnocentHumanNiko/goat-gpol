"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const authErrorMessages: Record<string, string> = {
  access_denied: "You chose not to authorize the application. Try again whenever you're ready.",
  invalid_authorization: "The login attempt could not be verified. Please try again.",
  authorization_failed: "osu! could not be reached during login. Please try again.",
}

export function LoginPage({ authError }: { authError?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const handleLogin = useCallback(async () => {
    setLoading(true)
    setError(null)

    let url: string
    try {
      const res = await fetch("/api/auth/login")
      if (!res.ok) {
        throw new Error("login request failed")
      }
      const data = (await res.json()) as { url: string }
      url = data.url
    } catch {
      setError("Something went wrong while starting the login. Please try again.")
      setLoading(false)
      return
    }

    const win = window.open(url, "_blank")
    if (!win) {
      setError(
        "Your browser blocked opening a new tab. Please allow popups for this site and try again.",
      )
      setLoading(false)
      return
    }
    win.focus()

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" })
        const data = (await res.json()) as { authenticated: boolean }
        if (data.authenticated) {
          stopPolling()
          router.replace("/")
          router.refresh()
        }
      } catch {
        // ignore transient failures, keep polling
      }
    }, 1500)
  }, [router, stopPolling])

  const displayError =
    (authError ? authErrorMessages[authError] ?? authError : null) ?? error

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <p className="text-balance text-xl font-medium">Welcome.</p>
        <p className="text-balance text-sm text-muted-foreground">
          Please authenticate with your osu! account to get started.
        </p>
        {displayError && <p className="text-sm text-destructive">{displayError}</p>}
        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? "Connecting to osu!…" : "Continue with osu!"}
        </Button>
      </div>
    </div>
  )
}