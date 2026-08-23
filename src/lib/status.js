import { readFile, writeFile } from "node:fs/promises";

const STATUS_PATH = new URL("../../data/status.json", import.meta.url);

function nowIso() {
  return new Date().toISOString();
}

export async function readStatus() {
  try {
    const raw = await readFile(STATUS_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      return { generatedAt: nowIso(), cities: {} };
    }
    throw err;
  }
}

export async function writeStatus(status) {
  status.generatedAt = nowIso();
  await writeFile(STATUS_PATH, JSON.stringify(status, null, 2) + "\n", "utf8");
}

/**
 * Merges one city's sync outcome into a status object (pure, in-place mutation
 * of `status.cities[cityCode]`). Split out from recordCityResult so the CI retry
 * path (src/recordResult.js) can re-apply the same result against a freshly
 * pulled status.json without re-fetching the source API — status.json is shared
 * across every city's independent GitHub Actions workflow, so this merge must be
 * safe to replay against whatever the current committed state is.
 */
export function applyCityResult(status, cityCode, meta, result) {
  const existing = status.cities[cityCode] ?? {};

  const entry = {
    ...existing,
    ...meta,
    lastSuccessAt: existing.lastSuccessAt ?? null,
    lastFailureAt: existing.lastFailureAt ?? null,
    lastFailureReason: existing.lastFailureReason ?? null,
  };

  if (result.ok) {
    entry.lastSuccessAt = result.at ?? nowIso();
    entry.recordCount = result.recordCount ?? null;
    entry.latestSourceTime = result.latestSourceTime ?? null;
  } else {
    entry.lastFailureAt = result.at ?? nowIso();
    entry.lastFailureReason = result.reason ?? "UNKNOWN";
  }

  status.cities[cityCode] = entry;
}

/** Convenience for a single local run: read, merge, write in one go. */
export async function recordCityResult(cityCode, meta, result) {
  const status = await readStatus();
  applyCityResult(status, cityCode, meta, { ...result, at: nowIso() });
  await writeStatus(status);
}
