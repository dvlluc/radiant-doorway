import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_CATEGORIES } from "@/lib/businessCategories";

interface BusinessCategoryMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function BusinessCategoryMultiSelect({
  value,
  onChange,
  disabled = false,
  id,
  className,
}: BusinessCategoryMultiSelectProps) {
  const toggleCategory = (category: string) => {
    if (disabled) return;

    if (value.includes(category)) {
      onChange(value.filter((item) => item !== category));
      return;
    }

    onChange([...value, category]);
  };

  return (
    <div id={id} className={cn("flex flex-wrap gap-2", className)}>
      {BUSINESS_CATEGORIES.map((category) => {
        const isSelected = value.includes(category);

        return (
          <Button
            key={category}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => toggleCategory(category)}
            disabled={disabled}
            className={cn(
              "rounded-full h-8 text-xs",
              disabled && !isSelected && "opacity-60"
            )}
          >
            {category}
            {isSelected && <Check className="ml-1 w-3 h-3" />}
          </Button>
        );
      })}
    </div>
  );
}
