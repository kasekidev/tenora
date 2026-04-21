import api from "./client";

export const getImports = (status?: string) =>
  api.get("/panel/imports", { params: { status } });
export const updateImportStatus = (id: number, data: { status: string; staff_note?: string }) =>
  api.put(`/panel/imports/${id}/status`, data);
