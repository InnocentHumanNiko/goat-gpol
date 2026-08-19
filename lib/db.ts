import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import path from "node:path"
import type { ReplayApi } from "@/lib/replay-types"

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

    CREATE TABLE IF NOT EXISTS replays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      osu_id INTEGER NOT NULL REFERENCES users(osu_id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      skin_name TEXT,
      beatmap_checksum TEXT NOT NULL,
      beatmap_id INTEGER NOT NULL,
      beatmap_title TEXT NOT NULL,
      beatmap_artist TEXT NOT NULL,
      beatmap_creator TEXT NOT NULL,
      beatmap_version TEXT NOT NULL,
      beatmap_star_rating REAL NOT NULL,
      beatmap_max_combo INTEGER NOT NULL,
      beatmap_url TEXT NOT NULL,
      beatmap_background_url TEXT NOT NULL,
      beatmap_cover_list_url TEXT NOT NULL,
      score_rank TEXT NOT NULL,
      score_username TEXT NOT NULL,
      score_date INTEGER NOT NULL,
      score_total INTEGER NOT NULL,
      score_max_combo INTEGER NOT NULL,
      score_accuracy REAL NOT NULL,
      score_mods TEXT NOT NULL,
      score_count_geki INTEGER NOT NULL,
      score_count_katu INTEGER NOT NULL,
      score_count_300 INTEGER NOT NULL,
      score_count_100 INTEGER NOT NULL,
      score_count_50 INTEGER NOT NULL,
      score_count_miss INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `)
  db.run("CREATE INDEX IF NOT EXISTS idx_sessions_osu_id ON sessions(osu_id)")
  db.run("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)")
  db.run("CREATE INDEX IF NOT EXISTS idx_replays_created_at ON replays(created_at DESC)")
  db.run("CREATE INDEX IF NOT EXISTS idx_replays_osu_id ON replays(osu_id)")
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

export type ReplayRow = {
  id: number
  osu_id: number
  file_path: string
  file_name: string
  notes: string
  skin_name: string | null
  beatmap_checksum: string
  beatmap_id: number
  beatmap_title: string
  beatmap_artist: string
  beatmap_creator: string
  beatmap_version: string
  beatmap_star_rating: number
  beatmap_max_combo: number
  beatmap_url: string
  beatmap_background_url: string
  beatmap_cover_list_url: string
  score_rank: string
  score_username: string
  score_date: number
  score_total: number
  score_max_combo: number
  score_accuracy: number
  score_mods: string
  score_count_geki: number
  score_count_katu: number
  score_count_300: number
  score_count_100: number
  score_count_50: number
  score_count_miss: number
  created_at: number
}

export type ReplayWithSubmitter = ReplayRow & { submitter_username: string }

export type NewReplay = {
  osuId: number
  fileName: string
  skinName: string | null
  notes: string
  beatmapChecksum: string
  beatmap: {
    id: number
    title: string
    artist: string
    creator: string
    version: string
    starRating: number
    maxCombo: number
    url: string
    backgroundUrl: string
    coverListUrl: string
  }
  score: {
    rank: string
    username: string
    date: number
    totalScore: number
    maxCombo: number
    accuracy: number
    mods: string[]
    countGeki: number
    countKatu: number
    count300: number
    count100: number
    count50: number
    countMiss: number
  }
}

export function insertReplay(input: NewReplay): number {
  const result = getDb().run(
    `INSERT INTO replays (
       osu_id, file_path, file_name, notes, skin_name,
       beatmap_checksum, beatmap_id, beatmap_title, beatmap_artist, beatmap_creator,
       beatmap_version, beatmap_star_rating, beatmap_max_combo, beatmap_url,
       beatmap_background_url, beatmap_cover_list_url,
       score_rank, score_username, score_date, score_total, score_max_combo,
       score_accuracy, score_mods,
       score_count_geki, score_count_katu, score_count_300, score_count_100,
       score_count_50, score_count_miss,
       created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.osuId,
      "",
      input.fileName,
      input.notes,
      input.skinName,
      input.beatmapChecksum,
      input.beatmap.id,
      input.beatmap.title,
      input.beatmap.artist,
      input.beatmap.creator,
      input.beatmap.version,
      input.beatmap.starRating,
      input.beatmap.maxCombo,
      input.beatmap.url,
      input.beatmap.backgroundUrl,
      input.beatmap.coverListUrl,
      input.score.rank,
      input.score.username,
      input.score.date,
      input.score.totalScore,
      input.score.maxCombo,
      input.score.accuracy,
      JSON.stringify(input.score.mods),
      input.score.countGeki,
      input.score.countKatu,
      input.score.count300,
      input.score.count100,
      input.score.count50,
      input.score.countMiss,
      Date.now(),
    ],
  )
  return Number(result.lastInsertRowid)
}

export function updateReplayFilePath(id: number, filePath: string) {
  getDb().run("UPDATE replays SET file_path = ? WHERE id = ?", [filePath, id])
}

export function getReplayById(id: number): ReplayWithSubmitter | null {
  return getDb().query<ReplayWithSubmitter, [number]>(
    `SELECT r.*, u.username AS submitter_username
     FROM replays r
     JOIN users u ON u.osu_id = r.osu_id
     WHERE r.id = ?`,
  ).get(id)
}

export function listReplays(): ReplayWithSubmitter[] {
  return getDb().query<ReplayWithSubmitter, []>(
    `SELECT r.*, u.username AS submitter_username
     FROM replays r
     JOIN users u ON u.osu_id = r.osu_id
     ORDER BY r.created_at DESC`,
  ).all()
}

export function replayRowToApi(row: ReplayWithSubmitter): ReplayApi {
  return {
    id: row.id,
    createdAt: row.created_at,
    fileName: row.file_name,
    skinName: row.skin_name,
    notes: row.notes,
    beatmapChecksum: row.beatmap_checksum,
    beatmap: {
      id: row.beatmap_id,
      title: row.beatmap_title,
      artist: row.beatmap_artist,
      creator: row.beatmap_creator,
      version: row.beatmap_version,
      starRating: row.beatmap_star_rating,
      maxCombo: row.beatmap_max_combo,
      url: row.beatmap_url,
      backgroundUrl: row.beatmap_background_url,
      coverListUrl: row.beatmap_cover_list_url,
    },
    score: {
      rank: row.score_rank,
      username: row.score_username,
      date: row.score_date,
      totalScore: row.score_total,
      maxCombo: row.score_max_combo,
      accuracy: row.score_accuracy,
      mods: JSON.parse(row.score_mods) as string[],
      countGeki: row.score_count_geki,
      countKatu: row.score_count_katu,
      count300: row.score_count_300,
      count100: row.score_count_100,
      count50: row.score_count_50,
      countMiss: row.score_count_miss,
    },
    submitter: { osuId: row.osu_id, username: row.submitter_username },
  }
}