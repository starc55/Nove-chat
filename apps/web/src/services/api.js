import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const api = axios.create({
  baseURL: configuredApiUrl ? configuredApiUrl.replace(/\/$/, "") : "/api/v1",
  timeout: 10_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken = "";
let refreshPromise = null;

const fieldLabels = {
  title: "Nomi",
  slug: "Slug",
  shortDescription: "Qisqa tavsif",
  longDescription: "To‘liq tavsif",
  price: "Narx",
  oldPrice: "Eski narx",
  stock: "Zaxira",
  image: "Asosiy rasm",
  gallery: "Galereya",
  category: "Kategoriya",
  brand: "Brend",
  variants: "Razmer/tip variantlari",
  documents: "Hujjatlar",
  specifications: "Xususiyatlar",
};

function validationMessage(errorData) {
  const details = errorData?.error?.details;
  if (!details) return errorData?.error?.message;
  if (details.issues?.length) {
    const issueMessages = details.issues.map(({ path = [], message }) => {
      const [field, index, child] = path;
      const label = fieldLabels[field] || field || "Forma";
      const location = Number.isInteger(index)
        ? `${label} #${index + 1}${child ? ` · ${fieldLabels[child] || child}` : ""}`
        : label;
      return `${location}: ${message}`;
    });
    return `Quyidagi joylarni to‘g‘rilang: ${issueMessages.join(" • ")}`;
  }
  const messages = [...(details.formErrors || [])];
  for (const [field, errors] of Object.entries(details.fieldErrors || {})) {
    for (const message of errors || []) {
      messages.push(`${fieldLabels[field] || field}: ${message}`);
    }
  }
  return messages.length
    ? `Quyidagi joylarni to‘g‘rilang: ${messages.join(" • ")}`
    : errorData?.error?.message;
}

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
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isAuthRoute
    ) {
      original._retried = true;
      try {
        refreshPromise ||= axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const response = await refreshPromise;
        setAccessToken(response.data.data.accessToken);
        original.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken("");
        window.dispatchEvent(new Event("xion:auth-expired"));
      } finally {
        refreshPromise = null;
      }
    }
    const apiError = new Error(
      validationMessage(error.response?.data) ||
        "Server bilan aloqa o‘rnatilmadi.",
    );
    apiError.status = error.response?.status;
    apiError.code = error.response?.data?.error?.code;
    apiError.details = error.response?.data?.error?.details;
    return Promise.reject(apiError);
  },
);
