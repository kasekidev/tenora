import api from "./client";

export interface PanelUser {
  id: number;
  email: string;
  username: string | null;
  phone: string | null;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  order_count?: number;
  total_spent?: number;
}

export const getUsers = (params?: { page?: number; per_page?: number; q?: string }) =>
  api.get<{ total: number; page: number; per_page: number; users: PanelUser[] }>(
    "/panel/users",
    { params },
  );
export const verifyUser = (id: number) => api.put(`/panel/users/${id}/verify`);
export const deleteUser = (id: number) => api.delete(`/panel/users/${id}`);
