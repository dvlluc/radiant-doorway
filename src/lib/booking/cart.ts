import { supabase } from "@/integrations/supabase/client";
import type { BookingCartItemData } from "./types";

export const CART_TTL_HOURS = 24;

export class CartDuplicateError extends Error {
  readonly productName: string;

  constructor(productName: string) {
    super("ALREADY_IN_CART");
    this.name = "CartDuplicateError";
    this.productName = productName;
  }
}

export function isCartDuplicateError(error: unknown): error is CartDuplicateError {
  return error instanceof CartDuplicateError;
}

export function getCartExpiresAt(): string {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CART_TTL_HOURS);
  return expiresAt.toISOString();
}

export async function cleanupExpiredCartItems(): Promise<void> {
  await supabase.rpc("cleanup_expired_cart_items");
}

export async function isProductInBookingCart(
  userId: string,
  productId: string
): Promise<boolean> {
  await cleanupExpiredCartItems();

  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, item_data")
    .eq("user_id", userId)
    .eq("item_type", "booking")
    .eq("product_id", productId);

  if (error) throw error;
  if (!data?.length) return false;

  return data.some((row) => {
    const meta = parseBookingCartData(row.item_data);
    return meta && !isCartItemBooked(meta);
  });
}

export async function addServiceToCart(
  userId: string,
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description?: string | null;
    image_url?: string | null;
  },
  business: { id: string; name?: string },
  extra?: Partial<BookingCartItemData>
) {
  if (await isProductInBookingCart(userId, service.id)) {
    throw new CartDuplicateError(service.name);
  }

  const itemData: BookingCartItemData = {
    businessId: business.id,
    businessName: business.name,
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    description: service.description,
    itemKind: "service",
    ...extra,
  };

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: service.id,
    product_name: service.name,
    product_image: service.image_url || extra?.stylePhoto || null,
    price: service.price,
    quantity: 1,
    expires_at: getCartExpiresAt(),
    item_type: "booking",
    item_data: itemData,
  });

  if (error) throw error;
}

export function parseBookingCartData(raw: unknown): BookingCartItemData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as BookingCartItemData;
  if (!data.businessId || !data.serviceId || !data.serviceName || !data.duration) {
    return null;
  }
  return data;
}

export function isCartItemBooked(data: BookingCartItemData | null): boolean {
  return Boolean(data?.appointmentId || data?.bookedAt);
}
