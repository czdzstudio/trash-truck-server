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
 * Records the outcome of one city's sync into the shared status object.
 * `meta` carries the city's static description (name, tier, source url, license note);
 * only the fields that actually changed this run are updated.
 */
export async function recordCityResult(cityCode, meta, result) {
  const status = await readStatus();
  const existing = status.cities[cityCode] ?? {};

  const entry = {
    ...existing,
    ...meta,
    lastSuccessAt: existing.lastSuccessAt ?? null,
    lastFailureAt: existing.lastFailureAt ?? null,
    lastFailureReason: existing.lastFailureReason ?? null,
  };

  if (result.ok) {
    entry.lastSuccessAt = nowIso();
    entry.recordCount = result.recordCount ?? null;
    entry.latestSourceTime = result.latestSourceTime ?? null;
  } else {
    entry.lastFailureAt = nowIso();
    entry.lastFailureReason = result.reason ?? "UNKNOWN";
  }

  status.cities[cityCode] = entry;
  await writeStatus(status);
}
