import api from './client'

export const getUsers = (params?: { page?: number; per_page?: number; q?: string }) =>
  api.get('/panel/users', { params })

export const verifyUser = (id: number) => api.put(`/panel/users/${id}/verify`)

export const deleteUser = (id: number) => api.delete(`/panel/users/${id}`)
