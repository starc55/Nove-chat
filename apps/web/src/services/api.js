import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

let accessToken = "";
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || "";
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshPromise ||= axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const response = await refreshPromise;
        setAccessToken(response.data.data.accessToken);
        original.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken("");
        window.dispatchEvent(new Event("nova:auth-expired"));
      } finally {
        refreshPromise = null;
      }
    }
    const apiError = new Error(error.response?.data?.error?.message || "Server bilan aloqa o‘rnatilmadi.");
    apiError.status = error.response?.status;
    apiError.code = error.response?.data?.error?.code;
    return Promise.reject(apiError);
  }
);
