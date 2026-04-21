'use client'

import { useEffect, useState, useCallback } from 'react'
import { Inbox, ExternalLink, ChevronRight, MessageCircle } from 'lucide-react'
import { PageHeader } from '@/components/panel/page-header'
import { StatusBadge } from '@/components/panel/status-badge'
import { DataCard, DataCardHeader, DataCardContent } from '@/components/panel/data-card'
import { SkeletonRow } from '@/components/panel/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getImports, updateImportStatus } from '@/lib/api/imports'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Import {
  id: number
  user_email: string
  title?: string
  details?: string
  url?: string
  budget?: number
  quantity?: number
  phone?: string
  notes?: string
  status: string
  created_at: string
}

const statusOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'Contacte', value: 'contacted' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'Livre', value: 'delivered' },
  { label: 'Annule', value: 'cancelled' },
]

const editStatusOptions = statusOptions.slice(1)

export default function ImportsPage() {
  const [imports, setImports] = useState<Import[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<Import | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const fmtPrice = (n: number) => `${n?.toLocaleString('fr-FR')} F`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getImports(statusFilter !== 'all' ? statusFilter : undefined)
      if (Array.isArray(data)) {
        setImports(data)
        setTotal(data.length)
      } else {
        setImports(data.imports || data || [])
        setTotal(data.total || (data.imports || data || []).length)
      }
    } catch (error) {
      console.error('[v0] Imports load error:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  const openDetail = (imp: Import) => {
    setSelected(imp)
    setEditStatus(imp.status)
    setShowDetail(true)
  }

  const handleUpdateStatus = async () => {
    if (!selected) return
    setUpdating(true)
    try {
      await updateImportStatus(selected.id, { status: editStatus })
      setSelected({ ...selected, status: editStatus })
      setImports(imports.map(i => i.id === selected.id ? { ...i, status: editStatus } : i))
      toast.success('Statut mis a jour')
    } catch (error) {
      toast.error('Erreur lors de la mise a jour')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Logistique"
        title="Demandes d'import"
        subtitle={`${total} demande${total !== 1 ? 's' : ''} recues`}
      />

      <DataCard>
        <DataCardHeader>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === opt.value
                    ? "border-cyber-yellow/20 bg-cyber-yellow-soft text-cyber-yellow"
                    : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5">
            <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">{total}</span>
          </div>
        </DataCardHeader>

        <DataCardContent>
          {loading ? (
            <div>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-sm">Aucune demande</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {imports.map((imp) => (
                <div
                  key={imp.id}
                  onClick={() => openDetail(imp)}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground">#{imp.id}</span>
                  
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyber-yellow-soft border border-cyber-yellow/20 font-mono text-[10px] font-semibold text-cyber-yellow">
                    {imp.user_email?.[0]?.toUpperCase() || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{imp.title || imp.details || '--'}</p>
                    <p className="text-xs text-muted-foreground truncate">{imp.user_email}</p>
                  </div>
                  
                  {imp.url && (
                    <a 
                      href={imp.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-cyber-cyan hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Lien
                    </a>
                  )}
                  
                  {imp.budget && (
                    <span className="font-mono text-sm font-medium">{fmtPrice(imp.budget)}</span>
                  )}
                  
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {fmtDate(imp.created_at)}
                  </div>
                  
                  <StatusBadge status={imp.status} />
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </DataCardContent>
      </DataCard>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Import #{selected?.id}</DialogTitle>
          </DialogHeader>
          
          {selected && (
            <div className="space-y-6">
              {/* Demande section */}
              <div>
                <SectionTitle>Demande</SectionTitle>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Statut</span>
                    <div className="flex items-center gap-2">
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {editStatusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleUpdateStatus} disabled={updating}>
                        {updating ? '...' : 'Maj'}
                      </Button>
                    </div>
                  </div>
                  <DetailRow label="Article" value={selected.title || selected.details || '--'} />
                  {selected.url && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Lien</span>
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-cyber-cyan hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir le produit
                      </a>
                    </div>
                  )}
                  {selected.budget && <DetailRow label="Budget" value={fmtPrice(selected.budget)} highlight />}
                  {selected.quantity && <DetailRow label="Quantite" value={selected.quantity.toString()} />}
                </div>
              </div>

              {/* Client section */}
              <div>
                <SectionTitle>Client</SectionTitle>
                <div className="space-y-3">
                  <DetailRow label="Email" value={selected.user_email} />
                  {selected.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Tel.</span>
                      <a
                        href={`https://wa.me/${selected.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-green-500 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {selected.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <SectionTitle>Notes client</SectionTitle>
                  <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                    {selected.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cyber-yellow">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm", highlight && "font-mono font-semibold")}>{value}</span>
    </div>
  )
}
