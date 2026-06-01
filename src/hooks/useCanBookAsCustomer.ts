import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

/** True only for signed-in individual accounts (may book other businesses). */
export function useCanBookAsCustomer() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile(user?.id);

  const canBook = Boolean(user && profile?.account_type === "individual");

  return {
    canBook,
    isLoading: Boolean(user) && isLoading,
    accountType: profile?.account_type,
  };
}
