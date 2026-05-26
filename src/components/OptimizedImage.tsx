import { memo, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
  rounded?: "none" | "lg" | "xl" | "full";
  onLoad?: () => void;
}

const roundedClass = {
  none: "",
  lg: "rounded-lg",
  xl: "rounded-2xl",
  full: "rounded-full",
} as const;

const fitClass = {
  cover: "object-cover",
  contain: "object-contain",
} as const;

/** Глобальный кэш уже загруженных URL — без повторных probe Image() */
const loadedSrcCache = new Set<string>();

export const OptimizedImage = memo(({
  src,
  alt,
  className,
  imgClassName,
  aspectRatio = "auto",
  fit = "cover",
  loading = "lazy",
  rounded = "none",
  onLoad,
}: OptimizedImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(() => loadedSrcCache.has(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (loadedSrcCache.has(src)) {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    const node = imgRef.current;
    if (node?.complete && node.naturalWidth > 0) {
      loadedSrcCache.add(src);
      setIsLoaded(true);
      onLoad?.();
    }
  }, [src, onLoad]);

  const handleLoad = () => {
    loadedSrcCache.add(src);
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoaded(true);
    setHasError(true);
  };

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  }[aspectRatio];

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm",
          aspectRatioClass,
          roundedClass[rounded],
          className,
        )}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatioClass,
        roundedClass[rounded],
        className,
      )}
    >
      {!isLoaded && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" aria-hidden />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={loading === "eager" ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "h-full w-full transition-opacity duration-500 ease-out",
          fitClass[fit],
          roundedClass[rounded],
          isLoaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
