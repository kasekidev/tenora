'use client'

import { usePathname } from 'next/navigation'
import { Menu, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Commandes',
  '/products': 'Produits',
  '/categories': 'Categories',
  '/users': 'Utilisateurs',
  '/imports': 'Imports',
  '/settings': 'Parametres',
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] || 'Panel'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/90 backdrop-blur-xl px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="outline"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Tenora</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="rounded bg-cyber-yellow-soft border border-cyber-yellow/20 px-2 py-0.5 font-mono text-xs font-medium text-cyber-yellow">
            {pageTitle}
          </span>
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-cyber-yellow-soft border border-cyber-yellow/20 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyber-yellow opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyber-yellow" />
          </span>
          <span className="font-mono text-[10px] font-medium text-cyber-yellow tracking-wide">
            En ligne
          </span>
        </div>
      </div>
    </header>
  )
}
