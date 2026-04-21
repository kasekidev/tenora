import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ordersApi, formatXOF, type Order } from "@/lib/api";
import { Package, Clock, CheckCircle2, XCircle, RefreshCcw, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS: Record<Order["status"], { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  processing: { label: "En traitement", color: "bg-secondary/15 text-secondary border-secondary/30", icon: Loader2 },
  completed: { label: "Livrée", color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  rejected: { label: "Rejetée", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
  refunded: { label: "Remboursée", color: "bg-muted text-muted-foreground border-border", icon: RefreshCcw },
};

export default function Orders() {
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["orders", "my"],
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
  });

  return (
    <div className="container-app py-8 md:py-12 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold">Mes commandes</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCcw className="size-4" /> Actualiser</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 card-elev rounded-2xl">
          <ShoppingBag className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Aucune commande pour l'instant.</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Découvrez notre boutique pour faire votre premier achat.</p>
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/boutique">Aller à la boutique</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const s = STATUS[o.status];
            const Icon = s.icon;
            return (
              <div key={o.id} className="card-elev rounded-2xl p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">Commande #{o.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                  <span className={`chip border ${s.color}`}><Icon className="size-3" /> {s.label}</span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="text-sm text-muted-foreground">
                    Quantité : <span className="text-foreground font-medium">{o.quantity}</span>
                    {o.payment_method && <> · {o.payment_method}</>}
                  </div>
                  <p className="font-display font-bold text-lg gradient-text">{formatXOF(o.total_price)}</p>
                </div>
                {o.staff_note && (
                  <p className="mt-3 text-xs text-muted-foreground bg-muted rounded-lg p-2.5 flex gap-2"><span className="font-semibold text-foreground shrink-0">Note :</span>{o.staff_note}</p>
                )}
                {o.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={async () => {
                      try { await ordersApi.cancel(o.id); refetch(); } catch {}
                    }}
                  >
                    Annuler la commande
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
