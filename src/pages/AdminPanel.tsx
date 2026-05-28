import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, ShieldAlert, BarChart3, Settings, Calendar } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPosts } from "@/components/admin/AdminPosts";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminRefunds } from "@/components/admin/AdminRefunds";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminPolicies } from "@/components/admin/AdminPolicies";
import { AdminSupport } from "@/components/admin/AdminSupport";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminUsersManagement } from "@/components/admin/AdminUsersManagement";

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log("[AdminPanel] Auth loading:", authLoading, "User:", user?.id);
      
      if (authLoading) return;

      if (!user) {
        console.log("[AdminPanel] No user, redirecting to auth");
        navigate("/auth");
        return;
      }

      try {
        // Check if user is an admin
        console.log("[AdminPanel] Checking admin status for user:", user.id);
        const { data, error } = await supabase
          .from("admin_users")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("[AdminPanel] Admin check result:", { data, error });

        if (error) throw error;

        if (!data) {
          // Not an admin, redirect to home
          console.log("[AdminPanel] User is not an admin, redirecting to home");
          navigate("/directory");
          return;
        }

        // Ensure admin profile is marked as completed
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ profile_completed: true })
          .eq("id", user.id);

        if (profileError) {
          console.error("[AdminPanel] Error updating profile:", profileError);
        }

        console.log("[AdminPanel] User is admin, setting isAdmin to true");
        setIsAdmin(true);
      } catch (error) {
        console.error("[AdminPanel] Error checking admin status:", error);
        navigate("/directory");
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your platform</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-12 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Refunds</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="admin-users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="posts">
            <AdminPosts />
          </TabsContent>


          <TabsContent value="bookings">
            <AdminBookings />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>

          <TabsContent value="refunds">
            <AdminRefunds />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="policies">
            <AdminPolicies />
          </TabsContent>

          <TabsContent value="support">
            <AdminSupport />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
          
          <TabsContent value="admin-users">
            <AdminUsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
