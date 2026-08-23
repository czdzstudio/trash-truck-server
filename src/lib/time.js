const pad = (n, len = 2) => String(n).padStart(len, "0");

/** Builds an ISO 8601 string with a fixed +08:00 offset from raw date/time parts. */
export function toTaipeiIso(y, mo, d, h, mi, s) {
  return `${pad(y, 4)}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}+08:00`;
}

/** "2026/08/22 22:50:23" -> ISO +08:00 (source: NTPC) */
export function parseSlashDateTime(str) {
  const m = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(str);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return toTaipeiIso(y, mo, d, h, mi, s);
}

/** "20260823T131917" -> ISO +08:00 (source: Taichung) */
export function parseCompactDateTime(str) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(str);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return toTaipeiIso(y, mo, d, h, mi, s);
}

/** "2026-08-23T13:47:43" (no offset) -> ISO +08:00 (source: Kaohsiung) */
export function parseNaiveIsoDateTime(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(str);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return toTaipeiIso(y, mo, d, h, mi, s);
}

/** "1630" (HHMM) -> "16:30" (source: Taipei fixed schedule) */
export function parseHhmm(str) {
  const m = /^(\d{2})(\d{2})$/.exec(str);
  if (!m) return null;
  const [, h, mi] = m;
  return `${h}:${mi}`;
}

/** Returns the max of a list of ISO +08:00 timestamps (string comparison works since format is fixed-width). */
export function maxIso(isoStrings) {
  const valid = isoStrings.filter(Boolean);
  if (valid.length === 0) return null;
  return valid.reduce((max, cur) => (cur > max ? cur : max));
}
