import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import path from "node:path"

export type UserRow = {
  osu_id: number
  username: string
  avatar_url: string
  country_code: string
  access_token: string
  refresh_token: string | null
  token_expires_at: number | null
  created_at: number
  updated_at: number
}

export type SessionRow = {
  token: string
  osu_id: number
  expires_at: number
  created_at: number
}

let db: Database | null = null

export function getDb(): Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db")
    mkdirSync(path.dirname(dbPath), { recursive: true })
    db = new Database(dbPath)
    db.exec("PRAGMA journal_mode = WAL")
    db.exec("PRAGMA foreign_keys = ON")
    migrate(db)
  }
  return db
}

function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      osu_id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      country_code TEXT NOT NULL DEFAULT '',
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      osu_id INTEGER NOT NULL REFERENCES users(osu_id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `)
  db.run("CREATE INDEX IF NOT EXISTS idx_sessions_osu_id ON sessions(osu_id)")
  db.run("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)")
}

export type UpsertUserInput = {
  osuId: number
  username: string
  avatarUrl: string
  countryCode: string
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: number | null
}

export function upsertUser(input: UpsertUserInput) {
  const now = Date.now()
  getDb().run(
    `INSERT INTO users (osu_id, username, avatar_url, country_code, access_token, refresh_token, token_expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(osu_id) DO UPDATE SET
       username = excluded.username,
       avatar_url = excluded.avatar_url,
       country_code = excluded.country_code,
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       token_expires_at = excluded.token_expires_at,
       updated_at = excluded.updated_at`,
    [
      input.osuId,
      input.username,
      input.avatarUrl,
      input.countryCode,
      input.accessToken,
      input.refreshToken,
      input.tokenExpiresAt,
      now,
      now,
    ],
  )
}

export function getUserByOsuId(osuId: number): UserRow | null {
  return getDb().query<UserRow, [number]>(
    "SELECT * FROM users WHERE osu_id = ?",
  ).get(osuId)
}