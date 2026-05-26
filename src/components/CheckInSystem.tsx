import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QrCode, UserCheck, Loader2, CheckCircle2, XCircle, Calendar, Clock, User, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, isToday } from "date-fns";
import { Html5Qrcode } from "html5-qrcode";

interface Appointment {
  id: string;
  title: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: string;
  checked_in_at?: string;
  customer_name?: string;
}

interface CheckInResult {
  valid: boolean;
  message?: string;
  appointment?: any;
  canCheckIn?: boolean;
  alreadyCheckedIn?: boolean;
}

export function CheckInSystem() {
  const [qrCode, setQrCode] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string>("");
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current && isScanning) {
        stopScanner();
      }
    };
  }, [isScanning]);

  const fetchTodaysAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Fetch appointments where user is business owner or staff member
      const { data: businessAppointments, error: businessError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      const { data: staffAppointments, error: staffError } = await supabase
        .from("appointments")
        .select("*")
        .eq("staff_member_id", user.id)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      // Combine and deduplicate
      const allAppointments = [
        ...(businessAppointments || []),
        ...(staffAppointments || [])
      ];
      const uniqueAppointments = Array.from(
        new Map(allAppointments.map(apt => [apt.id, apt])).values()
      );

      // Fetch customer names
      const appointmentsWithNames = await Promise.all(
        uniqueAppointments.map(async (apt) => {
          let customerName = "N/A";
          if (apt.customer_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", apt.customer_id)
              .single();
            
            if (profile) {
              customerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
            }
          }
          return { ...apt, customer_name: customerName };
        })
      );

      setTodaysAppointments(appointmentsWithNames);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
    }
  };

  const handleQRCodeCheckIn = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCheckInResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-in-appointment", {
        body: { qrCode: qrCode.trim(), checkIn: true },
      });

      if (error) throw error;

      setCheckInResult(data);

      if (data.valid && data.message) {
        toast({
          title: "Success",
          description: data.message,
        });
        setQrCode("");
        fetchTodaysAppointments();
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid QR code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setScanError("");
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // QR code detected
          setQrCode(decodedText);
          await stopScanner();
          // Automatically check in with the scanned QR code
          handleQRCodeCheckInWithCode(decodedText);
        },
        (errorMessage) => {
          // Scanning error (can be ignored for most cases)
          console.log("QR scan error:", errorMessage);
        }
      );
    } catch (error: any) {
      console.error("Error starting scanner:", error);
      setScanError("Unable to access camera. Please check permissions.");
      setIsScanning(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please ensure you've granted camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };

  const handleQRCodeCheckInWithCode = async (code: string) => {
    setLoading(true);
    setCheckInResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-in-appointment", {
        body: { qrCode: code, checkIn: true },
      });

      if (error) throw error;

      setCheckInResult(data);

      if (data.valid && data.message) {
        toast({
          title: "Success",
          description: data.message,
        });
        setQrCode("");
        fetchTodaysAppointments();
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid QR code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!selectedAppointment) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCheckInResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-in-appointment", {
        body: { appointmentId: selectedAppointment, checkIn: true },
      });

      if (error) throw error;

      setCheckInResult(data);

      if (data.valid && data.message) {
        toast({
          title: "Success",
          description: data.message,
        });
        setSelectedAppointment("");
        fetchTodaysAppointments();
      } else {
        toast({
          title: "Error",
          description: data.message || "Unable to check in",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Client Check-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="manual">
              <User className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-4">
            {!isScanning ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">QR Code</label>
                  <Input
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Enter QR code manually"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleQRCodeCheckIn();
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={startScanner}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button
                    onClick={handleQRCodeCheckIn}
                    disabled={loading || !qrCode.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Check In
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div 
                    id="qr-reader" 
                    ref={qrReaderRef}
                    className="rounded-lg overflow-hidden"
                  />
                  {scanError && (
                    <div className="mt-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                      {scanError}
                    </div>
                  )}
                </div>
                <Button
                  onClick={stopScanner}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Scan
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Appointment</label>
              <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an appointment" />
                </SelectTrigger>
                <SelectContent>
                  {todaysAppointments.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No appointments scheduled for today
                    </div>
                  ) : (
                    todaysAppointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">{apt.customer_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(apt.start_time), "h:mm a")}
                          </span>
                          {apt.checked_in_at && (
                            <Badge variant="secondary" className="ml-2">
                              Checked In
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleManualCheckIn}
              disabled={loading || !selectedAppointment}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Check In Client
                </>
              )}
            </Button>

            {todaysAppointments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Today's Schedule</h4>
                <div className="space-y-2">
                  {todaysAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{format(new Date(apt.start_time), "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{apt.customer_name}</span>
                        {apt.checked_in_at && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {checkInResult && checkInResult.valid && checkInResult.appointment && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {checkInResult.message || "Client checked in successfully"}
                </p>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{checkInResult.appointment.profiles?.first_name} {checkInResult.appointment.profiles?.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(checkInResult.appointment.start_time), "PPp")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {checkInResult && !checkInResult.valid && (
          <div className="mt-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-900 dark:text-red-100">
                {checkInResult.message || "Invalid appointment"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
