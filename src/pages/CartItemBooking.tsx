import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBookingCalendar } from "@/hooks/useBookingCalendar";
import { parseBookingCartData } from "@/lib/booking/cart";
import {
  assertCanBookBusinessService,
  BookingForbiddenError,
  createBookingAppointment,
  TimeSlotUnavailableError,
} from "@/lib/booking/createAppointment";
import { useInvalidateBookingCart } from "@/hooks/useBookingCart";
import { resolveAccountType } from "@/lib/booking/createAppointment";
import { getCurrencyFromLocation } from "@/utils/currency";

export default function CartItemBooking() {
  const { cartItemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const invalidateBookingCart = useInvalidateBookingCart();

  const [cartLoading, setCartLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [businessName, setBusinessName] = useState<string>();
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(0);
  const [price, setPrice] = useState(0);
  const [productImage, setProductImage] = useState<string | null>(null);

  const calendar = useBookingCalendar(businessId, duration, Boolean(businessId && duration > 0));

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { returnTo: `/cart/book/${cartItemId}` } });
      return;
    }

    const load = async () => {
      if (!cartItemId) return;

      const accountType = await resolveAccountType(user.id);
      if (accountType !== "individual") {
        toast({
          title: "Booking not available",
          description: "Only individual accounts can book business services.",
          variant: "destructive",
        });
        navigate("/account");
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("id", cartItemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: "Item not found", variant: "destructive" });
        navigate("/cart");
        return;
      }

      const meta = parseBookingCartData(data.item_data);
      if (!meta) {
        toast({ title: "Invalid cart item", variant: "destructive" });
        navigate("/cart");
        return;
      }

      setBusinessId(meta.businessId);
      setBusinessName(meta.businessName || "");
      setServiceName(meta.serviceName);
      setDuration(meta.duration);
      setPrice(Number(data.price));
      setProductImage(data.product_image);
      try {
        await assertCanBookBusinessService(user.id, meta.businessId);
      } catch (err) {
        if (err instanceof BookingForbiddenError) {
          toast({ title: "Booking not available", description: err.message, variant: "destructive" });
          navigate("/cart");
          return;
        }
      }

      setCartLoading(false);
    };

    load();
  }, [cartItemId, user, navigate, toast]);

  const currency = getCurrencyFromLocation("United States");

  const handleConfirm = async () => {
    const range = calendar.getSelectedRange();
    if (!businessId || !range || !user) return;

    setBooking(true);
    try {
      await createBookingAppointment({
        businessId,
        businessName,
        staffAuthId: calendar.selectedStaffAuthId,
        startTime: range.start.toISOString(),
        endTime: range.end.toISOString(),
        serviceName,
        cartItemId,
        specialRequests: specialRequests || null,
      });

      await invalidateBookingCart(user.id);

      toast({
        title: "Booked",
        description: `${serviceName} on ${format(range.start, "MMM d")} at ${calendar.selectedTime}`,
      });
      navigate("/account?tab=bookings");
    } catch (err) {
      console.error(err);
      if (err instanceof TimeSlotUnavailableError) {
        toast({
          title: "Time unavailable",
          description: err.message,
          variant: "destructive",
        });
        calendar.setSelectedTime("");
        return;
      }
      if (err instanceof BookingForbiddenError) {
        toast({ title: "Booking not available", description: err.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Please try another time.",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  if (cartLoading || calendar.loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Book: {serviceName}</h1>
      </div>

      <Card className="p-4 flex gap-3">
        {productImage && (
          <img src={productImage} alt="" className="w-14 h-14 rounded-lg object-cover" />
        )}
        <div>
          <p className="text-sm text-muted-foreground">{businessName}</p>
          <p className="font-semibold">
            {currency.symbol}
            {price} · {duration} min
          </p>
        </div>
      </Card>

      {calendar.professionals.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Professional
          </h3>
          {calendar.professionals.map((prof) => (
            <button
              key={prof.id}
              type="button"
              onClick={() => {
                calendar.setSelectedProfessional(prof.id);
                calendar.setSelectedDate(undefined);
                calendar.setSelectedTime("");
              }}
              className={`w-full p-3 rounded-lg border text-left ${
                calendar.selectedProfessional === prof.id ? "border-foreground" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{prof.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{prof.email.split("@")[0]}</p>
                  {prof.title && (
                    <p className="text-xs text-muted-foreground">{prof.title}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}

      {calendar.selectedProfessional && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Date</h3>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const base = calendar.selectedDate || new Date();
              const year = base.getFullYear();
              const month = base.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells = [];
              for (let day = 1; day <= daysInMonth; day++) {
                const d = new Date(year, month, day);
                const disabled = calendar.isDayDisabled(d);
                const selected =
                  calendar.selectedDate &&
                  format(d, "yyyy-MM-dd") === format(calendar.selectedDate, "yyyy-MM-dd");
                cells.push(
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      calendar.setSelectedDate(d);
                      calendar.setSelectedTime("");
                    }}
                    className={`h-10 rounded-md text-sm font-medium ${
                      selected
                        ? "bg-foreground text-background"
                        : disabled
                          ? "text-muted-foreground/40"
                          : "hover:bg-muted"
                    }`}
                  >
                    {day}
                  </button>
                );
              }
              return cells;
            })()}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {format(calendar.selectedDate || new Date(), "MMMM yyyy")}
          </p>

          {calendar.selectedDate && (
            <>
              <h3 className="font-semibold pt-2">Time</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {calendar.timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.status !== "available"}
                    onClick={() => calendar.setSelectedTime(slot.time)}
                    className={`py-2 px-1 rounded-lg text-xs font-medium border ${
                      calendar.selectedTime === slot.time
                        ? "bg-foreground text-background border-foreground"
                        : slot.status === "available"
                          ? "border-border hover:border-foreground"
                          : "border-border/40 text-muted-foreground/50 cursor-not-allowed"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {calendar.selectedTime && (
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-2">Special requests (optional)</h4>
          <Textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Notes for your appointment..."
            className="min-h-[80px]"
          />
        </Card>
      )}

      <Button
        className="w-full"
        disabled={!calendar.selectedTime || booking}
        onClick={handleConfirm}
      >
        {booking ? "Booking..." : "Confirm booking (no payment)"}
      </Button>
    </div>
  );
}
