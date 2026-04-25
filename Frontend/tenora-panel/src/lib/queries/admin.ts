/**
 * Hooks React Query centralisés pour le panel admin.
 *
 * BÉNÉFICES vs l'ancien pattern useState+useEffect :
 *  - cache partagé : ouvrir Produits puis Catégories réutilise le résultat de
 *    /panel/categories au lieu de refaire l'appel.
 *  - dédup automatique : si deux composants demandent la même donnée en
 *    parallèle, une seule requête réseau est émise.
 *  - invalidation déclarative après mutation : `invalidateQueries(qk.products)`
 *    après un createProduct, plutôt qu'un `load()` manuel.
 *  - background refetch transparent : la liste s'auto-rafraîchit quand
 *    l'utilisateur revient sur l'onglet (déjà configuré dans App.tsx).
 *
 * Convention `qk` : tous les keys passent par cette factory typée pour éviter
 * les fautes de frappe et faciliter l'invalidation ciblée.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  uploadCategoryImage, deleteCategoryImage,
} from "@/lib/api/categories";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  uploadProductImage,
} from "@/lib/api/products";
import { getOrders, updateOrderStatus } from "@/lib/api/orders";
import { getImports, updateImportStatus } from "@/lib/api/imports";
import { getUsers } from "@/lib/api/users";
import { getDashboard } from "@/lib/api/dashboard";
import { getSettings } from "@/lib/api/settings";

export const qk = {
  dashboard:      ["dashboard"] as const,
  categories:     ["categories"] as const,
  products: (params?: Record<string, unknown>) =>
    ["products", params ?? {}] as const,
  orders:   (params?: Record<string, unknown>) =>
    ["orders", params ?? {}] as const,
  imports:  (status?: string) => ["imports", status ?? "all"] as const,
  users:    (params?: Record<string, unknown>) =>
    ["users", params ?? {}] as const,
  settings:       ["settings"] as const,
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => (await getDashboard()).data,
    staleTime: 60_000,                 // dashboard : ok stale 1 min
  });
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: async () => (await getCategories()).data ?? [],
    staleTime: 5 * 60_000,             // peu de changements → cache long
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.categories });
    // Les produits affichent category_name → invalider aussi
    qc.invalidateQueries({ queryKey: ["products"] });
  };
  return {
    create: useMutation({
      mutationFn: (data: Record<string, unknown>) => createCategory(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
        updateCategory(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => deleteCategory(id),
      onSuccess: invalidate,
    }),
    uploadImage: useMutation({
      mutationFn: ({ id, file }: { id: number; file: File }) =>
        uploadCategoryImage(id, file),
      onSuccess: invalidate,
    }),
    removeImage: useMutation({
      mutationFn: (id: number) => deleteCategoryImage(id),
      onSuccess: invalidate,
    }),
  };
}

// ─── PRODUITS ────────────────────────────────────────────────────────────────
export interface ProductsListParams {
  page?: number;
  per_page?: number;
  q?: string;
  category_id?: number;
  is_active?: boolean;
}

export function useProducts(params: ProductsListParams = {}) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: async () => {
      const { data } = await getProducts(params);
      // Compat ancien format (tableau brut) ↔ nouveau format paginé
      if (Array.isArray(data)) return { products: data, total: data.length, page: 1, per_page: data.length };
      return data as { products: unknown[]; total: number; page: number; per_page: number };
    },
    placeholderData: keepPreviousData,   // pas de flicker entre pages
    staleTime: 30_000,
  });
}

export function useProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: qk.dashboard });
    qc.invalidateQueries({ queryKey: qk.categories }); // product_count change
  };
  return {
    create: useMutation({
      mutationFn: (data: Record<string, unknown>) => createProduct(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
        updateProduct(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => deleteProduct(id),
      onSuccess: invalidate,
    }),
    uploadImage: useMutation({
      mutationFn: ({ id, file }: { id: number; file: File }) =>
        uploadProductImage(id, file),
      onSuccess: invalidate,
    }),
  };
}

// ─── COMMANDES ───────────────────────────────────────────────────────────────
export function useOrders(params: { status?: string; page: number; per_page: number }) {
  return useQuery({
    queryKey: qk.orders(params),
    queryFn: async () => (await getOrders(params)).data as {
      orders: unknown[]; total: number; page: number; per_page: number;
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,                 // commandes : fraîcheur plus serrée
  });
}

export function useOrderMutations() {
  const qc = useQueryClient();
  return {
    updateStatus: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: { status: string; staff_note: string } }) =>
        updateOrderStatus(id, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: qk.dashboard });
      },
    }),
  };
}

// ─── IMPORTS ─────────────────────────────────────────────────────────────────
export function useImports(status?: string) {
  return useQuery({
    queryKey: qk.imports(status),
    queryFn: async () => {
      const { data } = await getImports(status);
      // Compat liste brute / format paginé
      if (Array.isArray(data)) return { items: data, total: data.length };
      return data as { items: unknown[]; total: number };
    },
    staleTime: 30_000,
  });
}

export function useImportMutations() {
  const qc = useQueryClient();
  return {
    updateStatus: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: { status: string; staff_note: string } }) =>
        updateImportStatus(id, payload),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["imports"] }),
    }),
  };
}

// ─── UTILISATEURS ────────────────────────────────────────────────────────────
export function useUsers(params: { page: number; per_page: number; q?: string }) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: async () => (await getUsers(params)).data as {
      users: unknown[]; total: number; page: number; per_page: number;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await getSettings()).data,
    staleTime: 5 * 60_000,
  });
}
