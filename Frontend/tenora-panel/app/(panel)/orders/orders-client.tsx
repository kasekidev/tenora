'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, ChevronRight, ExternalLink, MessageCircle } from 'lucide-react'
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
import { getOrders, updateOrderStatus, exportOrdersCsv } from '@/lib/api/orders'
import api from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Order {
  id: number
  user_email: string
  product_name: string
  quantity: number
  total_price: number
  status: string
  payment_method: string
  created_at: string
  notes?: string
  staff_note?: string
  screenshot_path?: string
  customer_info?: {
    delivery_name?: string
    delivery_phone?: string
    delivery_address?: string
  }
}

const statusOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'En cours', value: 'processing' },
  { label: 'Completees', value: 'completed' },
  { label: 'Rejetees', value: 'rejected' },
  { label: 'Remboursees', value: 'refunded' },
]

const editStatusOptions = [
  { label: 'En attente', value: 'pending' },
  { label: 'En cours', value: 'processing' },
  { label: 'Completee', value: 'completed' },
  { label: 'Rejetee', value: 'rejected' },
  { label: 'Remboursee', value: 'refunded' },
]

export default function OrdersClient() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  
  const [showDetail, setShowDetail] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const fmtPrice = (n: number) => `${n?.toLocaleString('fr-FR')} F`

  const screenshotUrl = (path: string | null): string => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = (api.defaults.baseURL || '').replace(/\/$/, '')
    return `${base}/uploads/${path}`
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        per_page: pageSize,
      })
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Orders fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const openDetail = (order: Order) => {
    setSelectedOrder(order)
    setEditStatus(order.status)
    setShowDetail(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return
    setUpdatingStatus(true)
    try {
      await updateOrderStatus(selectedOrder.id, { status: editStatus })
      setSelectedOrder({ ...selectedOrder, status: editStatus })
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: editStatus } : o))
      toast.success('Statut mis a jour')
    } catch (error) {
      toast.error('Erreur lors de la mise a jour')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleExport = async () => {
    try {
      const { data } = await exportOrdersCsv(statusFilter !== 'all' ? statusFilter : undefined)
      const url = URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export CSV telecharge')
    } catch (error) {
      toast.error("Erreur lors de l'export")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Gestion"
        title="Commandes"
        subtitle={`${total} commande${total !== 1 ? 's' : ''} au total`}
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

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
            <span className="font-mono text-xs text-muted-foreground">{total}</span>
          </div>
        </DataCardHeader>

        <DataCardContent>
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <Download className="h-5 w-5" />
              </div>
              <p className="text-sm">Aucune commande</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => openDetail(order)}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground">#{order.id}</span>
                  
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyber-yellow-soft border border-cyber-yellow/20 font-mono text-xs font-semibold text-cyber-yellow">
                    {order.user_email?.[0]?.toUpperCase() || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{order.product_name || '--'}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.user_email}</p>
                  </div>
                  
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {fmtDate(order.created_at)}
                  </div>
                  
                  <div className="font-mono text-sm font-medium">
                    {fmtPrice(order.total_price)}
                  </div>
                  
                  <StatusBadge status={order.status} />
                  
                  <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                    {order.payment_method}
                  </span>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {total > pageSize && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Precedent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} sur {Math.ceil(total / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </DataCardContent>
      </DataCard>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Commande #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Informations</SectionTitle>
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
                      <Button size="sm" onClick={handleUpdateStatus} disabled={updatingStatus}>
                        {updatingStatus ? '...' : 'Maj'}
                      </Button>
                    </div>
                  </div>
                  <DetailRow label="Date" value={fmtDate(selectedOrder.created_at)} />
                  <DetailRow label="Produit" value={selectedOrder.product_name || '--'} />
                  <DetailRow label="Quantite" value={selectedOrder.quantity.toString()} />
                  <DetailRow label="Total" value={fmtPrice(selectedOrder.total_price)} highlight />
                  <DetailRow label="Paiement" value={selectedOrder.payment_method} />
                </div>
              </div>

              <div>
                <SectionTitle>Client</SectionTitle>
                <div className="space-y-3">
                  <DetailRow label="Email" value={selectedOrder.user_email} />
                  {selectedOrder.customer_info?.delivery_name && (
                    <DetailRow label="Nom" value={selectedOrder.customer_info.delivery_name} />
                  )}
                  {selectedOrder.customer_info?.delivery_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Tel.</span>
                      <a
                        href={`https://wa.me/${selectedOrder.customer_info.delivery_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-green-500 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {selectedOrder.customer_info.delivery_phone}
                      </a>
                    </div>
                  )}
                  {selectedOrder.customer_info?.delivery_address && (
                    <DetailRow label="Adresse" value={selectedOrder.customer_info.delivery_address} />
                  )}
                </div>
              </div>

              {(selectedOrder.notes || selectedOrder.staff_note) && (
                <div>
                  <SectionTitle>Notes</SectionTitle>
                  {selectedOrder.notes && (
                    <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mb-2">
                      {selectedOrder.notes}
                    </p>
                  )}
                  {selectedOrder.staff_note && (
                    <p className="text-sm bg-cyber-yellow-soft border border-cyber-yellow/20 rounded-lg p-3">
                      {selectedOrder.staff_note}
                    </p>
                  )}
                </div>
              )}

              {selectedOrder.screenshot_path && (
                <div>
                  <SectionTitle>Preuve de paiement</SectionTitle>
                  <a
                    href={screenshotUrl(selectedOrder.screenshot_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-lg overflow-hidden border border-border group"
                  >
                    <img
                      src={screenshotUrl(selectedOrder.screenshot_path)}
                      alt="Capture paiement"
                      className="w-full max-h-48 object-contain bg-muted"
                    />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                  </a>
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
