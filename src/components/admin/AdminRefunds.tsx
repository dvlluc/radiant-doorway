import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import { formatDate } from "@/utils/dateFormat";
import { toast } from "sonner";

interface RefundRequest {
  id: string;
  ticket_purchase_id: string;
  requester_id: string;
  event_id: string;
  amount: number;
  reason: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  events: {
    title: string;
  } | null;
}

export const AdminRefunds = () => {
  const [loading, setLoading] = useState(true);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRefundRequests();
  }, []);

  const loadRefundRequests = async () => {
    try {
      setLoading(true);
      
      const { data: requests, error } = await supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          // Fetch requester profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', request.requester_id)
            .single();

          // Fetch event
          const { data: event } = await supabase
            .from('events')
            .select('title')
            .eq('id', request.event_id)
            .single();

          return {
            ...request,
            profiles: profile,
            events: event
          };
        })
      );

      setRefundRequests(enrichedRequests);
    } catch (error) {
      console.error('Error loading refund requests:', error);
      toast.error("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (requestId: string, ticketPurchaseId: string, approve: boolean) => {
    try {
      setProcessing(true);
      
      if (approve) {
        // Process the refund through Stripe
        const { error: refundError } = await supabase.functions.invoke('process-ticket-refund', {
          body: { ticketPurchaseId }
        });

        if (refundError) throw refundError;
      }

      // Update refund request status
      const { error: updateError } = await supabase
        .from('refund_requests')
        .update({
          status: approve ? 'processed' : 'rejected',
          admin_notes: adminNotes,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast.success(approve ? "Refund processed successfully" : "Refund request rejected");
      setSelectedRequest(null);
      setAdminNotes("");
      loadRefundRequests();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error("Failed to process refund request");
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      processed: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>
            Review and process refund requests from event organizers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {refundRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No refund requests yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                    <TableCell>{request.events?.title || 'Unknown Event'}</TableCell>
                    <TableCell>
                      {request.profiles 
                        ? `${request.profiles.first_name} ${request.profiles.last_name}`
                        : 'Unknown User'}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {request.profiles?.email}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(request.amount)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          {selectedRequest === request.id ? (
                            <div className="space-y-2 min-w-[200px]">
                              <Textarea
                                placeholder="Admin notes (optional)"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRefund(request.id, request.ticket_purchase_id, true)}
                                  disabled={processing}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleProcessRefund(request.id, request.ticket_purchase_id, false)}
                                  disabled={processing}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedRequest(null);
                                    setAdminNotes("");
                                  }}
                                  disabled={processing}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request.id)}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      )}
                      {request.status !== 'pending' && request.admin_notes && (
                        <p className="text-sm text-muted-foreground max-w-xs">
                          {request.admin_notes}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};