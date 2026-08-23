import { fetchJson } from "../lib/http.js";
import { writeDataFile } from "../lib/dataFile.js";
import { parseCompactDateTime, maxIso } from "../lib/time.js";

export const cityCode = "taichung";

export const meta = {
  cityName: "台中市",
  tier: 1,
  updateFrequencyMinutes: 30,
  sourceDatasetUrl: "https://data.gov.tw/dataset/83558",
  licenseNote: "資料來源：臺中市政府環境保護局（政府資料開放授權條款-第1版）",
};

// NOTE: the dataset page documents `datacenter.taichung.gov.tw/swagger/yaml/387150000I`
// as the API, but that domain no longer resolves (DNS failure, verified 2026-08-23).
// This URL was recovered from the resource-download link on the data.gov.tw dataset
// page instead. If this endpoint starts failing, check for a domain change first —
// it is not officially documented and may move again.
const API_URL =
  "https://newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=c923ad20-2ec6-43b9-b3ab-54527e99f7bc";

function normalizeVehicle(raw) {
  return {
    normalized: {
      lineId: raw.lineid ?? null,
      plateNumber: raw.car ?? null,
      reportedAt: parseCompactDateTime(raw.time),
      location: {
        lat: raw.Y != null ? Number(raw.Y) : null,
        lng: raw.X != null ? Number(raw.X) : null,
        address: raw.location ?? null,
      },
    },
    raw,
  };
}

export async function sync() {
  const rows = await fetchJson(API_URL);
  if (!Array.isArray(rows)) {
    throw new Error("SCHEMA_MISMATCH");
  }

  const vehicles = rows.map(normalizeVehicle);
  const fetchedAt = new Date().toISOString();
  const latestSourceTime = maxIso(vehicles.map((v) => v.normalized.reportedAt));

  await writeDataFile("data/realtime/taichung.json", {
    city: cityCode,
    cityName: meta.cityName,
    tier: meta.tier,
    fetchedAt,
    sourceUpdatedAt: null,
    vehicles,
  });

  return { ok: true, recordCount: vehicles.length, latestSourceTime };
}
