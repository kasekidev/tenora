import api from './client'

export const getDashboard = () => api.get('/panel/dashboard')
