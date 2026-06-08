import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getStyleCategoryLabel, parseStyleCategories } from "@/lib/styleCategories";

interface StyleCategoriesBadgeProps {
  category: string;
  className?: string;
  badgeClassName?: string;
}

export function StyleCategoriesBadge({
  category,
  className,
  badgeClassName,
}: StyleCategoriesBadgeProps) {
  const categories = parseStyleCategories(category);
  if (!categories.length) return null;

  const rest = categories.slice(1);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Badge
        className={cn(
          "border-0 bg-background/90 text-[10px] uppercase tracking-wider text-foreground",
          badgeClassName
        )}
      >
        {getStyleCategoryLabel(categories[0])}
      </Badge>
      {rest.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-background"
            >
              +{rest.length}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2"
            align="start"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap gap-1">
              {rest.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider"
                >
                  {getStyleCategoryLabel(item)}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
