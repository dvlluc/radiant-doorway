import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";
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

interface AdminUser {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export function AdminUsersManagement() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "moderator" | "user">("admin");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data: admins, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile data for each admin
      const adminsWithProfiles = await Promise.all(
        (admins || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, first_name, last_name")
            .eq("id", admin.user_id)
            .single();

          return {
            ...admin,
            ...profile,
          };
        })
      );

      setAdminUsers(adminsWithProfiles);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast.error("Failed to fetch admin users");
    } finally {
      setLoading(false);
    }
  };

  const addAdminUser = async () => {
    if (!searchEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", searchEmail.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        toast.error("User not found with that email");
        return;
      }

      // Add to admin_users
      const { error } = await supabase
        .from("admin_users")
        .insert({
          user_id: profile.id,
          role: selectedRole,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("User already has admin privileges");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Admin user added successfully");
      setSearchEmail("");
      fetchAdminUsers();
    } catch (error) {
      console.error("Error adding admin user:", error);
      toast.error("Failed to add admin user");
    }
  };

  const removeAdminUser = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      toast.success("Admin privileges removed");
      fetchAdminUsers();
    } catch (error) {
      console.error("Error removing admin user:", error);
      toast.error("Failed to remove admin privileges");
    } finally {
      setDeleteUserId(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return <div>Loading admin users...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Users Management</CardTitle>
          <CardDescription>
            Add or remove admin privileges for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Admin User Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add Admin User</h3>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Enter user email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAdminUser()}
                />
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addAdminUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Admin Users List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Admin Users ({adminUsers.length})</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.email || "N/A"}</TableCell>
                    <TableCell>
                      {admin.first_name && admin.last_name
                        ? `${admin.first_name} ${admin.last_name}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(admin.role)}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUserId(admin.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {adminUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No admin users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin privileges from this user? They will no longer have access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && removeAdminUser(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
