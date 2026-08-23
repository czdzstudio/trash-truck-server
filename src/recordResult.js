import { readFile } from "node:fs/promises";
import * as ntpc from "./cities/ntpc.js";
import * as taichung from "./cities/taichung.js";
import * as kcg from "./cities/kcg.js";
import * as taipei from "./cities/taipei.js";
import { readStatus, writeStatus, applyCityResult } from "./lib/status.js";
import { resultPath } from "./lib/resultFile.js";

const CITIES = { ntpc, taichung, kcg, taipei };

// Re-applies an already-computed sync result (written by src/sync.js) onto a
// freshly read data/status.json. Used by the CI workflow's push-retry loop:
// on a conflicting push, the workflow re-fetches origin's status.json and
// reruns this — cheap and side-effect-free — instead of re-fetching the
// source API and risking a different result on each retry.
async function main() {
  const cityCode = process.argv[2];
  const cityModule = CITIES[cityCode];
  if (!cityModule) {
    console.error(`Unknown city code: ${cityCode}`);
    process.exit(1);
  }

  const result = JSON.parse(await readFile(resultPath(cityCode), "utf8"));
  const status = await readStatus();
  applyCityResult(status, cityCode, cityModule.meta, result);
  await writeStatus(status);
}

main();
