import { useEffect, useState, useCallback } from "react";
import { Download, ChevronRight, ShoppingCart, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/panel/PageHeader";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { DataCard, DataCardHeader, DataCardContent } from "@/components/panel/DataCard";
import { SkeletonRow } from "@/components/panel/PanelSkeletons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getOrders, updateOrderStatus, exportOrdersCsv } from "@/lib/api/orders";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Order {
  id: number; user_email: string; product_name: string;
  quantity: number; total_price: number; status: string;
  payment_method: string; created_at: string;
  notes?: string; staff_note?: string; screenshot_path?: string;
  customer_info?: { delivery_name?: string; delivery_phone?: string; delivery_address?: string; };
}

const statusOptions = [
  { label: "Toutes", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "En cours", value: "processing" },
  { label: "Completees", value: "completed" },
  { label: "Rejetees", value: "rejected" },
  { label: "Remboursees", value: "refunded" },
];
const editStatuses = statusOptions.slice(1);

const screenshotUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  return `${base}/uploads/${path}`;
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState("all");

  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getOrders({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page, per_page: pageSize,
      });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmt = (n: number) => `${n?.toLocaleString("fr-FR")} F`;

  const open = (o: Order) => {
    setSelected(o); setEditStatus(o.status); setStaffNote(o.staff_note || "");
    setShow(true);
  };

  const updateStatus = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await updateOrderStatus(selected.id, { status: editStatus, staff_note: staffNote });
      setOrders(orders.map((o) => o.id === selected.id ? { ...o, status: editStatus, staff_note: staffNote } : o));
      setSelected({ ...selected, status: editStatus, staff_note: staffNote });
      toast.success("Statut mis a jour");
    } catch {
      toast.error("Erreur");
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await exportOrdersCsv(statusFilter !== "all" ? statusFilter : undefined);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url; a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("CSV exporte");
    } catch {
      toast.error("Erreur export");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Gestion" title="Commandes" subtitle={`// ${total} entree(s)`}>
        <Button variant="outline" onClick={handleExport} className="h-9 rounded-none border-2 mono uppercase tracking-wider text-xs">
          <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
        </Button>
      </PageHeader>

      <DataCard>
        <DataCardHeader>
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            {statusOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => { setStatusFilter(o.value); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 border-2 mono text-[10px] uppercase tracking-[0.15em] font-semibold transition-all whitespace-nowrap",
                  statusFilter === o.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <span className="chip border-border ml-auto">{total} TOTAL</span>
        </DataCardHeader>

        <DataCardContent>
          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2" />
              <p className="text-sm mono">// Aucune commande</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => open(o)}
                  className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className="mono text-[10px] text-muted-foreground w-12">#{o.id}</span>
                  <div className="h-9 w-9 border-2 border-primary/40 bg-primary-soft flex items-center justify-center mono text-xs font-bold text-primary shrink-0">
                    {o.user_email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{o.product_name || "--"}</p>
                    <p className="text-[10px] mono text-muted-foreground truncate">{o.user_email}</p>
                  </div>
                  <div className="hidden md:block mono text-[10px] text-muted-foreground">{fmtDate(o.created_at)}</div>
                  <div className="mono text-sm font-bold">{fmt(o.total_price)}</div>
                  <StatusBadge status={o.status} />
                  <span className="hidden sm:inline-block chip border-border">{o.payment_method}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {total > pageSize && (
            <div className="flex items-center justify-center gap-3 p-4 border-t-2 border-border">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-none border-2 mono uppercase text-[10px] tracking-wider">
                Prev
              </Button>
              <span className="mono text-xs">{page} / {Math.ceil(total / pageSize)}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)} className="rounded-none border-2 mono uppercase text-[10px] tracking-wider">
                Next
              </Button>
            </div>
          )}
        </DataCardContent>
      </DataCard>

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="rounded-none border-2 max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="mono uppercase tracking-wider text-sm">
              // Commande #{selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              {/* Status update */}
              <div className="brackets brut-card p-4 space-y-3">
                <p className="eyebrow">// Statut</p>
                <div className="flex items-center gap-2">
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="rounded-none border-2 mono"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-none border-2">
                      {editStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={updateStatus} disabled={updating} className="rounded-none border-2 border-primary bg-primary text-primary-foreground mono uppercase tracking-wider text-xs">
                    {updating ? "..." : "OK"}
                  </Button>
                </div>
                <div>
                  <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Note interne</Label>
                  <Textarea rows={2} value={staffNote} onChange={(e) => setStaffNote(e.target.value)} className="rounded-none border-2 mono text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mono text-xs">
                <Field label="Client" value={selected.user_email} />
                <Field label="Produit" value={selected.product_name} />
                <Field label="Quantite" value={selected.quantity?.toString()} />
                <Field label="Total" value={`${selected.total_price?.toLocaleString("fr-FR")} F`} highlight />
                <Field label="Paiement" value={selected.payment_method} />
                <Field label="Cree le" value={new Date(selected.created_at).toLocaleString("fr-FR")} />
              </div>

              {selected.customer_info && (
                <div className="brackets brut-card p-4 space-y-2">
                  <p className="eyebrow">// Livraison</p>
                  {selected.customer_info.delivery_name && <p className="text-sm">{selected.customer_info.delivery_name}</p>}
                  {selected.customer_info.delivery_phone && <p className="text-xs mono text-muted-foreground">{selected.customer_info.delivery_phone}</p>}
                  {selected.customer_info.delivery_address && <p className="text-xs text-muted-foreground">{selected.customer_info.delivery_address}</p>}
                </div>
              )}

              {selected.notes && (
                <div className="brackets brut-card p-4">
                  <p className="eyebrow mb-2">// Note client</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}

              {selected.screenshot_path && (
                <div className="brackets brut-card p-4">
                  <p className="eyebrow mb-2">// Capture paiement</p>
                  <a href={screenshotUrl(selected.screenshot_path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 chip border-tertiary/40 text-tertiary hover:bg-tertiary hover:text-tertiary-foreground transition-colors">
                    Ouvrir <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="border-2 border-border p-2.5">
      <p className="eyebrow mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      <p className={cn("mono", highlight ? "text-primary font-bold text-sm" : "text-foreground text-xs")}>
        {value || "--"}
      </p>
    </div>
  );
}
