import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasEmailPasswordIdentity,
  isGoogleOnlyUser,
  usesGoogleSignIn,
} from "@/lib/auth/oauth";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AccountSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const googleOnly = isGoogleOnlyUser(user);
  const hasPassword = hasEmailPasswordIdentity(user);
  const usesGoogle = usesGoogleSignIn(user);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    if (hasPassword && !passwordData.currentPassword) {
      toast({
        title: "Current password required",
        description: "Enter your current password to continue",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (hasPassword) {
        const email = user?.email;
        if (!email) {
          throw new Error("No email found for this account");
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: passwordData.currentPassword,
        });

        if (signInError) {
          throw new Error("Current password is incorrect");
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: googleOnly ? "Password Set" : "Password Updated",
        description: googleOnly
          ? "You can now sign in with email and password as well as Google."
          : "Your password has been changed successfully."
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      toast({
        title: "Account Deletion",
        description: "Account deletion functionality will be implemented soon.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete account";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground">Manage your account security and preferences.</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold">Security</h2>

          {googleOnly && (
            <p className="text-sm text-muted-foreground">
              You signed in with Google. Set a password below if you also want to sign in with email and password.
            </p>
          )}

          {usesGoogle && hasPassword && (
            <p className="text-sm text-muted-foreground">
              Your account is linked to Google and email sign-in. Use your current password to change it.
            </p>
          )}

          <div className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">{googleOnly ? "Password" : "New Password"}</Label>
              <PasswordInput
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm {googleOnly ? "Password" : "New Password"}</Label>
              <PasswordInput
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleUpdatePassword}
              disabled={loading}
              variant="secondary"
              className="mt-4"
            >
              {googleOnly ? "Set Password" : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-cyan-200 bg-cyan-50/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-900">Danger Zone</h2>
          </div>
          <p className="text-sm text-cyan-700 mb-4 sm:mb-6">
            Irreversible actions that will permanently affect your account.
          </p>

          <Card className="bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete your account and remove your access to BeautyConnect. This action cannot be undone.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All your personal data will be permanently deleted</li>
                    <li>• Your profile and reviews will be removed</li>
                    <li>• Active bookings and subscriptions will be cancelled</li>
                    <li>• Any business data or partnerships will be terminated</li>
                  </ul>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto sm:ml-4">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
