import * as React from "react";

import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "default" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  default: "size-8 border-2",
  lg: "size-12 border-[3px]",
};

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
}

function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-muted border-t-foreground",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
