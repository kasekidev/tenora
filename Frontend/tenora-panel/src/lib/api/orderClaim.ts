// src/lib/api/orderClaim.ts
// Client API pour le système de claim/verrou des commandes (panel admin).
// Version autonome : utilise fetch directement pour éviter toute dépendance
// à un wrapper "client.ts" dont l'export peut varier d'un projet à l'autre.

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export interface OrderClaim {
  admin_id: string;
  admin_email?: string;
  claimed_at: string;
  expires_at?: string;
}

export interface ClaimResponse {
  success: boolean;
  claim?: OrderClaim;
  detail?: string;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Best-effort: récupère le token si stocké en localStorage (clés courantes)
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    /* SSR / accès refusé : ignore */
  }
  return headers;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      /* pas de JSON */
    }
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function claimOrder(orderId: string): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/admin/orders/${orderId}/claim`, {
    method: "POST",
  });
}

export async function releaseOrder(orderId: string): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/admin/orders/${orderId}/claim`, {
    method: "DELETE",
  });
}

export async function refreshClaim(orderId: string): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/admin/orders/${orderId}/claim/refresh`, {
    method: "POST",
  });
}
