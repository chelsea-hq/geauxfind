import { promises as fs } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");

export async function ensureJsonFile<T>(fileName: string, fallback: T) {
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, fileName);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
  return filePath;
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = await ensureJsonFile(fileName, fallback);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(fileName: string, data: T) {
  const filePath = await ensureJsonFile(fileName, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
