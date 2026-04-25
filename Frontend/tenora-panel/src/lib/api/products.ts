import api from "./client";

/** Liste paginée + filtrée des produits.
 *  Compatible avec l'ancien backend (qui renvoie `[]` brut) ET le nouveau
 *  (qui renvoie `{ products, total, page, per_page }`). */
export const getProducts = (params?: Record<string, unknown>) =>
  api.get("/panel/products", { params });

export const createProduct = (data: Record<string, unknown>) =>
  api.post("/panel/products", data);
export const updateProduct = (id: number, data: Record<string, unknown>) =>
  api.put(`/panel/products/${id}`, data);
export const deleteProduct = (id: number) =>
  api.delete(`/panel/products/${id}`);
export const uploadProductImage = (id: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/panel/products/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deleteProductImage = (id: number) =>
  api.delete(`/panel/products/${id}/image`);
