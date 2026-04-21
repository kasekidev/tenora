'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useAuthStore } from '@/lib/stores/auth'

interface PanelLayoutProps {
  children: React.ReactNode
}

export function PanelLayout({ children }: PanelLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isLoggedIn, fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    // Close sidebar on route change (mobile)
    setSidebarOpen(false)
  }, [pathname])

  // DEV MODE: Set to true to bypass auth for testing
  const DEV_BYPASS_AUTH = true

  useEffect(() => {
    // Skip auth check in dev mode
    if (DEV_BYPASS_AUTH) return

    // Redirect to login if not authenticated
    if (!isLoggedIn && pathname !== '/login') {
      // Give a small delay for the store to hydrate
      const timeout = setTimeout(() => {
        const { isLoggedIn: stillNotLoggedIn } = useAuthStore.getState()
        if (!stillNotLoggedIn) {
          router.push('/login')
        }
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [isLoggedIn, pathname, router])

  // Don't render layout for login page
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-col md:ml-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
