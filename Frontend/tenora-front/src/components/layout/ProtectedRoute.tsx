import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  children,
  requireVerified = false,
}: {
  children: ReactNode;
  requireVerified?: boolean;
}) {
  const { user, checked } = useAuth();
  const loc = useLocation();

  if (!checked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/connexion?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  if (requireVerified && !user.is_verified) {
    return <Navigate to="/verifier-email" replace />;
  }
  return <>{children}</>;
}
