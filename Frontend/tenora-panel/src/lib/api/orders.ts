import api from "./client";
import type { OrderClaim } from "./orderClaim";

export interface OrderListItem {
  id: number;
  user_email: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_method: string;
  created_at: string;
  notes?: string;
  staff_note?: string;
  screenshot_path?: string;
  customer_info?: {
    delivery_name?: string;
    delivery_phone?: string;
    delivery_address?: string;
  };
  claim?: OrderClaim | null;
}

export interface OrdersListResponse {
  orders: OrderListItem[];
  total: number;
}

export const getOrders = (params?: { status?: string; page?: number; per_page?: number }) =>
  api.get<OrdersListResponse>("/panel/orders", { params });

export const getOrder = (id: number) =>
  api.get<OrderListItem>(`/panel/orders/${id}`);

export const updateOrderStatus = (id: number, data: { status: string; staff_note?: string }) =>
  api.put(`/panel/orders/${id}/status`, data);

export const exportOrdersCsv = (status?: string) =>
  api.get("/panel/orders/export/csv", { params: { status }, responseType: "blob" });
