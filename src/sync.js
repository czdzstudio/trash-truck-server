import { mkdir, writeFile } from "node:fs/promises";
import * as ntpc from "./cities/ntpc.js";
import * as taichung from "./cities/taichung.js";
import * as kcg from "./cities/kcg.js";
import * as taipei from "./cities/taipei.js";
import { recordCityResult } from "./lib/status.js";
import { RESULTS_DIR, resultPath } from "./lib/resultFile.js";

const CITIES = { ntpc, taichung, kcg, taipei };

async function saveResultFile(cityCode, result) {
  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(resultPath(cityCode), JSON.stringify(result, null, 2) + "\n", "utf8");
}

async function syncOne(cityModule) {
  const { cityCode, meta } = cityModule;
  const at = new Date().toISOString();
  let result;
  try {
    const outcome = await cityModule.sync();
    result = { ...outcome, at };
    console.log(`[${cityCode}] ok — ${result.recordCount} records`);
  } catch (err) {
    result = { ok: false, reason: err.message || "UNKNOWN", at };
    console.error(`[${cityCode}] FAILED — ${result.reason}`);
  }

  // Persisted separately from status.json so a CI retry (see src/recordResult.js)
  // can re-apply this same outcome against a freshly pulled status.json after a
  // push conflict, instead of re-hitting the source API.
  await saveResultFile(cityCode, result);
  await recordCityResult(cityCode, meta, result);

  return result.ok;
}

async function main() {
  const requested = process.argv.slice(2);
  const targets = requested.length > 0 ? requested : Object.keys(CITIES);

  let allOk = true;
  for (const code of targets) {
    const cityModule = CITIES[code];
    if (!cityModule) {
      console.error(`Unknown city code: ${code}`);
      allOk = false;
      continue;
    }
    const ok = await syncOne(cityModule);
    allOk = allOk && ok;
  }

  // Exit non-zero only when a *requested* target failed, so GitHub Actions marks
  // the run as failed and sends its built-in failure-notification email — while
  // data/status.json above still records the failure without clobbering the
  // last good data file for that city.
  process.exit(allOk ? 0 : 1);
}

main();
