import { createClient } from "@libsql/client";
import { join } from "path";

const DB_PATH = process.env.DB_PATH || join(process.cwd(), "data", "gazette.db");

let _client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!_client) {
    _client = createClient({ url: `file:${DB_PATH}` });
  }
  return _client;
}

export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      headline TEXT,
      verdict TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export interface Entry {
  id: number;
  text: string;
  date: string;
  category: string;
  headline: string;
  verdict: string;
  created_at: string;
}