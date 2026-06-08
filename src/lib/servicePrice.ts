export function roundDiscountedPrice(price: number): number {
  return Math.round(Number(price) * 100) / 100;
}

export function formatDiscountedServicePrice(price: number, symbol = ""): string {
  return `${symbol}${roundDiscountedPrice(price).toFixed(2)}`;
}
