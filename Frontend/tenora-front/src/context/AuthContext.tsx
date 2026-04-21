import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, setApiErrorHandler, type User } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  checked: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUserState(res.data);
    } catch {
      setUserState(null);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    setApiErrorHandler(() => {
      setUserState(null);
      setChecked(true);
    });
    fetchMe();
  }, [fetchMe]);

  const value: AuthCtx = {
    user,
    checked,
    loading,
    isLoggedIn: !!user,
    isVerified: user?.is_verified ?? false,
    isAdmin: user?.is_admin ?? false,
    async login(email, password) {
      setLoading(true);
      try {
        await authApi.login({ email, password });
        await fetchMe();
      } finally {
        setLoading(false);
      }
    },
    async register(email, password, phone) {
      setLoading(true);
      try {
        await authApi.register({ email, password, phone });
        await fetchMe();
      } finally {
        setLoading(false);
      }
    },
    async logout() {
      await authApi.logout();
      setUserState(null);
    },
    refresh: fetchMe,
    setUser: (u) => setUserState(u),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
