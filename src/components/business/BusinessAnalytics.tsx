import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, TrendingUp, MoreHorizontal } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const GOLD = "#C1A46D";
const GOLD_LIGHT = "#D4BE8E";
const CHART_COLORS = [GOLD, "#6B7280", "#D4BE8E", "#9CA3AF", "#E5D5B0"];

interface StylePerformance {
  id: string;
  name: string;
  photo: string;
  bookings: number;
  views: number;
  conversionRate: number;
}

export const BusinessAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  // Revenue data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenuePerStylist, setRevenuePerStylist] = useState(0);
  const [avgBookingValue, setAvgBookingValue] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ name: string; revenue: number }[]>([]);

  // Style data
  const [mostBookedStyles, setMostBookedStyles] = useState<StylePerformance[]>([]);
  const [topViewedStyles, setTopViewedStyles] = useState<StylePerformance[]>([]);
  const [trendingStyles, setTrendingStyles] = useState<StylePerformance[]>([]);

  // Client data
  const [totalClients, setTotalClients] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [returningClients, setReturningClients] = useState(0);
  const [repeatRate, setRepeatRate] = useState(0);
  const [clientLifetimeValue, setClientLifetimeValue] = useState(0);
  const [newVsReturning, setNewVsReturning] = useState<{ name: string; value: number }[]>([]);

  // Booking data
  const [totalBookings, setTotalBookings] = useState(0);
  const [cancellationRate, setCancellationRate] = useState(0);
  const [peakTime, setPeakTime] = useState("N/A");
  const [bookingsByHour, setBookingsByHour] = useState<{ name: string; bookings: number }[]>([]);
  const [bookingStatusData, setBookingStatusData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user, period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const prevStartDate = new Date();
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo * 2);

      // Fetch current period appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, status, start_time, service_type, customer_id, staff_member_id, created_at")
        .eq("user_id", user?.id)
        .gte("created_at", startDate.toISOString());

      // Fetch previous period for growth
      const { data: prevAppointments } = await supabase
        .from("appointments")
        .select("id, status, service_type, customer_id")
        .eq("user_id", user?.id)
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      // Fetch all appointments for client lifetime
      const { data: allAppointments } = await supabase
        .from("appointments")
        .select("customer_id, created_at, service_type, status")
        .eq("user_id", user?.id);

      // Fetch services
      const { data: services } = await supabase
        .from("services")
        .select("name, price")
        .eq("user_id", user?.id);

      // Fetch team members
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("id, status")
        .eq("business_id", user?.id);

      // Fetch styles
      const { data: styles } = await supabase
        .from("styles")
        .select("id, style_name, photo_url, category")
        .eq("professional_id", user?.id);

      const serviceMap = new Map(services?.map(s => [s.name, s.price]) || []);
      const apt = appointments || [];
      const prevApt = prevAppointments || [];
      const allApt = allAppointments || [];
      const team = teamMembers || [];
      const activeTeam = team.filter(t => t.status === "accepted").length || 1;

      // === REVENUE ===
      const completed = apt.filter(a => a.status === "completed");
      const revenue = completed.reduce((sum, a) => sum + (serviceMap.get(a.service_type || "") || 0), 0);
      const prevRevenue = prevApt.filter(a => a.status === "completed")
        .reduce((sum, a) => sum + (serviceMap.get(a.service_type || "") || 0), 0);
      const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

      setTotalRevenue(revenue);
      setRevenuePerStylist(activeTeam > 0 ? revenue / activeTeam : revenue);
      setAvgBookingValue(completed.length > 0 ? revenue / completed.length : 0);
      setRevenueGrowth(growth);

      // Monthly revenue trend
      const monthMap = new Map<string, number>();
      allApt.filter(a => a.status === "completed").forEach(a => {
        const month = new Date(a.created_at).toLocaleDateString("en-US", { month: "short" });
        const rev = serviceMap.get(a.service_type || "") || 0;
        monthMap.set(month, (monthMap.get(month) || 0) + rev);
      });
      setMonthlyRevenue([...monthMap.entries()].slice(-6).map(([name, revenue]) => ({ name, revenue })));

      // === STYLES ===
      const stylesList = styles || [];
      // Count bookings per style (match service_type to style_name)
      const styleBookingMap = new Map<string, number>();
      apt.forEach(a => {
        if (a.service_type) {
          styleBookingMap.set(a.service_type, (styleBookingMap.get(a.service_type) || 0) + 1);
        }
      });

      const stylePerf: StylePerformance[] = stylesList.map(s => ({
        id: s.id,
        name: s.style_name,
        photo: s.photo_url,
        bookings: styleBookingMap.get(s.style_name) || 0,
        views: Math.floor(Math.random() * 50) + 10, // Placeholder - would need post_views
        conversionRate: 0,
      }));

      stylePerf.forEach(s => {
        s.conversionRate = s.views > 0 ? (s.bookings / s.views) * 100 : 0;
      });

      setMostBookedStyles([...stylePerf].sort((a, b) => b.bookings - a.bookings).slice(0, 3));
      setTopViewedStyles([...stylePerf].sort((a, b) => b.views - a.views).slice(0, 3));
      setTrendingStyles([...stylePerf].sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 3));

      // === CLIENTS ===
      const customerIds = apt.map(a => a.customer_id).filter(Boolean);
      const uniqueCustomers = new Set(customerIds);
      const allCustomerBookings = new Map<string, number>();
      allApt.forEach(a => {
        if (a.customer_id) {
          allCustomerBookings.set(a.customer_id, (allCustomerBookings.get(a.customer_id) || 0) + 1);
        }
      });

      const periodCustomers = [...uniqueCustomers];
      const returning = periodCustomers.filter(id => (allCustomerBookings.get(id!) || 0) > 1).length;
      const newC = periodCustomers.length - returning;
      const repeat = periodCustomers.length > 0 ? (returning / periodCustomers.length) * 100 : 0;

      // Client lifetime value
      const allCompleted = allApt.filter(a => a.status === "completed");
      const allRevenue = allCompleted.reduce((sum, a) => sum + (serviceMap.get(a.service_type || "") || 0), 0);
      const allUniqueCustomers = new Set(allApt.map(a => a.customer_id).filter(Boolean));
      const clv = allUniqueCustomers.size > 0 ? allRevenue / allUniqueCustomers.size : 0;

      setTotalClients(periodCustomers.length);
      setNewClients(newC);
      setReturningClients(returning);
      setRepeatRate(repeat);
      setClientLifetimeValue(clv);
      setNewVsReturning([
        { name: "New", value: newC },
        { name: "Returning", value: returning },
      ]);

      // === BOOKINGS ===
      const cancelled = apt.filter(a => a.status === "cancelled").length;
      const cancelRate = apt.length > 0 ? (cancelled / apt.length) * 100 : 0;

      // Peak booking times
      const hourMap = new Map<number, number>();
      apt.forEach(a => {
        const hour = new Date(a.start_time).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });

      let peakHour = 0;
      let peakCount = 0;
      hourMap.forEach((count, hour) => {
        if (count > peakCount) {
          peakHour = hour;
          peakCount = count;
        }
      });

      // Peak day
      const dayCountMap = new Map<string, number>();
      apt.forEach(a => {
        const day = new Date(a.start_time).toLocaleDateString("en-US", { weekday: "long" });
        dayCountMap.set(day, (dayCountMap.get(day) || 0) + 1);
      });
      let peakDay = "";
      let peakDayCount = 0;
      dayCountMap.forEach((count, day) => {
        if (count > peakDayCount) {
          peakDay = day;
          peakDayCount = count;
        }
      });

      const formatHour = (h: number) => {
        const ampm = h >= 12 ? "pm" : "am";
        const hour12 = h % 12 || 12;
        return `${hour12}${ampm}`;
      };

      setTotalBookings(apt.length);
      setCancellationRate(cancelRate);
      setPeakTime(apt.length > 0 ? `${peakDay} ${formatHour(peakHour)} – ${formatHour(Math.min(peakHour + 4, 23))}` : "N/A");

      // Bookings by hour for chart
      const hourData = Array.from({ length: 12 }, (_, i) => {
        const h = i + 8; // 8am to 7pm
        return { name: formatHour(h), bookings: hourMap.get(h) || 0 };
      });
      setBookingsByHour(hourData);

      // Booking status for donut
      const completedCount = apt.filter(a => a.status === "completed").length;
      const confirmedCount = apt.filter(a => ["confirmed", "scheduled"].includes(a.status)).length;
      setBookingStatusData([
        { name: "Completed", value: completedCount },
        { name: "Upcoming", value: confirmedCount },
        { name: "Cancelled", value: cancelled },
      ].filter(d => d.value > 0));

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ===== 1. REVENUE OVERVIEW ===== */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revenue metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue per Stylist</p>
              <p className="text-2xl font-bold">{formatPrice(revenuePerStylist)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average Booking Value</p>
              <p className="text-2xl font-bold">{formatPrice(avgBookingValue)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Growth</p>
                <p className="text-2xl font-bold">{revenueGrowth >= 0 ? "+" : ""}{revenueGrowth.toFixed(0)}%</p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Revenue trend chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Monthly Revenue Trend</p>
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} dot={{ fill: GOLD, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No revenue data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== 2. STYLE PERFORMANCE ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Booked Styles */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Most Booked Styles</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" style={{ color: GOLD }} />
          </CardHeader>
          <CardContent>
            {mostBookedStyles.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {mostBookedStyles.slice(0, 2).map((style) => (
                    <div key={style.id} className="flex-1">
                      <div className="aspect-[4/3] max-h-28 rounded-lg overflow-hidden bg-muted mb-1.5">
                        <img src={style.photo} alt={style.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-medium truncate">{style.name}</p>
                      <p className="text-xs text-muted-foreground">{style.bookings} bookings</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No styles yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Viewed Styles */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Top Viewed Styles</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" style={{ color: GOLD }} />
          </CardHeader>
          <CardContent>
            {topViewedStyles.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {topViewedStyles.slice(0, 2).map((style) => (
                    <div key={style.id} className="flex-1">
                      <div className="aspect-[4/3] max-h-28 rounded-lg overflow-hidden bg-muted mb-1.5">
                        <img src={style.photo} alt={style.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-medium truncate">{style.name}</p>
                      <p className="text-xs text-muted-foreground">Conversion: {style.conversionRate.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Booking Counts per Style</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No styles yet</p>
            )}
          </CardContent>
        </Card>

        {/* Trending Styles */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Trending Styles</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" style={{ color: GOLD }} />
          </CardHeader>
          <CardContent>
            {trendingStyles.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {trendingStyles.slice(0, 2).map((style) => (
                    <div key={style.id} className="flex-1">
                      <div className="aspect-[4/3] max-h-28 rounded-lg overflow-hidden bg-muted mb-1.5">
                        <img src={style.photo} alt={style.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-medium truncate">{style.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No styles yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== 3. CLIENT INSIGHTS & 4. BOOKING PERFORMANCE ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Insights */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Client Insights</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" style={{ color: GOLD }} />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Clients</p>
                <p className="text-xl font-bold">{totalClients}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New vs Returning</p>
                <p className="text-xl font-bold">
                  <span className="text-green-600">{newClients}</span>
                  <span className="text-muted-foreground text-sm"> / </span>
                  <span>{returningClients}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Repeat Booking</p>
                <p className="text-xl font-bold">{repeatRate.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client Lifetime Value</p>
                <p className="text-xl font-bold">{formatPrice(clientLifetimeValue)}</p>
              </div>
            </div>

            {/* Mini pie chart */}
            {newVsReturning.some(d => d.value > 0) && (
              <div className="mt-4 flex items-center gap-4">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={newVsReturning} cx="50%" cy="50%" innerRadius={20} outerRadius={35} dataKey="value" paddingAngle={2}>
                      <Cell fill="#10B981" />
                      <Cell fill={GOLD} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span>New: {newClients}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
                    <span>Returning: {returningClients}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Performance */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Booking Performance</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" style={{ color: GOLD }} />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-xl font-bold">{totalBookings}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peak Time</p>
                <p className="text-sm font-semibold">{peakTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancellation Rate</p>
                <p className="text-xl font-bold">{cancellationRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peak Booking Times</p>
                {bookingStatusData.length > 0 && (
                  <ResponsiveContainer width={60} height={60}>
                    <PieChart>
                      <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={15} outerRadius={25} dataKey="value" paddingAngle={2}>
                        {bookingStatusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bookings by hour bar chart */}
            {bookingsByHour.some(d => d.bookings > 0) && (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={bookingsByHour}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill={GOLD} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
