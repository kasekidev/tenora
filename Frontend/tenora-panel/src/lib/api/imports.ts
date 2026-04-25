// À placer dans src/lib/api/imports.ts
// Même logique que products : la nouvelle API panel.list_imports renvoie
// désormais { imports, total, page, per_page }. On normalise.

import api from "./client";

export const getImports = async (params?: Record<string, unknown>) => {
  const res = await api.get("/panel/imports", { params });
  const raw = res.data;

  if (Array.isArray(raw)) {
    return { ...res, data: raw, meta: { total: raw.length, page: 1, per_page: raw.length } };
  }
  if (raw && Array.isArray(raw.imports)) {
    return {
      ...res,
      data: raw.imports,
      meta: {
        total: raw.total ?? raw.imports.length,
        page: raw.page ?? 1,
        per_page: raw.per_page ?? raw.imports.length,
      },
    };
  }
  return { ...res, data: [], meta: { total: 0, page: 1, per_page: 0 } };
};
