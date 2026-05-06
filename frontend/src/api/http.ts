const BASE = import.meta.env.VITE_API_BASE_URL as string;

// Access token lives in module memory; persisted to localStorage so page
// refreshes don't require an immediate round-trip to /auth/refresh.
let _token: string | null = localStorage.getItem("access_token");
let _refreshing: Promise<string | null> | null = null;

export function setToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
}

export function getToken() { return _token; }

async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) { setToken(null); return null; }
    const { accessToken } = await res.json();
    setToken(accessToken);
    return accessToken;
  } catch {
    setToken(null);
    return null;
  }
}

export async function http(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (_token) headers.set("Authorization", `Bearer ${_token}`);

  let res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });

  if (res.status === 401) {
    if (!_refreshing) _refreshing = tryRefresh();
    const newToken = await _refreshing;
    _refreshing = null;

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
    }
  }

  return res;
}

// Multipart uploads skip the JSON Content-Type header
export async function httpUpload(path: string, body: FormData): Promise<Response> {
  const headers = new Headers();
  if (_token) headers.set("Authorization", `Bearer ${_token}`);
  return fetch(`${BASE}${path}`, { method: "POST", headers, body, credentials: "include" });
}
