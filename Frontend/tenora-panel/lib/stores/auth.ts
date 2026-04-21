'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api/client'

interface User {
  email: string
  is_admin: boolean
}

interface AuthState {
  sessionActive: boolean
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      sessionActive: false,
      user: null,
      isLoggedIn: false,

      login: async (email: string, password: string) => {
        await api.post('/auth/login', { email, password })
        const { data: me } = await api.get('/auth/me')
        
        if (!me.is_admin) {
          await api.post('/auth/logout').catch(() => {})
          throw new Error('Acces reserve aux administrateurs.')
        }

        set({ user: me, sessionActive: true, isLoggedIn: true })
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me')
          if (!data.is_admin) {
            get().logout()
            return
          }
          set({ user: data, sessionActive: true, isLoggedIn: true })
        } catch {
          set({ sessionActive: false, isLoggedIn: false, user: null })
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // ignore
        }
        set({ user: null, sessionActive: false, isLoggedIn: false })
      },
    }),
    {
      name: 'panel_session',
      partialize: (state) => ({ sessionActive: state.sessionActive }),
    }
  )
)
