import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const blobAccess = "private" as const;

export function getDataDirectory() {
  const configuredDirectory = process.env.RADAR_DATA_DIR?.trim();
  return configuredDirectory ? path.resolve(configuredDirectory) : path.join(process.cwd(), "data");
}

export function getDataFilePath(filename: string) {
  return path.join(getDataDirectory(), filename);
}

async function readBlobJson<T>(blobPathname: string): Promise<T | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const result = await get(blobPathname, { access: blobAccess });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    return (await new Response(result.stream).json()) as T;
  } catch (error) {
    console.warn(`[storage] Could not read ${blobPathname} from durable storage.`, error);
    return null;
  }
}

export async function readPersistedJson<T>(input: {
  filename: string;
  blobPathname: string;
  fallback: T;
}): Promise<T> {
  const remoteValue = await readBlobJson<T>(input.blobPathname);
  if (remoteValue) {
    return remoteValue;
  }

  try {
    const raw = await readFile(getDataFilePath(input.filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return input.fallback;
  }
}

export async function writePersistedJson(input: {
  filename: string;
  blobPathname: string;
  value: unknown;
}) {
  const serialized = JSON.stringify(input.value, null, 2);
  let remoteWriteSucceeded = false;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(input.blobPathname, serialized, {
        access: blobAccess,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: "application/json"
      });
      remoteWriteSucceeded = true;
    } catch (error) {
      console.warn(`[storage] Could not write ${input.blobPathname} to durable storage.`, error);
    }
  }

  try {
    const localPath = getDataFilePath(input.filename);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, serialized, "utf8");
  } catch (error) {
    if (!remoteWriteSucceeded) {
      throw error;
    }
  }
}
