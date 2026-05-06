import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, fetchMe } from "../api/authApi";
import { setToken, getToken } from "../api/http";

interface AuthUser { id: number; name: string; email: string; }

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: verify existing token or try refresh via cookie
  useEffect(() => {
    async function init() {
      if (getToken()) {
        const me = await fetchMe();
        if (me) { setUser(me); setIsLoading(false); return; }
      }
      // No valid access token — try refresh cookie
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const { accessToken, user: u } = await res.json();
          setToken(accessToken);
          setUser(u);
        }
      } catch { /* no refresh cookie */ }
      setIsLoading(false);
    }
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await apiLogin(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: u } = await apiRegister(name, email, password);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
