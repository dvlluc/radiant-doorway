import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Задержка появления для каскадных блоков (мс) */
  delay?: number;
  slow?: boolean;
}

/** Локальная анимация блока (не заменяет переход между страницами) */
export function FadeIn({ children, className, delay = 0, slow = false }: FadeInProps) {
  return (
    <div
      className={cn(
        slow ? "animate-fade-in-slow" : "animate-fade-in",
        "motion-reduce:animate-none",
        className,
      )}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
