import { deleteSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function POST() {
  await deleteSession()
  return new Response(null, { status: 204 })
}