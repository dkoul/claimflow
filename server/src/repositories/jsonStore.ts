import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../utils/errors.js";

const writeQueues = new Map<string, Promise<void>>();

async function atomicWrite(filePath: string, data: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, data, "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new AppError(500, `Data file missing: ${path.basename(filePath)}`, "DATA_MISSING");
    }
    if (err instanceof SyntaxError) {
      throw new AppError(500, `Invalid JSON in ${path.basename(filePath)}`, "DATA_CORRUPT");
    }
    throw err;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const serialized = JSON.stringify(data, null, 2) + "\n";
  const previous = writeQueues.get(filePath) ?? Promise.resolve();

  const next = previous
    .catch(() => undefined)
    .then(async () => {
      await atomicWrite(filePath, serialized);
    });

  writeQueues.set(filePath, next);
  await next;
}
