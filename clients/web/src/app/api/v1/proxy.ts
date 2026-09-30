// ─────────────────────────────────────────────
// GravWatch - API Proxy Helpers
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

export const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  (process.env.NODE_ENV === "production" ? "http://server:8000" : "http://localhost:8000");

export const API_KEY = process.env.MASTER_API_KEY || "";

export async function backendFetch(path: string, options: RequestInit = {}) {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    },
    cache: "no-store",
  });
}
