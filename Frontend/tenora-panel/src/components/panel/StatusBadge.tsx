import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:    { label: "En attente",  cls: "border-warning/40 text-warning bg-warning-soft" },
  processing: { label: "En cours",    cls: "border-tertiary/40 text-tertiary bg-tertiary-soft" },
  completed:  { label: "Completee",   cls: "border-success/40 text-success bg-success-soft" },
  rejected:   { label: "Rejetee",     cls: "border-destructive/40 text-destructive bg-destructive-soft" },
  refunded:   { label: "Remboursee",  cls: "border-secondary/40 text-secondary bg-secondary-soft" },
  active:     { label: "Actif",       cls: "border-success/40 text-success bg-success-soft" },
  inactive:   { label: "Inactif",     cls: "border-border text-muted-foreground bg-muted" },
  approved:   { label: "Approuvee",   cls: "border-success/40 text-success bg-success-soft" },
  shipped:    { label: "Expediee",    cls: "border-tertiary/40 text-tertiary bg-tertiary-soft" },
  received:   { label: "Recue",       cls: "border-success/40 text-success bg-success-soft" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusMap[status] || { label: status, cls: "border-border text-muted-foreground" };
  return (
    <span className={cn("chip", cfg.cls)}>
      <span className="status-dot bg-current" />
      {cfg.label}
    </span>
  );
}
