import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const emptyData = { products: [], advertisements: [], reviews: [], settings: {} };

export function useLandingData() {
  const [state, setState] = useState({ data: emptyData, loading: true, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    api.get("/public/landing", { signal: controller.signal })
      .then(({ data }) => setState({ data: data.data, loading: false, error: "" }))
      .catch((error) => {
        if (error.name !== "CanceledError") setState({ data: emptyData, loading: false, error: error.message });
      });
    return () => controller.abort();
  }, []);

  return state;
}
