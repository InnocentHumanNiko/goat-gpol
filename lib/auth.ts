import "server-only"
import * as osu from "osu-api-v2-js"

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
  return process.env.OSU_REDIRECT_URI ?? new URL("/api/auth/callback", origin).toString()
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