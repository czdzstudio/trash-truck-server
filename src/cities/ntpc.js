import { fetchJson } from "../lib/http.js";
import { writeDataFile } from "../lib/dataFile.js";
import { parseSlashDateTime, maxIso } from "../lib/time.js";

export const cityCode = "ntpc";

export const meta = {
  cityName: "新北市",
  tier: 1,
  updateFrequencyMinutes: 2,
  sourceDatasetUrl: "https://data.gov.tw/dataset/122972",
  licenseNote: "資料來源：新北市政府環境保護局（政府資料開放授權條款-第1版）",
};

const API_URL =
  "https://data.ntpc.gov.tw/api/datasets/28ab4122-60e1-4065-98e5-abccb69aaca6/json?page=0&size=1000";

function normalizeVehicle(raw) {
  return {
    normalized: {
      lineId: raw.lineid ?? null,
      plateNumber: raw.car ?? null,
      reportedAt: parseSlashDateTime(raw.time),
      location: {
        lat: raw.latitude != null ? Number(raw.latitude) : null,
        lng: raw.longitude != null ? Number(raw.longitude) : null,
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

  await writeDataFile("data/realtime/ntpc.json", {
    city: cityCode,
    cityName: meta.cityName,
    tier: meta.tier,
    fetchedAt,
    sourceUpdatedAt: null,
    vehicles,
  });

  return { ok: true, recordCount: vehicles.length, latestSourceTime };
}
