const SITE_URL = "https://xion.uz";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_PUBLIC_KEY = "f4c9b612e58147f0a23d8096ac75e31b";

function normalizeUrl(value) {
  try {
    const url = new URL(value, SITE_URL);
    if (url.origin !== SITE_URL) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export async function notifyIndexNow(paths = []) {
  const key = process.env.INDEXNOW_KEY || DEFAULT_PUBLIC_KEY;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(key)) {
    console.warn("[indexnow] INDEXNOW_KEY formati noto‘g‘ri; yuborish bekor qilindi.");
    return false;
  }
  const urlList = [...new Set(paths.flatMap((path) => [path, `/ru${path === "/" ? "/" : path}`]).map(normalizeUrl).filter(Boolean))];
  if (!urlList.length) return false;
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "xion.uz", key, keyLocation: `${SITE_URL}/${key}.txt`, urlList }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok && response.status !== 202) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.warn(`[indexnow] notification failed: ${error.message}`);
    return false;
  }
}

