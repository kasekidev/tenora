import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag, Wallet, Clock, CheckCircle, RefreshCw,
  ArrowRight, Inbox, Users, Package, TrendingUp,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/panel/PageHeader";
import { StatCard } from "@/components/panel/StatCard";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { Skeleton, SkeletonCard } from "@/components/panel/PanelSkeletons";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/api/dashboard";
import { getOrders } from "@/lib/api/orders";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: {
    total_orders: number; orders_today: number;
    total_revenue: number; revenue_week: number;
    pending_orders: number; completed_orders: number; rejected_orders: number;
    total_users: number; total_products: number;
  };
  chart: { labels: string[]; orders: number[]; revenue: number[] };
}
interface Order {
  id: number; user_email: string; product_name: string;
  total_price: number; status: string; created_at: string;
}

const fmtMoney = (n: number) => `${n?.toLocaleString("fr-FR")} F`;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [d, o] = await Promise.all([getDashboard(), getOrders({ page: 1, per_page: 6 })]);
      setData(d.data);
      setRecent(o.data?.orders || []);
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const chartData = data?.chart?.labels?.map((label, i) => ({
    name: label,
    orders: data.chart.orders[i] || 0,
    revenue: Math.round((data.chart.revenue[i] || 0) / 1000),
  })) || [];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Vue d'ensemble" title="Dashboard" subtitle={`// ${dateLabel}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-2 rounded-none mono uppercase tracking-wider text-xs h-9"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      {loading && !data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-none lg:col-span-2" />
            <Skeleton className="h-80 rounded-none" />
          </div>
        </>
      ) : data && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ShoppingBag} label="Commandes" value={data.stats.total_orders}
              delta={`+${data.stats.orders_today} auj.`} deltaType="positive" color="primary"
            />
            <StatCard
              icon={Wallet} label="Revenu total" value={fmtMoney(data.stats.total_revenue)}
              subtitle={`${fmtMoney(data.stats.revenue_week)} / semaine`}
              delta="7J" deltaType="positive" color="tertiary"
            />
            <StatCard
              icon={Clock} label="En attente" value={data.stats.pending_orders}
              delta={data.stats.pending_orders > 0 ? "Action" : undefined}
              deltaType="warning" color="warning"
            />
            <StatCard
              icon={CheckCircle} label="Completees" value={data.stats.completed_orders}
              subtitle={`${data.stats.total_users} utilisateurs`} color="success"
            />
          </div>

          {/* Chart + Recent */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="brackets brut-card p-5 lg:col-span-2">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="eyebrow mb-1">// Analytics_7d</p>
                  <h3 className="display text-xl">Activite recente</h3>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider">
                    <span className="h-2 w-2 bg-primary" /> Commandes
                  </div>
                  <div className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-wider">
                    <span className="h-2 w-2 bg-tertiary" /> Revenu (k)
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--tertiary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--tertiary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "2px solid hsl(var(--primary))",
                        borderRadius: 0,
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                      }}
                    />
                    <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--tertiary))" strokeWidth={2} fill="url(#g2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent orders */}
            <div className="brackets brut-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="eyebrow mb-1">// Live_feed</p>
                  <h3 className="display text-xl">Commandes</h3>
                </div>
                <Link to="/orders" className="chip border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  Voir <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Inbox className="h-8 w-8 mb-2" />
                  <p className="text-xs mono">// Aucune donnee</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((o) => (
                    <Link
                      key={o.id}
                      to="/orders"
                      className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-border hover:bg-muted/30 transition-colors"
                    >
                      <span className="mono text-[10px] text-muted-foreground">#{o.id}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{o.product_name || "--"}</p>
                        <p className="text-[10px] mono text-muted-foreground truncate">{o.user_email}</p>
                      </div>
                      <span className="mono text-xs">{fmtMoney(o.total_price)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="brackets brut-card p-5 flex items-center gap-4">
              <div className="h-10 w-10 border-2 border-primary/40 bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="eyebrow" style={{ color: "hsl(var(--muted-foreground))" }}>Catalogue</p>
                <p className="display text-xl">{data.stats.total_products}</p>
                <p className="text-[10px] mono text-muted-foreground">produits actifs</p>
              </div>
            </div>
            <div className="brackets brut-card p-5 flex items-center gap-4">
              <div className="h-10 w-10 border-2 border-tertiary/40 bg-tertiary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-tertiary" />
              </div>
              <div>
                <p className="eyebrow" style={{ color: "hsl(var(--muted-foreground))" }}>Utilisateurs</p>
                <p className="display text-xl">{data.stats.total_users}</p>
                <p className="text-[10px] mono text-muted-foreground">comptes enregistres</p>
              </div>
            </div>
            <div className="brackets brut-card p-5 flex items-center gap-4">
              <div className="h-10 w-10 border-2 border-secondary/40 bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="eyebrow" style={{ color: "hsl(var(--muted-foreground))" }}>Taux completion</p>
                <p className="display text-xl">
                  {data.stats.total_orders ? Math.round((data.stats.completed_orders / data.stats.total_orders) * 100) : 0}%
                </p>
                <p className="text-[10px] mono text-muted-foreground">sur total commandes</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
