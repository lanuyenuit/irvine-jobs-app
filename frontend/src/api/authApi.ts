import { http, setToken } from "./http";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await http("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.accessToken);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await http("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await http("/auth/logout", { method: "POST" }).catch(() => {});
  setToken(null);
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await http("/auth/me");
  if (!res.ok) return null;
  return res.json();
}
