import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { siteApi, type SiteInit } from "@/lib/api";

interface SiteCtx {
  data: SiteInit | null;
  loading: boolean;
  refresh: () => Promise<void>;
}
const Ctx = createContext<SiteCtx | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteInit | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siteApi.getInit();
      setData(res.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <Ctx.Provider value={{ data, loading, refresh: load }}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteProvider");
  return v;
}
