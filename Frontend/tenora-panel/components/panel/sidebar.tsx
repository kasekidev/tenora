'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Tag, 
  Users, 
  Inbox, 
  Settings, 
  LogOut,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navSections = [
  {
    label: 'Principal',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { href: '/orders', icon: ShoppingBag, label: 'Commandes' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/products', icon: Package, label: 'Produits' },
      { href: '/categories', icon: Tag, label: 'Categories' },
    ],
  },
  {
    label: 'Clients',
    items: [
      { href: '/users', icon: Users, label: 'Utilisateurs' },
      { href: '/imports', icon: Inbox, label: 'Imports' },
    ],
  },
  {
    label: 'Systeme',
    items: [
      { href: '/settings', icon: Settings, label: 'Parametres' },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const userInitial = user?.email?.[0]?.toUpperCase() || 'A'

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-200 ease-out md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-cyber-yellow/5 to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="relative flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-yellow-soft border border-cyber-yellow/20 shadow-[0_0_12px_rgba(252,227,0,0.15)]">
            <span className="font-mono text-sm font-bold text-cyber-yellow">T</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">Tenora</span>
          <span className="ml-auto rounded px-2 py-0.5 bg-cyber-yellow-soft border border-cyber-yellow/20 font-mono text-[10px] font-semibold text-cyber-yellow uppercase tracking-wider">
            Admin
          </span>
          
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="flex items-center gap-2 px-2 mb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {section.label}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href, item.exact)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-cyber-yellow-soft text-cyber-yellow border-l-2 border-cyber-yellow"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", active && "text-cyber-yellow")} />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="relative border-t border-sidebar-border p-3 bg-background/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyber-yellow to-cyber-yellow/70 font-mono text-xs font-bold text-primary-foreground shadow-[0_0_12px_rgba(252,227,0,0.2)]">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyber-yellow">
                Administrateur
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-cyber-red hover:bg-cyber-red-soft"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
