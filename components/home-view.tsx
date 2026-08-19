import Image from "next/image"
import { LogoutButton } from "@/components/logout-button"
import type { UserRow } from "@/lib/db"

export function HomeView({ user }: { user: UserRow }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <Image
          src={user.avatar_url}
          alt={`${user.username} avatar`}
          className="size-20 rounded-full"
          width={80}
          height={80}
          unoptimized
        />
        <div className="flex flex-col gap-1">
          <p className="text-xl font-medium">Welcome, {user.username}!</p>
          <p className="text-sm text-muted-foreground">
            You are signed in with your osu! account.
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}