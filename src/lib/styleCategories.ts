export const STYLE_CATEGORY_OPTIONS = [
  { value: "hair", label: "Hairstyles" },
  { value: "braids", label: "Braids" },
  { value: "barber", label: "Barber" },
  { value: "nails", label: "Nails" },
  { value: "makeup", label: "Makeup" },
  { value: "lashes", label: "Lashes" },
] as const;

export type StyleCategoryValue = (typeof STYLE_CATEGORY_OPTIONS)[number]["value"];

export function parseStyleCategories(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatStyleCategories(categories: string[]): string {
  if (categories.length === 0) return STYLE_CATEGORY_OPTIONS[0].value;
  return categories.join(",");
}

export function getStyleCategoryLabel(value: string): string {
  return STYLE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function styleMatchesCategory(category: string, filterValue: string): boolean {
  if (filterValue === "all") return true;
  return parseStyleCategories(category).includes(filterValue);
}
