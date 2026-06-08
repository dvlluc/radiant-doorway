export function roundDiscountedPrice(price: number): number {
  return Math.round(Number(price) * 100) / 100;
}

export function ceilDiscountedPrice(price: number): number {
  return Math.ceil(Number(price) * 100) / 100;
}

export function getCartItemPrice(price: number, discountActive?: boolean): number {
  const value = Number(price);
  if (!discountActive) return value;
  return ceilDiscountedPrice(value);
}

export function formatDiscountedServicePrice(price: number, symbol = ""): string {
  return `${symbol}${roundDiscountedPrice(price).toFixed(2)}`;
}

export function formatCartItemPrice(price: number, discountActive?: boolean, symbol = ""): string {
  return `${symbol}${getCartItemPrice(price, discountActive).toFixed(2)}`;
}
