import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { resolve } from "path";

const CACHE_ROOT = resolve(process.cwd(), "storage/audio-cache");
const CACHE_DIR_MATERIALS = resolve(CACHE_ROOT, "materials");

type CacheKeyInput = {
  text: string;
  voiceType: string;
  speed: number;
  pitch: number;
  volume: number;
};

export function audioCacheKey(input: CacheKeyInput): string {
  const payload = [
    input.text,
    "volcengine",
    input.voiceType,
    input.speed.toFixed(2),
    input.pitch.toFixed(2),
    input.volume.toFixed(2),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function getCachePath(materialId: string | undefined, hash: string): string {
  if (materialId) {
    const dir = resolve(CACHE_DIR_MATERIALS, materialId);
    ensureDir(dir);
    return resolve(dir, `${hash}.mp3`);
  }
  const globalDir = resolve(CACHE_ROOT, "_global");
  ensureDir(globalDir);
  return resolve(globalDir, `${hash}.mp3`);
}

export function getCachedAudio(hash: string, materialId?: string): Buffer | null {
  const filePath = getCachePath(materialId, hash);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath);
}

export function setCachedAudio(hash: string, buffer: Buffer, materialId?: string): void {
  const filePath = getCachePath(materialId, hash);
  writeFileSync(filePath, buffer);
}

export function deleteMaterialAudioCache(materialId: string): void {
  try {
    const dir = resolve(CACHE_DIR_MATERIALS, materialId);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Failed to delete audio cache for material ${materialId}:`, error);
  }
}
