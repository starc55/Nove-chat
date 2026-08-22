import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { landingFallback } from "../data/landing-fallback.js";

const CACHE_KEY = "xion_landing_cache_v3";
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function readCachedLanding() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!cached?.data?.products?.length || Date.now() - cached.savedAt > CACHE_MAX_AGE) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function saveCachedLanding(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage can be unavailable in privacy mode; the bundled fallback still works.
  }
}

export function useLandingData() {
  const [state, setState] = useState(() => ({
    data: readCachedLanding() || landingFallback,
    loading: false,
    error: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    api.get("/public/landing", { signal: controller.signal })
      .then(({ data }) => {
        if (!data?.data?.products?.length) return;
        saveCachedLanding(data.data);
        setState({ data: data.data, loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "CanceledError") {
          setState((current) => ({ ...current, loading: false, error: "" }));
        }
      });
    return () => controller.abort();
  }, []);

  return state;
}
