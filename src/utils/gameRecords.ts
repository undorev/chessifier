import { appDataDir, resolve } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export interface GameRecord {
  id: string;
  white: {
    type: "human" | "engine";
    name?: string;
    engine?: string;
  };
  black: {
    type: "human" | "engine";
    name?: string;
    engine?: string;
  };
  result: string;
  timeControl?: string;
  timestamp: number;
  moves: string[];
  variant?: string;
  fen: string;
}

const FILENAME = "played_games.json";

export async function saveGameRecord(record: GameRecord) {
  const dir = await appDataDir();
  const file = await resolve(dir, FILENAME);
  let records: GameRecord[] = [];
  try {
    const text = await readTextFile(file);
    records = JSON.parse(text);
  } catch {
    // file may not exist yet
  }
  records.unshift(record);
  await writeTextFile(file, JSON.stringify(records));
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("games:updated"));
    } catch {
      // ignore
    }
  }
}

export async function getRecentGames(limit = 20): Promise<GameRecord[]> {
  const dir = await appDataDir();
  const file = await resolve(dir, FILENAME);
  try {
    const text = await readTextFile(file);
    const records: GameRecord[] = JSON.parse(text);
    return records.slice(0, limit);
  } catch {
    return [];
  }
}

export async function countGamesOnDate(date: Date = new Date()): Promise<number> {
  const dir = await appDataDir();
  const file = await resolve(dir, FILENAME);
  try {
    const text = await readTextFile(file);
    const records: GameRecord[] = JSON.parse(text);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    return records.filter((r) => {
      const dt = new Date(r.timestamp);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  } catch {
    return 0;
  }
}
