import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { ZoomIn } from "lucide-react";

interface ServiceCardPhotoProps {
  photos: string[];
  alt: string;
  onPreview: () => void;
  className?: string;
}

export function ServiceCardPhoto({ photos, alt, onPreview, className }: ServiceCardPhotoProps) {
  if (!photos.length) return null;

  return (
    <button
      type="button"
      onClick={onPreview}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={`Preview photos for ${alt}`}
    >
      <img
        src={photos[0]}
        alt={alt}
        className="h-20 w-20 object-cover transition-transform group-hover:scale-105 sm:h-24 sm:w-24"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
        <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {photos.length > 1 && (
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          +{photos.length - 1}
        </span>
      )}
    </button>
  );
}

interface ServicePhotosPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  title?: string;
  initialIndex?: number;
}

export function ServicePhotosPreviewDialog({
  open,
  onOpenChange,
  photos,
  title = "Service Photos",
  initialIndex = 0,
}: ServicePhotosPreviewDialogProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!open || !carouselApi) return;
    carouselApi.scrollTo(initialIndex, true);
  }, [open, carouselApi, initialIndex]);

  if (!photos.length) return null;

  const arrowButtonClassName =
    "left-auto right-auto top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-0 bg-neutral-500/50 text-white shadow-sm backdrop-blur-sm hover:bg-neutral-500/70 disabled:opacity-30";

  const photoFrame = (photo: string, alt: string) => (
    <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
      <img
        src={photo}
        alt={alt}
        className="h-full w-full object-contain"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),28rem)] max-w-none gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="truncate text-base sm:text-lg">{title}</DialogTitle>
        </DialogHeader>

        {photos.length === 1 ? (
          photoFrame(photos[0], title)
        ) : (
          <div className="relative">
            <Carousel setApi={setCarouselApi} opts={{ startIndex: initialIndex }} className="w-full">
              <CarouselContent className="ml-0">
                {photos.map((photo, index) => (
                  <CarouselItem key={`${photo}-${index}`} className="basis-full pl-0">
                    {photoFrame(photo, `${title} ${index + 1}`)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className={cn(arrowButtonClassName, "left-3")} />
              <CarouselNext className={cn(arrowButtonClassName, "right-3")} />
            </Carousel>
            <p className="border-t py-2 text-center text-xs text-muted-foreground">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
