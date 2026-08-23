const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRIES = 2;

async function fetchOnce(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Government open-data endpoints are occasionally flaky from CI runners
 * (transient network errors, not HTTP-level failures), so this retries a
 * couple of times before giving up. The underlying cause (DNS failure,
 * timeout, connection reset, ...) is appended to the error message since
 * Node's bare "fetch failed" otherwise hides it from the Actions log.
 */
export async function fetchText(url, { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchOnce(url, timeoutMs);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  const cause = lastErr?.cause?.message ?? lastErr?.message ?? "unknown";
  const wrapped = new Error(`FETCH_FAILED: ${cause}`);
  wrapped.cause = lastErr;
  throw wrapped;
}

export async function fetchJson(url, opts) {
  const text = await fetchText(url, opts);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}
