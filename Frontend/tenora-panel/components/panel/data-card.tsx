import { cn } from '@/lib/utils'

interface DataCardProps {
  children: React.ReactNode
  className?: string
}

export function DataCard({ children, className }: DataCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card overflow-hidden shadow-sm",
      className
    )}>
      {children}
    </div>
  )
}

interface DataCardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function DataCardHeader({ children, className }: DataCardHeaderProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-3 p-4 border-b border-border",
      className
    )}>
      {children}
    </div>
  )
}

interface DataCardContentProps {
  children: React.ReactNode
  className?: string
}

export function DataCardContent({ children, className }: DataCardContentProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}
