// Tenora API client — port React du fichier src/api/index.ts d'origine.
// La logique HTTP reste strictement identique au backend (mêmes endpoints, mêmes payloads).
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

let _onUnauthorized: (() => void) | null = null;
export function setApiErrorHandler(onUnauthorized: () => void) {
  _onUnauthorized = onUnauthorized;
}

function parseApiError(error: any): string | null {
  const detail = error?.response?.data?.detail;
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first?.msg) return String(first.msg).replace("Value error, ", "");
    if (first?.message) return first.message;
  }
  return null;
}

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const current = window.location.pathname;
    if (!error.response) {
      window.dispatchEvent(new CustomEvent("tenora:api-error", { detail: { type: "network" } }));
      if (error.code === "ECONNABORTED") {
        toast.error("La requête a pris trop de temps. Vérifiez votre connexion.");
      } else if (error.code !== "ERR_NETWORK" && error.message !== "Network Error") {
        toast.error("Impossible de contacter le serveur. Réessayez.");
      }
      return Promise.reject(error);
    }
    const status = error.response.status;
    const message = parseApiError(error);

    if (status === 401) {
      const url = error.config?.url || "";
      const isAuthEndpoint =
        url.includes("/auth/me") ||
        url.includes("/auth/login") ||
        url.includes("/auth/register");
      // Ne wipe la session QUE si le 401 vient d'un endpoint proteg ,
      // pas d'un echec de login/register (sinon faux positif "session expiree").
      if (!isAuthEndpoint) _onUnauthorized?.();
      if (!isAuthEndpoint && current !== "/connexion" && current !== "/inscription") {
        window.location.href = `/connexion?redirect=${encodeURIComponent(current)}`;
      }
      return Promise.reject(error);
    }
    if (status === 403 || status === 404 || status === 422) return Promise.reject(error);
    if (status === 400) {
      if (message) toast.error(message);
      return Promise.reject(error);
    }
    if (status === 429) {
      toast.warning("Trop de requêtes. Patientez quelques instants avant de réessayer.");
      return Promise.reject(error);
    }
    if (status >= 500) {
      toast.error("Une erreur serveur est survenue. Notre équipe a été alertée.");
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// ─── Types ─────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  phone: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  service_type: string;
  parent_id: number | null;
  is_active: boolean;
  image_path: string | null;
  image_url: string | null;
}
export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  service_type: string;
  image_url: string | null;
  subcategories: { id: number; name: string; slug: string; image_url: string | null }[];
}
export interface FieldDefinition {
  key: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  regex: string | null;
}
export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  discount_percent: number | null;
  final_price: number;
  stock: number;
  is_active: boolean;
  image_path: string | null;
  image_url: string | null;
  required_fields: FieldDefinition[] | null;
  whatsapp_redirect: boolean;
  created_at: string;
}
export interface Order {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: "pending" | "processing" | "completed" | "rejected" | "refunded";
  screenshot_path: string | null;
  customer_info: Record<string, string> | null;
  staff_note: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}
export interface ImportRequest {
  id: number;
  user_id: number;
  category_id: number;
  article_url: string;
  article_description: string | null;
  screenshot_path: string | null;
  status: "pending" | "contacted" | "in_progress" | "delivered" | "cancelled";
  staff_note: string | null;
  created_at: string;
}
export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  instructions: string;
  enabled: boolean;
}
export interface SiteInit {
  maintenance: boolean;
  announcement: { enabled: boolean; text: string };
  payment_methods: PaymentMethod[];
  whatsapp_number: string;
}

// ─── Endpoints ─────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; phone?: string }) =>
    api.post<User>("/auth/register", data),
  login: (data: { email: string; password: string }) => api.post<User>("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<User>("/auth/me"),
  verifyEmail: (code: string) => api.post("/auth/verify-email", null, { params: { code } }),
  resendOtp: () => api.post("/auth/resend-otp"),
  updateProfile: (data: { phone?: string }) => api.put<User>("/auth/profile", data),
};

export const productsApi = {
  getCategoriesTree: () => api.get<CategoryTree[]>("/products/categories/tree"),
  getProductsByCategory: (categoryId: number) =>
    api.get<Product[]>(`/products/categories/${categoryId}/products`),
  getShopProducts: (params?: { category_id?: number; q?: string; sort?: string }) =>
    api.get<Product[]>("/products/shop", { params }),
  getProduct: (id: number) => api.get<Product>(`/products/${id}`),
  search: (q: string) => api.get<Product[]>("/products/search", { params: { q } }),
  getWhatsappLink: (productId: number, params: URLSearchParams) =>
    `${api.defaults.baseURL}/products/${productId}/whatsapp?${params.toString()}`,
};

export const ordersApi = {
  create: (data: {
    product_id: number;
    quantity: number;
    customer_info?: Record<string, string>;
    payment_method: string;
  }) => api.post<Order>("/orders/", data),
  uploadScreenshot: (orderId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Order>(`/orders/${orderId}/screenshot`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  cancel: (orderId: number) => api.post<Order>(`/orders/${orderId}/cancel`),
  myOrders: () => api.get<Order[]>("/orders/my"),
};

export const importsApi = {
  create: (data: { category_id: number; article_url: string; article_description?: string }) =>
    api.post<ImportRequest>("/imports/", data),
  uploadScreenshot: (requestId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ImportRequest>(`/imports/${requestId}/screenshot`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  myRequests: () => api.get<ImportRequest[]>("/imports/my"),
  getWhatsappLink: (requestId: number) => `${api.defaults.baseURL}/imports/${requestId}/whatsapp`,
};

export interface Ebook {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  discount_percent: number | null;
  final_price: number;
  image_path: string | null;
  image_url: string | null;
  has_pdf: boolean;
  required_fields?: FieldDefinition[] | null;
}

export const ebooksApi = {
  list: () => api.get<Ebook[]>("/ebooks/"),
  downloadUrl: (id: number) => `${api.defaults.baseURL}/ebooks/${id}/download`,
  download: (id: number) =>
    fetch(`${api.defaults.baseURL}/ebooks/${id}/download`, { credentials: "include" }),
};

export const siteApi = {
  getInit: () => api.get<SiteInit>("/site/init"),
};

// Helper d'URL d'images (uploads backend)
export function resolveAssetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = api.defaults.baseURL || "";
  if (path.startsWith("/uploads/")) return `${base}${path}`;
  return `${base}/uploads/${path}`;
}

export default api;

// Helpers UI
export const formatXOF = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
