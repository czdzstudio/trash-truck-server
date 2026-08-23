import { fetchJson } from "../lib/http.js";
import { writeDataFile } from "../lib/dataFile.js";
import { parseNaiveIsoDateTime, maxIso } from "../lib/time.js";

export const cityCode = "kcg";

export const meta = {
  cityName: "高雄市",
  tier: 1,
  updateFrequencyMinutes: 30,
  sourceDatasetUrl: "https://data.gov.tw/dataset/138256",
  licenseNote: "資料來源：高雄市政府環境保護局（政府資料開放授權條款-第1版）",
};

const API_URL = "https://openapi.kcg.gov.tw/Api/Service/Get/aaf4ce4b-4ca8-43de-bfaf-6dc97e89cac0";

function normalizeVehicle(raw) {
  return {
    normalized: {
      lineId: raw.linid ?? null,
      plateNumber: raw.car ?? null,
      reportedAt: parseNaiveIsoDateTime(raw.time),
      location: {
        lat: raw.y != null ? Number(raw.y) : null,
        lng: raw.x != null ? Number(raw.x) : null,
        address: raw.location ?? null,
      },
    },
    raw,
  };
}

export async function sync() {
  const body = await fetchJson(API_URL);
  // Kaohsiung wraps the real array in a { data: [...] } envelope, unlike NTPC/Taichung.
  const rows = body?.data;
  if (!Array.isArray(rows)) {
    throw new Error("SCHEMA_MISMATCH");
  }

  const vehicles = rows.map(normalizeVehicle);
  const fetchedAt = new Date().toISOString();
  const latestSourceTime = maxIso(vehicles.map((v) => v.normalized.reportedAt));

  await writeDataFile("data/realtime/kcg.json", {
    city: cityCode,
    cityName: meta.cityName,
    tier: meta.tier,
    fetchedAt,
    sourceUpdatedAt: null,
    vehicles,
  });

  return { ok: true, recordCount: vehicles.length, latestSourceTime };
}
