import axios from "axios";

const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "";

export const API_BASE_URL = ENV_API_BASE_URL || "/";
const SESSION_STORAGE_KEY = "pulseboard-session";

function readJwtFromSession(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as { jwt?: unknown };
    if (typeof parsed.jwt === "string" && parsed.jwt.trim()) {
      return parsed.jwt.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8_000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const jwt = readJwtFromSession();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }

  return config;
});
