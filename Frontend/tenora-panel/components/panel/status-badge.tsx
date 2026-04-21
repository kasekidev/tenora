import { cn } from '@/lib/utils'

type StatusType = 
  | 'pending' | 'en_attente'
  | 'processing' | 'en_cours' | 'contacted' | 'in_progress'
  | 'completed' | 'complete' | 'livree' | 'delivered'
  | 'rejected' | 'refuse' | 'annulee' | 'cancelled'
  | 'refunded'
  | 'active' | 'inactive'

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Pending statuses
  pending: { label: 'En attente', className: 'text-cyber-yellow bg-cyber-yellow-soft border-cyber-yellow/20' },
  en_attente: { label: 'En attente', className: 'text-cyber-yellow bg-cyber-yellow-soft border-cyber-yellow/20' },
  
  // Processing statuses
  processing: { label: 'En cours', className: 'text-cyber-cyan bg-cyber-cyan-soft border-cyber-cyan/20' },
  en_cours: { label: 'En cours', className: 'text-cyber-cyan bg-cyber-cyan-soft border-cyber-cyan/20' },
  contacted: { label: 'Contacte', className: 'text-cyber-cyan bg-cyber-cyan-soft border-cyber-cyan/20' },
  in_progress: { label: 'En cours', className: 'text-cyber-cyan bg-cyber-cyan-soft border-cyber-cyan/20' },
  
  // Completed statuses
  completed: { label: 'Complete', className: 'text-cyber-green bg-cyber-green-soft border-cyber-green/20' },
  complete: { label: 'Complete', className: 'text-cyber-green bg-cyber-green-soft border-cyber-green/20' },
  livree: { label: 'Livre', className: 'text-cyber-green bg-cyber-green-soft border-cyber-green/20' },
  delivered: { label: 'Livre', className: 'text-cyber-green bg-cyber-green-soft border-cyber-green/20' },
  
  // Rejected/Cancelled statuses
  rejected: { label: 'Rejete', className: 'text-cyber-red bg-cyber-red-soft border-cyber-red/20' },
  refuse: { label: 'Refuse', className: 'text-cyber-red bg-cyber-red-soft border-cyber-red/20' },
  annulee: { label: 'Annule', className: 'text-cyber-red bg-cyber-red-soft border-cyber-red/20' },
  cancelled: { label: 'Annule', className: 'text-cyber-red bg-cyber-red-soft border-cyber-red/20' },
  refunded: { label: 'Rembourse', className: 'text-cyber-purple bg-cyber-purple-soft border-cyber-purple/20' },
  
  // Active/Inactive
  active: { label: 'Actif', className: 'text-cyber-green bg-cyber-green-soft border-cyber-green/20' },
  inactive: { label: 'Inactif', className: 'text-muted-foreground bg-muted border-border' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { 
    label: status, 
    className: 'text-muted-foreground bg-muted border-border' 
  }

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}
