import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RadarStore } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

const defaultStore: RadarStore = {
  sources: [],
  signals: [],
  trendSummary: {
    generatedAt: new Date(0).toISOString(),
    last7d: [],
    last30d: [],
    chinaVsGlobal: "No trend summary generated yet."
  },
  lastUpdatedAt: null
};

export async function readStore(): Promise<RadarStore> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw) as RadarStore;
  } catch {
    await writeStore(defaultStore);
    return defaultStore;
  }
}

export async function writeStore(store: RadarStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

export function getStorePath() {
  return dataFile;
}
