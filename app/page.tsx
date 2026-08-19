import { HomeView } from "@/components/home-view"
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
  return <HomeView user={user} />
}