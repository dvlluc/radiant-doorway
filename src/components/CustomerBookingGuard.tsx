import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContentPlaceholder } from "@/components/ContentPlaceholder";
import { useAuth } from "@/contexts/AuthContext";
import { useCanBookAsCustomer } from "@/hooks/useCanBookAsCustomer";

interface CustomerBookingGuardProps {
  children: ReactNode;
}

export function CustomerBookingGuard({ children }: CustomerBookingGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canBook, isLoading } = useCanBookAsCustomer();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isLoading && !canBook) {
      navigate("/account", { replace: true });
    }
  }, [user, canBook, isLoading, navigate]);

  if (!user || isLoading) {
    return <ContentPlaceholder />;
  }

  if (!canBook) {
    return null;
  }

  return <>{children}</>;
}
