import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("brackets brut-card overflow-hidden", className)}>{children}</div>
  );
}

export function DataCardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 border-b-2 border-border bg-muted/30 p-3", className)}>
      {children}
    </div>
  );
}

export function DataCardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}
