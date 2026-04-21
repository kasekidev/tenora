import api from "./client";

export const getOrders = (params?: { status?: string; page?: number; per_page?: number }) =>
  api.get("/panel/orders", { params });
export const getOrder = (id: number) => api.get(`/panel/orders/${id}`);
export const updateOrderStatus = (id: number, data: { status: string; staff_note?: string }) =>
  api.put(`/panel/orders/${id}/status`, data);
export const exportOrdersCsv = (status?: string) =>
  api.get("/panel/orders/export/csv", { params: { status }, responseType: "blob" });
