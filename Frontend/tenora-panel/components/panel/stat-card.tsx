import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  delta?: string
  deltaType?: 'positive' | 'warning' | 'neutral'
  color?: 'yellow' | 'cyan' | 'green' | 'red' | 'purple'
}

const colorClasses = {
  yellow: {
    icon: 'bg-cyber-yellow-soft border-cyber-yellow/20 text-cyber-yellow',
    glow: 'from-cyber-yellow/10',
    value: 'text-foreground',
  },
  cyan: {
    icon: 'bg-cyber-cyan-soft border-cyber-cyan/20 text-cyber-cyan',
    glow: 'from-cyber-cyan/10',
    value: 'text-cyber-cyan',
  },
  green: {
    icon: 'bg-cyber-green-soft border-cyber-green/20 text-cyber-green',
    glow: 'from-cyber-green/10',
    value: 'text-cyber-green',
  },
  red: {
    icon: 'bg-cyber-red-soft border-cyber-red/20 text-cyber-red',
    glow: 'from-cyber-red/10',
    value: 'text-cyber-red',
  },
  purple: {
    icon: 'bg-cyber-purple-soft border-cyber-purple/20 text-cyber-purple',
    glow: 'from-cyber-purple/10',
    value: 'text-cyber-purple',
  },
}

const deltaClasses = {
  positive: 'text-cyber-green bg-cyber-green-soft border-cyber-green/20',
  warning: 'text-cyber-yellow bg-cyber-yellow-soft border-cyber-yellow/20',
  neutral: 'text-muted-foreground bg-muted border-border',
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  delta, 
  deltaType = 'neutral',
  color = 'yellow' 
}: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Top glow line */}
      <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-cyber-yellow/50 to-transparent opacity-60" />
      
      {/* Corner glow */}
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50 pointer-events-none", colors.glow)} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", colors.icon)}>
            <Icon className="h-4 w-4" />
          </div>
          {delta && (
            <span className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold border",
              deltaClasses[deltaType]
            )}>
              {delta}
            </span>
          )}
        </div>

        {/* Value */}
        <div className={cn("font-mono text-2xl font-semibold tracking-tight mb-1", colors.value)}>
          {value}
        </div>

        {/* Label */}
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
