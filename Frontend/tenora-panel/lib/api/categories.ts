import api from './client'

export const getCategories = () => api.get('/panel/categories')

export const createCategory = (data: Record<string, unknown>) =>
  api.post('/panel/categories', data)

export const updateCategory = (id: number, data: Record<string, unknown>) =>
  api.put(`/panel/categories/${id}`, data)

export const deleteCategory = (id: number) => api.delete(`/panel/categories/${id}`)

export const uploadCategoryImage = (id: number, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/panel/categories/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteCategoryImage = (id: number) =>
  api.delete(`/panel/categories/${id}/image`)
