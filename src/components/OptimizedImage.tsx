import { memo, useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
  loading?: "lazy" | "eager";
  onLoad?: () => void;
}

/**
 * Performance-optimized image component with:
 * - Lazy loading
 * - Loading states
 * - Proper aspect ratios
 * - Error handling
 */
export const OptimizedImage = memo(({
  src,
  alt,
  className,
  aspectRatio = "auto",
  loading = "lazy",
  onLoad
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: ""
  }[aspectRatio];

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted",
        aspectRatioClass,
        className
      )}>
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", aspectRatioClass, className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse w-full h-full bg-muted-foreground/10" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
