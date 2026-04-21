import { cn } from "@/lib/utils";

export function CategoryPill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-glow"
          : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
