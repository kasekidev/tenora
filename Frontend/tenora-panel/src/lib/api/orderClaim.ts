// src/lib/api/orderClaim.ts
// Client API pour le système de claim/verrou des commandes (panel admin).
import { api } from "./client"; // ← adapte si ton wrapper s'appelle autrement (api / http / fetcher...)

export interface OrderClaim {
  claimed_by_id: number | null;
  claimed_by_username: string | null;
  claimed_by_email: string | null;
  claimed_at: string | null;   // ISO
  expires_at: string | null;   // ISO
}

export interface ClaimResponse {
  ok?: boolean;
  claim: OrderClaim;
  is_mine?: boolean;
}

export const claimOrder = (orderId: number) =>
  api.post<ClaimResponse>(`/panel/orders/${orderId}/claim`).then((r) => r.data);

export const releaseOrder = (orderId: number) =>
  api.post<ClaimResponse>(`/panel/orders/${orderId}/release`).then((r) => r.data);

export const getClaimStatus = (orderId: number) =>
  api.get<ClaimResponse>(`/panel/orders/${orderId}/claim`).then((r) => r.data);
