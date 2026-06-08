import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STYLE_CATEGORY_OPTIONS } from "@/lib/styleCategories";

interface StyleCategoryMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function StyleCategoryMultiSelect({
  value,
  onChange,
  disabled = false,
  id,
  className,
}: StyleCategoryMultiSelectProps) {
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
      {STYLE_CATEGORY_OPTIONS.map((option) => {
        const isSelected = value.includes(option.value);

        return (
          <Button
            key={option.value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => toggleCategory(option.value)}
            disabled={disabled}
            className={cn(
              "rounded-full h-8 text-xs",
              disabled && !isSelected && "opacity-60"
            )}
          >
            {option.label}
            {isSelected && <Check className="ml-1 w-3 h-3" />}
          </Button>
        );
      })}
    </div>
  );
}
