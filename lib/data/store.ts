import { getDataFilePath, readPersistedJson, writePersistedJson } from "@/lib/data/persisted-json";
import { RadarStore } from "@/lib/types";

const defaultStore: RadarStore = {
  sources: [],
  signals: [],
  lastUpdatedAt: null
};

export async function readStore(): Promise<RadarStore> {
  return readPersistedJson({
    filename: "store.json",
    blobPathname: "ai-radar/store.json",
    fallback: defaultStore
  });
}

export async function writeStore(store: RadarStore) {
  await writePersistedJson({
    filename: "store.json",
    blobPathname: "ai-radar/store.json",
    value: store
  });
}

export function getStorePath() {
  return getDataFilePath("store.json");
}
