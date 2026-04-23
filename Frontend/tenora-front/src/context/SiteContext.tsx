import { createContext, ReactNode, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { siteApi, type SiteInit } from "@/lib/api";

// ──────────────────────────────────────────────────────────────────────────────
// SiteContext — version React Query.
// Avant : useState + useEffect manuel → 1 fetch par mount, pas de cache,
//         pas de dédup, re-render global à chaque update.
// Après : useQuery partagé via le QueryClient global.
//         • staleTime 5 min = même TTL que le cache backend (/site/init).
//         • Une seule clé ["site","init"] → invalidation propre depuis n'importe
//           quel composant via queryClient.invalidateQueries(["site","init"]).
// ──────────────────────────────────────────────────────────────────────────────

export const SITE_QUERY_KEY = ["site", "init"] as const;

interface SiteCtx {
  data: SiteInit | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SiteCtx | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: SITE_QUERY_KEY,
    queryFn: () => siteApi.getInit().then((r) => r.data),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  // Stabilisé pour ne pas re-render tout l'arbre à chaque render parent.
  const value = useMemo<SiteCtx>(
    () => ({
      data: data ?? null,
      loading: isLoading,
      refresh: async () => {
        await qc.invalidateQueries({ queryKey: SITE_QUERY_KEY });
      },
    }),
    [data, isLoading, qc]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteProvider");
  return v;
}
