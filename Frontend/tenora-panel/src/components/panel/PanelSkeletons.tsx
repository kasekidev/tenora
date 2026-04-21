import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return <Skeleton className="h-32 w-full rounded-none" />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b-2 border-border p-4">
      <Skeleton className="h-9 w-9" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

export { Skeleton };
