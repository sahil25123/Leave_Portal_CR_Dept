import axios from "axios";

export const TOKEN_STORAGE_KEY = "leave_portal_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

export function getApiErrorMessage(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      fallbackMessage ||
      "Something went wrong"
    );
  }

  return error?.message || fallbackMessage || "Something went wrong";
}

export default api;
