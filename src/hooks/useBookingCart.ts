import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cleanupExpiredCartItems,
  isCartItemBooked,
  parseBookingCartData,
} from "@/lib/booking/cart";
import { supabase } from "@/integrations/supabase/client";

export const bookingCartQueryKey = (userId?: string) => ["booking-cart", userId] as const;

export interface BookingCartSnapshot {
  count: number;
  productIds: string[];
}

async function fetchBookingCartSnapshot(userId: string): Promise<BookingCartSnapshot> {
  await cleanupExpiredCartItems();

  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, item_data, item_type")
    .eq("user_id", userId)
    .eq("item_type", "booking");

  if (error) throw error;

  const productIds: string[] = [];

  for (const row of data || []) {
    const meta = parseBookingCartData(row.item_data);
    if (!meta || isCartItemBooked(meta)) continue;
    productIds.push(row.product_id);
  }

  return { count: productIds.length, productIds };
}

export function useBookingCart(userId?: string) {
  return useQuery({
    queryKey: bookingCartQueryKey(userId),
    queryFn: () => fetchBookingCartSnapshot(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useInvalidateBookingCart() {
  const queryClient = useQueryClient();
  return (userId?: string) =>
    queryClient.invalidateQueries({ queryKey: bookingCartQueryKey(userId) });
}
