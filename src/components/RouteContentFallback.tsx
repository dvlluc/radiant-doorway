import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RouteContentFallbackProps {
  compact?: boolean;
}

/** Скелетон с фиксированной высотой — без схлопывания layout (header не дёргается) */
export function RouteContentFallback({ compact }: RouteContentFallbackProps) {
  return (
    <div
      className={cn(
        "w-full space-y-4",
        compact ? "max-w-lg mx-auto min-h-[480px] py-2" : "min-h-[560px] py-6",
      )}
      aria-busy
      aria-label="Loading page"
    >
      <Skeleton className={cn("rounded-xl", compact ? "h-6 w-40" : "h-8 w-56")} />
      <Skeleton className={cn("w-full rounded-2xl", compact ? "h-48" : "h-72")} />
      <Skeleton className={cn("w-full rounded-2xl", compact ? "h-24" : "h-40")} />
    </div>
  );
}
