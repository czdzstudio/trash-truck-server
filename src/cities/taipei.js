import { fetchText } from "../lib/http.js";
import { writeDataFile } from "../lib/dataFile.js";
import { parseCsv } from "../lib/csv.js";
import { parseHhmm } from "../lib/time.js";

export const cityCode = "taipei";

export const meta = {
  cityName: "台北市",
  tier: 2,
  updateFrequencyMinutes: null,
  sourceDatasetUrl: "https://data.taipei/dataset/detail?id=6bb3304b-4f46-4bb0-8cd1-60c66dcd1cae",
  licenseNote: "資料來源：臺北市政府環境保護局（政府資料開放授權條款-第1版）",
};

// CSV is UTF-8 with BOM; columns confirmed 2026-08-23:
// 行政區,里別,分隊,局編,車號,路線,車次,抵達時間,離開時間,地點,經度,緯度
const CSV_URL =
  "https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=a6e90031-7ec4-4089-afb5-361a4efe7202";

function normalizeStop(raw) {
  return {
    normalized: {
      district: raw["行政區"] ?? null,
      village: raw["里別"] ?? null,
      routeId: raw["局編"] || raw["路線"] || null,
      plateNumber: raw["車號"] ?? null,
      tripNumber: raw["車次"] ?? null,
      arrivalTime: parseHhmm(raw["抵達時間"]),
      departureTime: parseHhmm(raw["離開時間"]),
      location: {
        lat: raw["緯度"] ? Number(raw["緯度"]) : null,
        lng: raw["經度"] ? Number(raw["經度"]) : null,
        address: raw["地點"] ?? null,
      },
    },
    raw,
  };
}

export async function sync() {
  const text = await fetchText(CSV_URL);
  // Strip UTF-8 BOM if present before parsing.
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length === 0) {
    throw new Error("SCHEMA_MISMATCH");
  }

  const stops = rows.map(normalizeStop);
  const generatedAt = new Date().toISOString();

  await writeDataFile("data/schedule/taipei.json", {
    city: cityCode,
    cityName: meta.cityName,
    tier: meta.tier,
    generatedAt,
    stops,
  });

  return { ok: true, recordCount: stops.length, latestSourceTime: null };
}
