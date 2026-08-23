import { fileURLToPath } from "node:url";

export const RESULTS_DIR = fileURLToPath(new URL("../../.sync-results/", import.meta.url));

export function resultPath(cityCode) {
  return `${RESULTS_DIR}${cityCode}.json`;
}
