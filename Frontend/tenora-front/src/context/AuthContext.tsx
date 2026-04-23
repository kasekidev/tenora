import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, setApiErrorHandler, type User } from "@/lib/api";

// ──────────────────────────────────────────────────────────────────────────────
// AuthContext — version React Query.
// • useQuery(["auth","me"]) : un seul appel /auth/me par session, partagé.
// • staleTime: Infinity → on n'invalide qu'aux moments précis :
//     login / register / logout / 401 intercepté.
// • Cohérent avec QueryClient.refetchOnWindowFocus: false → plus de "ping"
//   /auth/me à chaque retour sur l'onglet.
// ──────────────────────────────────────────────────────────────────────────────

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

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
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data, isFetched, refetch } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await authApi.me();
        return res.data;
      } catch {
        // 401 ou autre → utilisateur non connecté, pas une erreur applicative.
        return null;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const user = data ?? null;

  // Handler global : le 401 intercepté dans api.ts vient remettre l'auth à null.
  useEffect(() => {
    setApiErrorHandler(() => {
      qc.setQueryData(AUTH_QUERY_KEY, null);
    });
  }, [qc]);

  const setUser = useCallback(
    (u: User | null) => qc.setQueryData(AUTH_QUERY_KEY, u),
    [qc]
  );

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      checked: isFetched,
      loading,
      isLoggedIn: !!user,
      isVerified: user?.is_verified ?? false,
      isAdmin: user?.is_admin ?? false,

      async login(email, password) {
        setLoading(true);
        try {
          const res = await authApi.login({ email, password });
          if (res.data) {
            setUser(res.data);
          } else {
            await refetch();
          }
        } finally {
          setLoading(false);
        }
      },

      async register(email, password, phone) {
        setLoading(true);
        try {
          await authApi.register({ email, password, phone });
          await refetch();
        } finally {
          setLoading(false);
        }
      },

      async logout() {
        await authApi.logout();
        setUser(null);
        // On vide aussi les données utilisateur sensibles.
        qc.removeQueries({ queryKey: ["orders"] });
        qc.removeQueries({ queryKey: ["imports"] });
      },

      refresh: async () => {
        await refetch();
      },

      setUser: (u: User) => setUser(u),
    }),
    [user, isFetched, loading, refetch, setUser, qc]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
