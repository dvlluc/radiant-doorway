import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MoreVertical, Trash2, Search, RefreshCw, Download } from "lucide-react";
import { formatDate } from "@/utils/dateFormat";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BusinessAnalytics } from "./BusinessAnalytics";

interface EventSale {
  id: string;
  event_id: string;
  event_name: string;
  ticket_type: string;
  quantity: number;
  total_amount: number;
  buyer_name: string;
  buyer_id: string | null;
  purchase_date: string;
  status: string;
}

interface BookingSale {
  id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  appointment_date: string;
  amount: number;
  status: string;
  payment_date: string;
}

export const BusinessSales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eventSales, setEventSales] = useState<EventSale[]>([]);
  const [bookingSales, setBookingSales] = useState<BookingSale[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedTicketType, setSelectedTicketType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatBuyerName = (fullName: string) => {
    if (!fullName) return 'N/A';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  };

  const handleRemoveBuyer = async (saleId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to remove this buyer from "${eventName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ticket_purchases')
        .update({ status: 'removed' })
        .eq('id', saleId);

      if (error) throw error;

      toast.success("Buyer removed successfully");
      loadSalesData();
    } catch (error) {
      console.error('Error removing buyer:', error);
      toast.error("Failed to remove buyer");
    }
  };

  const handleRequestRefund = async (saleId: string, eventName: string, eventId: string, amount: number) => {
    if (!confirm(`Are you sure you want to request a refund for $${amount.toFixed(2)} for "${eventName}"?`)) {
      return;
    }

    try {
      toast.info("Submitting refund request...");
      
      const { error } = await supabase
        .from('refund_requests')
        .insert({
          ticket_purchase_id: saleId,
          requester_id: user?.id,
          event_id: eventId,
          amount: amount,
          reason: 'Refund requested by event organizer',
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Refund request submitted successfully. Admin will review it shortly.");
      loadSalesData();
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast.error("Failed to submit refund request. Please try again.");
    }
  };

  const calculateFees = (amount: number) => {
    // Stripe fees: 2.9% + $0.30 per transaction
    const stripeFee = (amount * 0.029) + 0.30;
    // Platform commission: 4% of ticket sale
    const platformCommission = amount * 0.04;
    // Net payment to organizer
    const netPayment = amount - stripeFee - platformCommission;
    
    return {
      stripeFee,
      platformCommission,
      netPayment
    };
  };

  const downloadPeriodicReport = () => {
    if (filteredEventSales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    // Group sales by event
    const salesByEvent = filteredEventSales.reduce((acc, sale) => {
      if (!acc[sale.event_name]) {
        acc[sale.event_name] = [];
      }
      acc[sale.event_name].push(sale);
      return acc;
    }, {} as Record<string, EventSale[]>);

    // Generate CSV content
    let csvContent = "Periodic Event Sales Report\n";
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    Object.entries(salesByEvent).forEach(([eventName, sales]) => {
      csvContent += `\nEvent: ${eventName}\n`;
      csvContent += "Buyer,Ticket Type,Quantity,Ticket Amount,Stripe Fee,Platform Commission (4%),Net Payment,Status,Date\n";
      
      let eventTotal = 0;
      let eventStripeFees = 0;
      let eventCommission = 0;
      let eventNetPayment = 0;

      sales.forEach(sale => {
        if (sale.status !== 'removed' && sale.status !== 'cancelled' && sale.status !== 'refunded') {
          const { stripeFee, platformCommission, netPayment } = calculateFees(sale.total_amount);
          
          csvContent += `"${formatBuyerName(sale.buyer_name)}",`;
          csvContent += `"${sale.ticket_type}",`;
          csvContent += `${sale.quantity},`;
          csvContent += `$${sale.total_amount.toFixed(2)},`;
          csvContent += `$${stripeFee.toFixed(2)},`;
          csvContent += `$${platformCommission.toFixed(2)},`;
          csvContent += `$${netPayment.toFixed(2)},`;
          csvContent += `${sale.status},`;
          csvContent += `${formatDate(sale.purchase_date)}\n`;

          eventTotal += sale.total_amount;
          eventStripeFees += stripeFee;
          eventCommission += platformCommission;
          eventNetPayment += netPayment;
        }
      });

      csvContent += `\nEvent Totals:,,,`;
      csvContent += `$${eventTotal.toFixed(2)},`;
      csvContent += `$${eventStripeFees.toFixed(2)},`;
      csvContent += `$${eventCommission.toFixed(2)},`;
      csvContent += `$${eventNetPayment.toFixed(2)}\n`;
      csvContent += "---\n";
    });

    // Calculate overall totals
    const overallTotal = filteredEventSales
      .filter(s => s.status !== 'removed' && s.status !== 'cancelled' && s.status !== 'refunded')
      .reduce((sum, sale) => sum + sale.total_amount, 0);
    const overallFees = filteredEventSales
      .filter(s => s.status !== 'removed' && s.status !== 'cancelled' && s.status !== 'refunded')
      .reduce((sum, sale) => sum + calculateFees(sale.total_amount).stripeFee, 0);
    const overallCommission = filteredEventSales
      .filter(s => s.status !== 'removed' && s.status !== 'cancelled' && s.status !== 'refunded')
      .reduce((sum, sale) => sum + calculateFees(sale.total_amount).platformCommission, 0);
    const overallNet = overallTotal - overallFees - overallCommission;

    csvContent += `\nGrand Totals:,,,`;
    csvContent += `$${overallTotal.toFixed(2)},`;
    csvContent += `$${overallFees.toFixed(2)},`;
    csvContent += `$${overallCommission.toFixed(2)},`;
    csvContent += `$${overallNet.toFixed(2)}\n`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `periodic-sales-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Periodic sales report downloaded");
  };

  const downloadEventReport = () => {
    if (selectedEvent === "all") {
      toast.error("Please select a specific event to download its report");
      return;
    }

    const eventSalesData = filteredEventSales.filter(sale => sale.event_name === selectedEvent);
    
    if (eventSalesData.length === 0) {
      toast.error("No sales data for the selected event");
      return;
    }

    // Generate CSV content for specific event
    let csvContent = `Event Sales Report: ${selectedEvent}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    csvContent += "Buyer,Ticket Type,Quantity,Ticket Amount,Stripe Fee,Platform Commission (4%),Net Payment,Status,Date\n";
    
    let eventTotal = 0;
    let eventStripeFees = 0;
    let eventCommission = 0;
    let eventNetPayment = 0;

    eventSalesData.forEach(sale => {
      if (sale.status !== 'removed' && sale.status !== 'cancelled' && sale.status !== 'refunded') {
        const { stripeFee, platformCommission, netPayment } = calculateFees(sale.total_amount);
        
        csvContent += `"${formatBuyerName(sale.buyer_name)}",`;
        csvContent += `"${sale.ticket_type}",`;
        csvContent += `${sale.quantity},`;
        csvContent += `$${sale.total_amount.toFixed(2)},`;
        csvContent += `$${stripeFee.toFixed(2)},`;
        csvContent += `$${platformCommission.toFixed(2)},`;
        csvContent += `$${netPayment.toFixed(2)},`;
        csvContent += `${sale.status},`;
        csvContent += `${formatDate(sale.purchase_date)}\n`;

        eventTotal += sale.total_amount;
        eventStripeFees += stripeFee;
        eventCommission += platformCommission;
        eventNetPayment += netPayment;
      }
    });

    csvContent += `\nEvent Totals:,,,`;
    csvContent += `$${eventTotal.toFixed(2)},`;
    csvContent += `$${eventStripeFees.toFixed(2)},`;
    csvContent += `$${eventCommission.toFixed(2)},`;
    csvContent += `$${eventNetPayment.toFixed(2)}\n`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const sanitizedEventName = selectedEvent.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.setAttribute('download', `${sanitizedEventName}-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Sales report for "${selectedEvent}" downloaded`);
  };

  // Get unique values for filters
  const uniqueEvents = useMemo(() => {
    const events = [...new Set(eventSales.map(sale => sale.event_name))];
    return events.sort();
  }, [eventSales]);

  const uniqueTicketTypes = useMemo(() => {
    const types = [...new Set(eventSales.map(sale => sale.ticket_type))];
    return types.sort();
  }, [eventSales]);

  // Filter sales based on search and filters
  const filteredEventSales = useMemo(() => {
    return eventSales.filter(sale => {
      const matchesSearch = searchQuery === "" || 
        sale.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.buyer_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEvent = selectedEvent === "all" || sale.event_name === selectedEvent;
      const matchesTicketType = selectedTicketType === "all" || sale.ticket_type === selectedTicketType;
      const matchesStatus = selectedStatus === "all" || sale.status === selectedStatus;

      return matchesSearch && matchesEvent && matchesTicketType && matchesStatus;
    });
  }, [eventSales, searchQuery, selectedEvent, selectedTicketType, selectedStatus]);

  useEffect(() => {
    if (user) {
      loadSalesData();
    }
  }, [user]);

  const loadSalesData = async () => {
    try {
      setLoading(true);

      // First, get all events owned by this user
      const { data: userEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user?.id);

      if (eventsError) {
        console.error('Error loading events:', eventsError);
        setLoading(false);
        return;
      }

      const eventIds = userEvents?.map(e => e.id) || [];

      if (eventIds.length === 0) {
        setEventSales([]);
        setBookingSales([]);
        setLoading(false);
        return;
      }

      // Load event ticket sales for user's events
      const { data: ticketData, error: ticketError } = await supabase
        .from('ticket_purchases')
        .select(`
          id,
          event_id,
          quantity,
          total_amount,
          purchase_date,
          purchaser_email,
          purchaser_name,
          purchaser_id,
          events (
            title
          ),
          event_tickets (
            ticket_name
          )
        `)
        .in('event_id', eventIds)
        .order('purchase_date', { ascending: false });

      if (ticketError) {
        console.error('Error loading ticket sales:', ticketError);
      } else {
        console.log('Ticket sales loaded:', ticketData);
      }

      const formattedEventSales: EventSale[] = (ticketData || []).map((sale: any) => ({
        id: sale.id,
        event_id: sale.event_id,
        event_name: sale.events?.title || 'Unknown Event',
        ticket_type: sale.event_tickets?.ticket_name || 'General Admission',
        quantity: sale.quantity,
        total_amount: sale.total_amount,
        buyer_name: sale.purchaser_name || 'N/A',
        buyer_id: sale.purchaser_id,
        purchase_date: sale.purchase_date,
        status: sale.status || 'completed'
      }));

      setEventSales(formattedEventSales);

      // Load appointment/booking sales - using appointments table
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          title,
          service_type,
          status,
          created_at,
          profiles:customer_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', user?.id)
        .in('status', ['completed', 'confirmed'])
        .order('created_at', { ascending: false });

      if (appointmentError) {
        console.error('Error loading booking sales:', appointmentError);
      }

      // Note: Appointments don't have price in the schema, showing placeholder
      const formattedBookingSales: BookingSale[] = (appointmentData || []).map((booking: any) => ({
        id: booking.id,
        service_name: booking.service_type || booking.title || 'Service',
        customer_name: booking.profiles 
          ? `${booking.profiles.first_name || ''} ${booking.profiles.last_name || ''}`.trim() 
          : 'N/A',
        customer_email: booking.profiles?.email || 'N/A',
        appointment_date: booking.start_time,
        amount: 0, // Appointments table doesn't have amount field
        status: booking.status,
        payment_date: booking.created_at
      }));

      setBookingSales(formattedBookingSales);

    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      confirmed: "default",
      paid: "default",
      pending: "secondary",
      cancelled: "destructive",
      removed: "destructive",
      refunded: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const calculateTotal = (sales: { amount?: number; total_amount?: number; status?: string }[]) => {
    return sales
      .filter(sale => sale.status !== 'removed' && sale.status !== 'cancelled' && sale.status !== 'refunded')
      .reduce((sum, sale) => sum + (sale.amount || sale.total_amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="bookings" className="text-xs sm:text-sm">Bookings</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Booking Sales</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Total Revenue: {formatPrice(calculateTotal(bookingSales))}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-2 sm:pt-3">
              {bookingSales.length === 0 ? (
                <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">No booking sales yet</p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {bookingSales.map((sale) => (
                      <div key={sale.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{sale.service_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{sale.customer_name}</p>
                          </div>
                          {getStatusBadge(sale.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{sale.customer_email}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{formatDate(sale.appointment_date)}</span>
                          <span className="font-medium text-sm">{formatPrice(sale.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Appointment</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookingSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.service_name}</TableCell>
                            <TableCell>{sale.customer_name}</TableCell>
                            <TableCell>{sale.customer_email}</TableCell>
                            <TableCell>{formatDate(sale.appointment_date)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(sale.amount)}
                            </TableCell>
                            <TableCell>{formatDate(sale.payment_date)}</TableCell>
                            <TableCell>{getStatusBadge(sale.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <BusinessAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
