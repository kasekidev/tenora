import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ordersApi, formatXOF, type Order } from "@/lib/api";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Loader2,
  ShoppingBag,
  Search,
  Receipt,
  Wallet,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusKey = Order["status"];

const STATUS: Record<StatusKey, { label: string; dot: string; chip: string; icon: any }> = {
  pending:    { label: "En attente",    dot: "bg-warning",     chip: "bg-warning/10 text-warning border-warning/30",         icon: Clock },
  processing: { label: "En traitement", dot: "bg-secondary",   chip: "bg-secondary/10 text-secondary border-secondary/30",   icon: Loader2 },
  completed:  { label: "Livrée",        dot: "bg-success",     chip: "bg-success/10 text-success border-success/30",         icon: CheckCircle2 },
  rejected:   { label: "Rejetée",       dot: "bg-destructive", chip: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  refunded:   { label: "Remboursée",    dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground border-border",    icon: RefreshCcw },
};

const FILTERS: { key: "all" | StatusKey; label: string }[] = [
  { key: "all",        label: "Toutes" },
  { key: "pending",    label: "En attente" },
  { key: "processing", label: "En cours" },
  { key: "completed",  label: "Livrées" },
  { key: "rejected",   label: "Rejetées" },
  { key: "refunded",   label: "Remboursées" },
];

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Orders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["orders", "my"],
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
  });

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => {
      toast.success("Commande annulée.");
      qc.invalidateQueries({ queryKey: ["orders", "my"] });
      setConfirmCancel(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.detail || error?.response?.data?.message;
      toast.error(apiMessage || "Impossible d'annuler cette commande.");
    },
  });

  const stats = useMemo(() => {
    const total = orders.length;
    const spent = orders
      .filter((o) => o.status !== "rejected" && o.status !== "refunded")
      .reduce((s, o) => s + o.total_price, 0);
    const pending = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    return { total, spent, pending, completed };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!String(o.id).includes(q) && !(o.payment_method || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, filter, search]);

  return (
    <div className="container-app py-8 md:py-12 max-w-5xl">
      {/* Header */}
      <div className="mb-8 border-b-2 border-border pb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 font-mono">// Historique</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl md:text-6xl font-bold uppercase leading-none">Mes commandes</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-2 uppercase tracking-wider text-xs font-bold"
          >
            <RefreshCcw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard icon={Receipt}      label="Total"     value={String(stats.total)} />
          <StatCard icon={Clock}        label="En cours"  value={String(stats.pending)} accent="warning" />
          <StatCard icon={CheckCircle2} label="Livrées"   value={String(stats.completed)} accent="success" />
          <StatCard icon={Wallet}       label="Dépensé"   value={formatXOF(stats.spent)} mono />
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse border-2 border-border" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Toolbar : recherche + filtres */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="relative md:max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher #ID, paiement…"
                className="w-full h-11 pl-10 pr-3 bg-input border-2 border-border text-sm font-medium focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 md:flex-wrap md:overflow-visible">
              {FILTERS.map((f) => {
                const count = f.key === "all" ? orders.length : orders.filter((o) => o.status === f.key).length;
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`shrink-0 inline-flex items-center gap-2 px-3 h-11 border-2 text-xs font-bold uppercase tracking-wider transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {f.label}
                    <span className={`text-[10px] px-1.5 py-0.5 ${active ? "bg-primary-foreground/20" : "bg-muted"} rounded-sm`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border">
              <Package className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-display font-bold text-2xl uppercase">Aucune commande</p>
              <p className="text-sm text-muted-foreground mt-1">Aucun résultat pour ce filtre.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((o) => {
                const s = STATUS[o.status];
                const Icon = s.icon;
                const normalizedStatus = o.status?.toLowerCase?.();
                const canCancel = normalizedStatus === "pending" || normalizedStatus === "processing";
                return (
                  <article
                    key={o.id}
                    className="group relative bg-card border-2 border-border hover:border-foreground/40 transition-all"
                  >
                    {/* Bandeau statut */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.dot}`} aria-hidden />

                    <div className="p-4 md:p-5 pl-5 md:pl-7">
                      {/* Top */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                            <Hash className="size-3" />
                            <span>{String(o.id).padStart(5, "0")}</span>
                            <span>·</span>
                            <span>{timeAgo(o.created_at)}</span>
                          </div>
                          <p className="font-display font-bold text-xl mt-1">
                            Commande #{o.id}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold uppercase tracking-wider ${s.chip}`}>
                          <Icon className={`size-3 ${normalizedStatus === "processing" ? "animate-spin" : ""}`} /> {s.label}
                        </span>
                      </div>

                      {/* Meta grid */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <Meta label="Quantité"  value={String(o.quantity)} />
                        <Meta label="Paiement"  value={o.payment_method || "—"} />
                        <Meta label="Date"      value={new Date(o.created_at).toLocaleDateString("fr-FR")} />
                        <Meta label="Total"     value={formatXOF(o.total_price)} highlight />
                      </div>

                      {/* Note staff */}
                      {o.staff_note && (
                        <div className="mt-4 border-l-2 border-secondary pl-3 py-2 bg-secondary/5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Note de l'équipe</p>
                          <p className="text-sm text-foreground">{o.staff_note}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                        <Button asChild variant="outline" size="sm" className="border-2 text-xs font-bold uppercase tracking-wider">
                          <Link to={`/produit/${o.product_id}`}>Voir le produit</Link>
                        </Button>
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmCancel(o)}
                            className="border-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive text-xs font-bold uppercase tracking-wider"
                          >
                            <XCircle className="size-4" /> Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Confirmation annulation */}
      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl uppercase">Annuler cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              La commande <span className="font-mono font-bold text-foreground">#{confirmCancel?.id}</span> sera marquée comme rejetée.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2">Garder</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCancel && cancelMutation.mutate(confirmCancel.id)}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive"
            >
              {cancelMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent, mono,
}: { icon: any; label: string; value: string; accent?: "warning" | "success"; mono?: boolean }) {
  const accentClass =
    accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : "text-foreground";
  return (
    <div className="border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className={`mt-2 font-display font-bold text-2xl md:text-3xl uppercase ${accentClass} ${mono ? "tabular-nums" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Meta({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
      <p className={`mt-0.5 font-semibold ${highlight ? "font-display text-lg text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border-2 border-dashed border-border">
      <ShoppingBag className="size-14 mx-auto text-muted-foreground mb-4" />
      <p className="font-display font-bold text-3xl uppercase">Aucune commande</p>
      <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
        Découvrez la boutique et passez votre première commande dès maintenant.
      </p>
      <Button asChild className="border-2 border-primary uppercase tracking-wider font-bold">
        <Link to="/boutique">Aller à la boutique</Link>
      </Button>
    </div>
  );
}
