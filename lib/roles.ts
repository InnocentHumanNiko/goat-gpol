import type { Role } from "@/lib/replay-types"

const ROLE_LEVEL: Record<Role, number> = {
  basic: 0,
  judge: 1,
  admin: 2,
  manager: 3,
}

export function atLeast(role: Role, min: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[min]
}

export function canJudge(role: Role): boolean {
  return atLeast(role, "judge")
}

export function canAdmin(role: Role): boolean {
  return atLeast(role, "admin")
}

export function isManager(role: Role): boolean {
  return role === "manager"
}