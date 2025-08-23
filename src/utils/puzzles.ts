import { appDataDir, resolve } from "@tauri-apps/api/path";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import { commands, type PuzzleDatabaseInfo } from "@/bindings";
import type { Directory, FileInfoMetadata, FileMetadata } from "@/features/files/components/file";
import { logger } from "./logger";
import { unwrap } from "./unwrap";

export const PUZZLE_DEBUG_LOGS = false;

export type Completion = "correct" | "incorrect" | "incomplete";

export interface Puzzle {
  fen: string;
  moves: string[];
  rating: number;
  rating_deviation: number;
  popularity: number;
  nb_plays: number;
  completion: Completion;
}

// Elo rating configuration
export const ELO_K_FACTOR = 40;
export const PROGRESSIVE_MIN_PROB = 0.4;
export const PROGRESSIVE_MAX_PROB = 0.6;

// Simple Elo-like rating calculations
export function expectedScore(playerRating: number, puzzleRating: number): number {
  return 1 / (1 + 10 ** ((puzzleRating - playerRating) / 400));
}

export function updateElo(
  playerRating: number,
  puzzleRating: number,
  solved: boolean,
  kFactor: number = ELO_K_FACTOR,
): number {
  const score = solved ? 1 : 0;
  const expected = expectedScore(playerRating, puzzleRating);
  const newRating = playerRating + kFactor * (score - expected);

  PUZZLE_DEBUG_LOGS &&
    logger.debug("Elo calculation:", {
      playerRating: Math.round(playerRating),
      puzzleRating,
      solved,
      kFactor,
      expected: expected.toFixed(3),
      score,
      newRating: Math.round(newRating),
      change: Math.round(newRating - playerRating),
    });

  return Math.round(newRating);
}

// Probability-based range (select puzzles that give expected success rate between minP and maxP)
export function getPuzzleRangeProb(
  playerRating: number,
  minProb: number = PROGRESSIVE_MIN_PROB,
  maxProb: number = PROGRESSIVE_MAX_PROB,
): [number, number] {
  // Invert the Elo expected score formula to find puzzle rating bounds
  const invertElo = (expected: number): number => {
    return playerRating + 400 * Math.log10(1 / expected - 1);
  };

  const lowerBound = invertElo(maxProb); // easier puzzles (higher success chance)
  const upperBound = invertElo(minProb); // harder puzzles (lower success chance)
  const range: [number, number] = [Math.round(lowerBound), Math.round(upperBound)];

  PUZZLE_DEBUG_LOGS &&
    logger.debug("Puzzle range calculation:", {
      playerRating,
      minProb,
      maxProb,
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      range,
    });

  return range;
}

async function getPuzzleDatabase(name: string): Promise<PuzzleDatabaseInfo> {
  const appDataDirPath = await appDataDir();
  const path = await resolve(appDataDirPath, "puzzles", name);
  return unwrap(await commands.getPuzzleDbInfo(path));
}

export async function getPuzzleDatabases(localFiles: (FileMetadata | Directory)[]): Promise<PuzzleDatabaseInfo[]> {
  let dbPuzzles: PuzzleDatabaseInfo[] = [];

  // Get .db3 puzzle databases from AppData/puzzles folder
  try {
    const files = await readDir("puzzles", { baseDir: BaseDirectory.AppData });
    const dbs = files.filter((file) => file.name?.endsWith(".db3"));
    dbPuzzles = (await Promise.allSettled(dbs.map((db) => getPuzzleDatabase(db.name))))
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<PuzzleDatabaseInfo>).value);
    logger.debug(
      "Loaded puzzle databases:",
      dbPuzzles.map((db) => ({ title: db.title, puzzleCount: db.puzzleCount })),
    );
  } catch (err) {
    logger.error("Error loading .db3 puzzles:", err);
  }

  // Get local .pgn puzzle files from document directory
  let localPuzzles: PuzzleDatabaseInfo[] = [];
  try {
    const puzzleFiles = localFiles.filter((file): file is FileMetadata => {
      if (file.type !== "file" || !file.path.endsWith(".pgn")) return false;
      const fileInfo = file.metadata as FileInfoMetadata;
      return fileInfo?.type === "puzzle";
    });

    // Convert puzzle files to database format
    localPuzzles = await Promise.all(
      puzzleFiles.map(async (file) => {
        const stats = unwrap(await commands.getFileMetadata(file.path));
        return {
          title: file.name.replace(".pgn", ""),
          description: "Custom puzzle collection",
          puzzleCount: unwrap(await commands.countPgnGames(file.path)),
          storageSize: stats.last_modified,
          path: file.path,
        };
      }),
    );
  } catch (err) {
    logger.error("Error loading local puzzles:", err);
  }

  // Combine both types of puzzle sources
  return [...dbPuzzles, ...localPuzzles];
}
