import api from './client'

export const getProducts = () => api.get('/panel/products')

export const createProduct = (data: Record<string, unknown>) =>
  api.post('/panel/products', data)

export const updateProduct = (id: number, data: Record<string, unknown>) =>
  api.put(`/panel/products/${id}`, data)

export const deleteProduct = (id: number) => api.delete(`/panel/products/${id}`)

export const uploadProductImage = (id: number, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/panel/products/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteProductImage = (id: number) =>
  api.delete(`/panel/products/${id}/image`)
