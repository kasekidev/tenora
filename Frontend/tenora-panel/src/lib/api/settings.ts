import api from "./client";

export const getSettings = () => api.get("/panel/settings");
export const updateMaintenance = (enabled: boolean) =>
  api.put("/panel/settings/maintenance", { enabled });
export const updateAnnouncement = (data: { enabled: boolean; text: string }) =>
  api.put("/panel/settings/announcement", data);
export const updateWhatsapp = (number: string) =>
  api.put("/panel/settings/whatsapp", { number });
export const updatePaymentMethods = (methods: unknown[]) =>
  api.put("/panel/settings/payment-methods", { methods });
