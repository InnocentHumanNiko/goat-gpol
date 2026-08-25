import { getSkinLimits } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  return Response.json(getSkinLimits())
}
