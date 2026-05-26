import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, Loader2, Clock, CheckCircle2, XCircle, AlertCircle, Settings } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatDateTime } from "@/utils/dateFormat";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  description: string;
}

interface Subscription {
  id: string;
  status: string;
  productName: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  created: string;
  cancelAtPeriodEnd: boolean;
}

const formatAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export function PurchasesSubscriptions() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [paymentsResult, subscriptionsResult] = await Promise.all([
        supabase.functions.invoke("list-payments"),
        supabase.functions.invoke("list-subscriptions"),
      ]);

      if (paymentsResult.error) {
        console.error("Error fetching payments:", paymentsResult.error);
      } else {
        setPayments(paymentsResult.data?.payments || []);
      }

      if (subscriptionsResult.error) {
        console.error("Error fetching subscriptions:", subscriptionsResult.error);
      } else {
        setSubscriptions(subscriptionsResult.data?.subscriptions || []);
      }
    } catch (error) {
      console.error("Error fetching purchase data:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    setCancellingId(subscriptionToCancel.id);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId: subscriptionToCancel.id },
      });

      if (error) throw error;

      // Refresh data to get the updated subscription info
      await fetchData();
      
      // Get the updated end date from the refreshed data
      const updatedSub = subscriptions.find(s => s.id === subscriptionToCancel.id);
      const endDate = updatedSub?.currentPeriodEnd 
        ? formatDate(updatedSub.currentPeriodEnd)
        : formatDate(subscriptionToCancel.currentPeriodEnd);

      toast({
        title: "Subscription Cancelled",
        description: `Your subscription will remain active until ${endDate}. You won't be charged again after this date.`,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setSubscriptionToCancel(null);
    }
  };

  const handleManagePaymentMethods = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) {
        console.error("Customer portal error:", error);
        throw error;
      }

      if (data?.url) {
        // Open in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      
      let errorMessage = "Failed to open payment management. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("No Stripe customer")) {
          errorMessage = "Please make a purchase first to manage payment methods.";
        } else if (error.message.includes("No configuration") || error.message.includes("not been created")) {
          errorMessage = "Payment management needs to be configured in Stripe. Please contact support.";
        } else if (error.message.includes("Failed to fetch") || error.message.includes("FunctionsRelayError")) {
          errorMessage = "Payment management is being set up. Please try again in a moment.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
      case "active":
        return <CheckCircle2 className="w-4 h-4" />;
      case "canceled":
      case "incomplete":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "succeeded":
      case "active":
        return "default";
      case "canceled":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const inactiveSubscriptions = subscriptions.filter((s) => s.status !== "active");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Manage your subscriptions and payment methods</p>
        <Button
          onClick={handleManagePaymentMethods}
          disabled={loadingPortal}
          variant="outline"
          className="gap-2"
        >
          {loadingPortal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Manage Payment Methods
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Active Subscriptions
              </h2>
              <div className="grid gap-4">
                 {activeSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="border border-primary/10 bg-primary/[0.02]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">{subscription.productName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(subscription.status)} className="gap-1">
                              {getStatusIcon(subscription.status)}
                              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                            </Badge>
                            {subscription.cancelAtPeriodEnd && (
                              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                                <Clock className="w-3 h-3" />
                                Ends {formatDate(subscription.currentPeriodEnd)}
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatAmount(subscription.amount, subscription.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">per {subscription.interval}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Current Period</p>
                            <p className="font-medium">
                              {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Started</p>
                            <p className="font-medium">{formatDate(subscription.created)}</p>
                          </div>
                        </div>
                        {!subscription.cancelAtPeriodEnd && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setSubscriptionToCancel(subscription)}
                            disabled={cancellingId === subscription.id}
                          >
                            {cancellingId === subscription.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              "Cancel Subscription"
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Subscriptions */}
          {inactiveSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Past Subscriptions</h2>
              <div className="grid gap-3">
                {inactiveSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{subscription.productName}</p>
                            <Badge variant={getStatusVariant(subscription.status)} className="gap-1">
                              {getStatusIcon(subscription.status)}
                              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatAmount(subscription.amount, subscription.currency)} / {subscription.interval}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(subscription.created)} - {formatDate(subscription.currentPeriodEnd)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeSubscriptions.length === 0 && inactiveSubscriptions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  When you subscribe to services, they will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment History
            </h2>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CreditCard className="w-16 h-16 text-muted-foreground/40 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No payments yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Your payment transactions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-muted">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{payment.description}</p>
                              <Badge variant={getStatusVariant(payment.status)} className="gap-1">
                                {getStatusIcon(payment.status)}
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(payment.created)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {formatAmount(payment.amount, payment.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!subscriptionToCancel} onOpenChange={(open) => !open && setSubscriptionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to cancel your <strong>{subscriptionToCancel?.productName}</strong> subscription?</p>
              <p className="text-sm">
                Your subscription will remain active until <strong>{subscriptionToCancel && formatDate(subscriptionToCancel.currentPeriodEnd)}</strong>. 
                You won't be charged again after this date.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
