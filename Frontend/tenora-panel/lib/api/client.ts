import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isMe = url.includes('/auth/me')
      const onLogin = typeof window !== 'undefined' && window.location.pathname === '/login'

      if (!isMe && !onLogin && typeof window !== 'undefined') {
        localStorage.removeItem('panel_session')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
