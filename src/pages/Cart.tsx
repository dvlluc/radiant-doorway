import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, Clock, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  cleanupExpiredCartItems,
  isCartItemBooked,
  parseBookingCartData,
} from "@/lib/booking/cart";
import { useInvalidateBookingCart } from "@/hooks/useBookingCart";
import { resolveAccountType } from "@/lib/booking/createAppointment";
import { getCurrencyFromLocation } from "@/utils/currency";
import { formatCartItemPrice } from "@/lib/servicePrice";

interface CartRow {
  id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  expires_at: string | null;
  item_data: unknown;
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const invalidateBookingCart = useInvalidateBookingCart();
  const [items, setItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    if (!user) return;
    await cleanupExpiredCartItems();

    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_name, product_image, price, expires_at, item_data, item_type")
      .eq("user_id", user.id)
      .eq("item_type", "booking")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not load cart.", variant: "destructive" });
      return;
    }

    const bookingItems = (data || []).filter((row) => {
      const meta = parseBookingCartData(row.item_data);
      return meta && !isCartItemBooked(meta);
    }) as CartRow[];

    setItems(bookingItems);
    await invalidateBookingCart(user.id);
  }, [user, toast, invalidateBookingCart]);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { returnTo: "/cart" } });
      return;
    }

    const init = async () => {
      const accountType = await resolveAccountType(user.id);
      if (accountType !== "individual") {
        toast({
          title: "Cart unavailable",
          description: "Only individual accounts can book business services.",
          variant: "destructive",
        });
        navigate("/account");
        return;
      }
      await loadCart();
      setLoading(false);
    };

    init();
  }, [user, navigate, loadCart, toast]);

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Could not remove item.", variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (user) await invalidateBookingCart(user.id);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading cart...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold font-['Playfair_Display']">Booking Cart</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Items are saved for 24 hours. Book each service at its own time.
      </p>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => navigate("/explore-styles")}>Explore styles</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const meta = parseBookingCartData(item.item_data)!;
            const currency = getCurrencyFromLocation("United States");
            const expiresLabel = item.expires_at
              ? formatDistanceToNow(new Date(item.expires_at), { addSuffix: true })
              : null;

            return (
              <Card key={item.id} className="p-4">
                <div className="flex gap-3">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {meta.businessName || "Business"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meta.duration} min
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCartItemPrice(item.price, meta.discountActive, currency.symbol)}
                      </span>
                    </div>
                    {expiresLabel && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Expires {expiresLabel}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  className="w-full mt-3 gap-2"
                  onClick={() => navigate(`/cart/book/${item.id}`)}
                >
                  <Calendar className="w-4 h-4" />
                  Choose date & time
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
