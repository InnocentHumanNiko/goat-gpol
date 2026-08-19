import "server-only"
import * as osu from "osu-api-v2-js"
import { getDb, getUserByOsuId, type UserRow } from "./db"

const OAUTH_SCOPES: osu.Scope[] = ["identify", "public"]

function getClientId(): number {
  const raw = process.env.OSU_CLIENT_ID
  if (!raw) {
    throw new Error("OSU_CLIENT_ID environment variable is not set")
  }
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("OSU_CLIENT_ID environment variable must be a positive integer")
  }
  return id
}

function getClientSecret(): string {
  const secret = process.env.OSU_CLIENT_SECRET
  if (!secret) {
    throw new Error("OSU_CLIENT_SECRET environment variable is not set")
  }
  return secret
}

export function getRedirectUri(origin: string): string {
  return process.env.OSU_REDIRECT_URI ?? new URL("/auth/callback", origin).toString()
}

export function buildAuthorizationUrl(origin: string, state: string): string {
  const url = osu.generateAuthorizationURL(
    getClientId(),
    getRedirectUri(origin),
    OAUTH_SCOPES,
  )
  return `${url}&state=${encodeURIComponent(state)}`
}

export async function authorizeWithCode(code: string, redirectUri: string): Promise<osu.API> {
  return osu.API.createAsync(getClientId(), getClientSecret(), {
    redirect_uri: redirectUri,
    code,
  })
}

export async function getResourceOwner(api: osu.API) {
  return api.getResourceOwner()
}

export function createUserApi(user: UserRow, settings: Partial<osu.API> = {}): osu.API {
  return new osu.API({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    set_token_on_creation: false,
    access_token: user.access_token,
    refresh_token: user.refresh_token ?? undefined,
    expires: user.token_expires_at ? new Date(user.token_expires_at) : undefined,
    ...settings,
  })
}

export function persistUserTokens(osuId: number, api: osu.API) {
  const user = getUserByOsuId(osuId)
  if (!user) {
    return
  }
  const refreshToken = api.refresh_token ?? user.refresh_token
  const tokenExpiresAt = api.expires.getTime()
  if (
    api.access_token === user.access_token &&
    refreshToken === user.refresh_token &&
    tokenExpiresAt === user.token_expires_at
  ) {
    return
  }
  getDb().run(
    "UPDATE users SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = ? WHERE osu_id = ?",
    [api.access_token, refreshToken, tokenExpiresAt, Date.now(), osuId],
  )
}

export async function withUserApi<T>(
  osuId: number,
  fn: (api: osu.API) => Promise<T>,
): Promise<T> {
  const user = getUserByOsuId(osuId)
  if (!user) {
    throw new Error(`User ${osuId} not found`)
  }
  const api = createUserApi(user)
  if (user.refresh_token && user.token_expires_at !== null && Date.now() >= user.token_expires_at) {
    await api.setNewToken()
  }
  try {
    return await fn(api)
  } finally {
    persistUserTokens(osuId, api)
  }
}