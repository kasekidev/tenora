interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-cyber-yellow" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyber-yellow shadow-[0_0_8px_var(--cyber-yellow)]" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cyber-yellow">
            {eyebrow}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
