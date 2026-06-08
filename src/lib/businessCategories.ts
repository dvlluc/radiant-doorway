export const BUSINESS_CATEGORIES = [
  "Salons",
  "Nails",
  "Skin",
  "Makeup",
  "Barbers",
  "Spa",
  "Hair Braiding",
  "Lashes",
  "Brows",
  "Aesthetics",
  "Massage",
  "Waxing",
] as const;

export function parseBusinessCategories(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatBusinessCategories(categories: string[]): string | null {
  if (categories.length === 0) return null;
  return categories.join(", ");
}
