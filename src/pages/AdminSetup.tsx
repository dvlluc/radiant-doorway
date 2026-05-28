import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"checking" | "success" | "error" | "already_admin">("checking");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAndSetupAdmin();
  }, []);

  const checkAndSetupAdmin = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in first");
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      // Check if already admin
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingAdmin) {
        setStatus("already_admin");
        setLoading(false);
        return;
      }

      // Add user as admin
      const { error } = await supabase
        .from("admin_users")
        .insert({
          user_id: user.id,
          role: "admin"
        });

      if (error) {
        console.error("Error adding admin:", error);
        setStatus("error");
        toast.error("Failed to add admin privileges: " + error.message);
      } else {
        setStatus("success");
        toast.success("Admin privileges granted!");
      }
    } catch (error) {
      console.error("Setup error:", error);
      setStatus("error");
      toast.error("An error occurred during setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Setting up admin access for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Admin privileges granted successfully!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                User ID: <code className="bg-muted px-2 py-1 rounded">{userId}</code>
              </p>
              <Button onClick={() => navigate("/admin-panel")} className="w-full">
                Go to Admin Panel
              </Button>
            </div>
          )}

          {status === "already_admin" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">You already have admin privileges!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                User ID: <code className="bg-muted px-2 py-1 rounded">{userId}</code>
              </p>
              <Button onClick={() => navigate("/admin-panel")} className="w-full">
                Go to Admin Panel
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Failed to grant admin privileges</p>
              </div>
              <p className="text-sm text-muted-foreground">
                There was an error setting up admin access. Please check the console for details.
              </p>
              <Button onClick={() => navigate("/directory")} variant="outline" className="w-full">
                Go Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
