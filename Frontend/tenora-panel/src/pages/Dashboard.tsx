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
import { useDashboard, useOrders } from "@/lib/queries/admin";
import { cn } from "@/lib/utils";

const fmtMoney = (n: number) => `${n?.toLocaleString("fr-FR")} F`;

export default function Dashboard() {
  const { data, isLoading: loadingDash, refetch: refetchDash } = useDashboard();
  const { data: recentData, isLoading: loadingOrders, refetch: refetchOrders } = useOrders({ page: 1, per_page: 6 });

  const loading = loadingDash || loadingOrders;
  const recent  = (recentData?.orders ?? []) as Array<{
    id: number; user_email: string; product_name: string;
    total_price: number; status: string; created_at: string;
  }>;

  const refresh = () => { refetchDash(); refetchOrders(); };

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const chartData = data?.chart?.map?.((r: { day: string; orders: number; revenue: number }) => ({
    name: r.day,
    orders: r.orders || 0,
    revenue: Math.round((r.revenue || 0) / 1000),
  })) ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Vue d'ensemble" title="Dashboard" subtitle={`// ${dateLabel}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
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
              icon={CheckCircle} label="Complétées" value={data.stats.completed_orders}
              delta="total" deltaType="positive" color="success"
            />
          </div>

          {/* Chart + Recent */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Area chart */}
            <div className="border-2 border-border p-4 lg:col-span-2">
              <p className="eyebrow mb-4">// Activité 7 jours</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                  <YAxis tick={{ fontSize: 9, fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                  <Tooltip
                    contentStyle={{ border: "2px solid hsl(var(--border))", borderRadius: 0, background: "hsl(var(--background))", fontFamily: "monospace", fontSize: 11 }}
                    formatter={(v: number, name: string) => [name === "revenue" ? `${v}k F` : v, name === "revenue" ? "Revenu" : "Commandes"]}
                  />
                  <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorOrders)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Meta stats */}
            <div className="border-2 border-border p-4 space-y-3">
              <p className="eyebrow mb-2">// Métriques globales</p>
              <MetaRow icon={Users} label="Utilisateurs" value={data.stats.total_users} />
              <MetaRow icon={Package} label="Produits actifs" value={data.stats.total_products} />
              <MetaRow icon={TrendingUp} label="Revenu semaine" value={fmtMoney(data.stats.revenue_week)} />
              <MetaRow icon={Inbox} label="En attente" value={data.stats.pending_orders} warn={data.stats.pending_orders > 0} />
            </div>
          </div>

          {/* Recent orders */}
          <div className="border-2 border-border">
            <div className="flex items-center justify-between p-4 border-b-2 border-border">
              <p className="eyebrow">// Dernières commandes</p>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="rounded-none mono text-[10px] uppercase tracking-wider">
                  Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            {loadingOrders ? (
              <div className="divide-y-2 divide-border">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-none" />)}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-center text-muted-foreground mono text-xs py-8">// Aucune commande</p>
            ) : (
              <div className="divide-y-2 divide-border">
                {recent.map((o) => (
                  <div key={o.id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-4 py-3">
                    <span className="mono text-[10px] text-muted-foreground w-10 shrink-0">#{o.id}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{o.product_name || "--"}</p>
                      <p className="text-[10px] mono text-muted-foreground truncate">{o.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                      <span className="mono text-xs font-bold">{fmtMoney(o.total_price)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetaRow({ icon: Icon, label, value, warn }: { icon: React.ElementType; label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <Icon className={cn("h-4 w-4 shrink-0", warn ? "text-warning" : "text-muted-foreground")} />
      <span className="mono text-xs text-muted-foreground flex-1">{label}</span>
      <span className={cn("mono text-xs font-bold", warn && "text-warning")}>{value ?? "--"}</span>
    </div>
  );
}
