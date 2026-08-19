import { AppShell } from "@/components/app-shell"
import { LoginPage } from "@/components/login-page"
import { getSessionUser } from "@/lib/session"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { auth_error } = await searchParams
  const authError = typeof auth_error === "string" ? auth_error : undefined

  const user = await getSessionUser()
  if (!user) {
    return <LoginPage authError={authError} />
  }
  return (
    <AppShell
      user={{
        osuId: user.osu_id,
        username: user.username,
        avatarUrl: user.avatar_url,
        countryCode: user.country_code,
      }}
    />
  )
}