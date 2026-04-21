'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ShoppingBag, 
  Wallet, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  ArrowRight,
  Package,
  Inbox,
  Settings
} from 'lucide-react'
import { PageHeader } from '@/components/panel/page-header'
import { StatCard } from '@/components/panel/stat-card'
import { StatusBadge } from '@/components/panel/status-badge'
import { Skeleton, SkeletonCard, SkeletonRow } from '@/components/panel/skeleton'
import { Button } from '@/components/ui/button'
import { getDashboard } from '@/lib/api/dashboard'
import { getOrders } from '@/lib/api/orders'
import { cn } from '@/lib/utils'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DashboardData {
  stats: {
    total_orders: number
    orders_today: number
    total_revenue: number
    revenue_week: number
    pending_orders: number
    completed_orders: number
    rejected_orders: number
    total_users: number
    total_products: number
  }
  chart: {
    labels: string[]
    orders: number[]
    revenue: number[]
  }
}

interface Order {
  id: number
  user_email: string
  product_name: string
  total_price: number
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const [dashRes, ordersRes] = await Promise.all([
        getDashboard(),
        getOrders({ page: 1, per_page: 6 }),
      ])
      setData(dashRes.data)
      setRecentOrders(ordersRes.data?.orders || [])
    } catch (error) {
      console.error('[v0] Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const dateLabel = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  const fmtMoney = (n: number) => `${n?.toLocaleString('fr-FR')} FCFA`
  const fmtShort = (n: number) => `${n?.toLocaleString('fr-FR')} F`

  const completionRate = data?.stats.total_orders 
    ? Math.round((data.stats.completed_orders / data.stats.total_orders) * 100) 
    : 0

  const rejectionRate = data?.stats.total_orders 
    ? Math.round(((data.stats.rejected_orders || 0) / data.stats.total_orders) * 100) 
    : 0

  const avgOrderValue = data?.stats.total_orders 
    ? fmtMoney(Math.round(data.stats.total_revenue / data.stats.total_orders))
    : '--'

  const chartData = data?.chart?.labels?.map((label, i) => ({
    name: label,
    orders: data.chart.orders[i] || 0,
    revenue: Math.round((data.chart.revenue[i] || 0) / 1000),
  })) || []

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow="Vue d'ensemble"
          title="Dashboard"
          subtitle={dateLabel}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={load}
          disabled={loading}
          className="h-9 w-9"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {loading && !data ? (
        <>
          {/* Skeleton KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* Skeleton content */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </>
      ) : data && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ShoppingBag}
              label="Commandes"
              value={data.stats.total_orders}
              delta={`+${data.stats.orders_today} auj.`}
              deltaType="positive"
              color="yellow"
            />
            <StatCard
              icon={Wallet}
              label="Revenu total"
              value={fmtMoney(data.stats.total_revenue)}
              subtitle={`${fmtMoney(data.stats.revenue_week)} / semaine`}
              delta="cette semaine"
              deltaType="positive"
              color="cyan"
            />
            <StatCard
              icon={Clock}
              label="En attente"
              value={data.stats.pending_orders}
              delta={data.stats.pending_orders > 0 ? 'A traiter' : undefined}
              deltaType="warning"
              color="cyan"
            />
            <StatCard
              icon={CheckCircle}
              label="Completees"
              value={data.stats.completed_orders}
              subtitle={`${data.stats.total_users} utilisateurs`}
              color="green"
            />
          </div>

          {/* Charts & Orders */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Chart */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cyber-yellow mb-1">
                    Analytiques
                  </p>
                  <h3 className="font-semibold">Activite - 7 derniers jours</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyber-yellow" />
                    <span className="text-xs text-muted-foreground">Commandes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyber-cyan" />
                    <span className="text-xs text-muted-foreground">Revenu</span>
                  </div>
                </div>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.88 0.18 95)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(0.88 0.18 95)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.75 0.15 195)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(0.75 0.15 195)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="oklch(0.88 0.18 95)"
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="oklch(0.75 0.15 195)"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cyber-yellow mb-1">
                    Activite recente
                  </p>
                  <h3 className="font-semibold">Dernieres commandes</h3>
                </div>
                <Link 
                  href="/orders"
                  className="flex items-center gap-1 rounded-md bg-cyber-yellow-soft border border-cyber-yellow/20 px-2 py-1 text-xs font-semibold text-cyber-yellow hover:bg-cyber-yellow-soft/80 transition-colors"
                >
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-2">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <p className="text-sm">Aucune commande recente</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/orders"
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-muted-foreground">
                        {order.user_email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{order.product_name || '--'}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.user_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium">{fmtShort(order.total_price)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cyber-yellow mb-1">
                Raccourcis
              </p>
              <h3 className="font-semibold mb-4">Actions rapides</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/orders?status=processing"
                  className="relative flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-cyan-soft border border-cyber-cyan/20 text-cyber-cyan">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">En cours</p>
                    <p className="text-xs text-muted-foreground">{data.stats.pending_orders} a traiter</p>
                  </div>
                  {data.stats.pending_orders > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyber-red font-mono text-[10px] font-semibold text-white shadow-[0_0_8px_rgba(var(--cyber-red),0.5)]">
                      {data.stats.pending_orders}
                    </span>
                  )}
                </Link>

                <Link
                  href="/products"
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-yellow-soft border border-cyber-yellow/20 text-cyber-yellow">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Produits</p>
                    <p className="text-xs text-muted-foreground">{data.stats.total_products} actifs</p>
                  </div>
                </Link>

                <Link
                  href="/imports"
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-purple-soft border border-cyber-purple/20 text-cyber-purple">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Imports</p>
                    <p className="text-xs text-muted-foreground">Demandes clients</p>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-yellow-soft border border-cyber-yellow/20 text-cyber-yellow">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Parametres</p>
                    <p className="text-xs text-muted-foreground">Config & paiements</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Metrics */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cyber-yellow mb-1">
                Metriques
              </p>
              <h3 className="font-semibold mb-4">Vue d'ensemble</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Taux de completion
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">{completionRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-cyber-green transition-all duration-700 shadow-[0_0_8px_var(--cyber-green)]"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Taux de rejet
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">{rejectionRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-cyber-red transition-all duration-700 shadow-[0_0_8px_var(--cyber-red)]"
                      style={{ width: `${rejectionRate}%` }}
                    />
                  </div>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
                      Panier moyen
                    </p>
                    <p className="font-mono text-xl font-semibold">{avgOrderValue}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
                      Produits actifs
                    </p>
                    <p className="font-mono text-xl font-semibold">{data.stats.total_products}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
