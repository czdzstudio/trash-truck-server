import * as ntpc from "./cities/ntpc.js";
import * as taichung from "./cities/taichung.js";
import * as kcg from "./cities/kcg.js";
import * as taipei from "./cities/taipei.js";
import { recordCityResult } from "./lib/status.js";

const CITIES = { ntpc, taichung, kcg, taipei };

async function syncOne(cityModule) {
  const { cityCode, meta } = cityModule;
  try {
    const result = await cityModule.sync();
    await recordCityResult(cityCode, meta, result);
    console.log(`[${cityCode}] ok — ${result.recordCount} records`);
    return true;
  } catch (err) {
    const reason = err.message || "UNKNOWN";
    await recordCityResult(cityCode, meta, { ok: false, reason });
    console.error(`[${cityCode}] FAILED — ${reason}`);
    return false;
  }
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
  // the run as failed and sends its built-in failure-notification email —
  // while data/status.json above still records the failure without clobbering
  // the last good data file for that city.
  process.exit(allOk ? 0 : 1);
}

main();
