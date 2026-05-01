// src/lib/api/orderClaim.ts
// Client API pour le système de claim/verrou des commandes (panel admin).
// Version autonome : fetch direct, aucune dépendance à un wrapper "client.ts".

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export interface OrderClaim {
  admin_id: number;
  admin_email?: string;
  admin_username?: string;
  claimed_at: string;
  expires_at?: string;
}

export interface ClaimResponse {
  success?: boolean;
  claim?: OrderClaim | null;
  detail?: string;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function claimOrder(
  orderId: number | string,
): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/panel/orders/${orderId}/claim`, {
    method: "POST",
  });
}

export async function releaseOrder(
  orderId: number | string,
): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/panel/orders/${orderId}/claim`, {
    method: "DELETE",
  });
}

export async function refreshClaim(
  orderId: number | string,
): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/panel/orders/${orderId}/claim/refresh`, {
    method: "POST",
  });
}

/**
 * Lit l'état actuel du verrou. Renvoie `{ claim: null }` si la commande est libre.
 * Utilisé par le polling du `OrderClaimBanner`.
 */
export async function getClaimStatus(
  orderId: number | string,
): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/panel/orders/${orderId}/claim`, {
    method: "GET",
  });
}
