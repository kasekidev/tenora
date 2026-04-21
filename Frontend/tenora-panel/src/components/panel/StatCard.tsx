import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  delta?: string;
  deltaType?: "positive" | "warning" | "neutral";
  color?: "primary" | "secondary" | "tertiary" | "success" | "warning";
}

const colorMap = {
  primary: { ring: "border-primary/40", glow: "bg-primary/10", text: "text-primary" },
  secondary: { ring: "border-secondary/40", glow: "bg-secondary/10", text: "text-secondary" },
  tertiary: { ring: "border-tertiary/40", glow: "bg-tertiary/10", text: "text-tertiary" },
  success: { ring: "border-success/40", glow: "bg-success/10", text: "text-success" },
  warning: { ring: "border-warning/40", glow: "bg-warning/10", text: "text-warning" },
};

export function StatCard({ icon: Icon, label, value, subtitle, delta, deltaType = "neutral", color = "primary" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="brackets brut-card brut-card-hover p-5 group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn("flex h-10 w-10 items-center justify-center border-2", c.ring, c.glow)}>
          <Icon className={cn("h-5 w-5", c.text)} />
        </div>
        {delta && (
          <span
            className={cn(
              "chip",
              deltaType === "positive" && "border-success/40 text-success bg-success-soft",
              deltaType === "warning" && "border-warning/40 text-warning bg-warning-soft",
              deltaType === "neutral" && "border-border text-muted-foreground"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="eyebrow mb-1 text-muted-foreground" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </p>
      <p className="display text-3xl mb-1">{value}</p>
      {subtitle && <p className="text-xs mono text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
