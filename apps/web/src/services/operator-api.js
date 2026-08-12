import axios from "axios";

export const operatorApi = axios.create({
  baseURL: "/api/v1",
  timeout: 12_000,
  headers: { "Content-Type": "application/json" }
});

export function telegramInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

operatorApi.interceptors.request.use((config) => {
  config.headers["X-Telegram-Init-Data"] = telegramInitData();
  return config;
});

operatorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = new Error(error.response?.data?.error?.message || "Server bilan aloqa o‘rnatilmadi.");
    apiError.status = error.response?.status;
    apiError.code = error.response?.data?.error?.code;
    return Promise.reject(apiError);
  }
);
