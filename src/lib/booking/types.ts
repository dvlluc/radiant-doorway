export type BookingCartItemKind = "service" | "style";

export interface BookingCartItemData {
  businessId: string;
  businessName?: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  description?: string | null;
  styleId?: string;
  styleName?: string;
  stylePhoto?: string | null;
  itemKind?: BookingCartItemKind;
  discountActive?: boolean;
  appointmentId?: string;
  bookedAt?: string;
}

export interface BookingServiceLine {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

export interface BusySlot {
  start_time: string;
  end_time: string;
}
