import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/stores/auth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function PanelLayout() {
  const { isLoggedIn, ready, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-3 w-3 bg-primary animate-pulse-glow" />
          <p className="eyebrow">Initialisation...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="relative min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-[1500px] mx-auto">
            <Outlet />
          </div>
        </main>
        <footer className="border-t-2 border-border px-6 py-3 text-[10px] mono uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
          <span>TENORA // PANEL v1.0</span>
          <span className="flex items-center gap-2">
            <span className="status-dot bg-success text-success" />
            SYSTEM ONLINE
          </span>
        </footer>
      </div>
    </div>
  );
}
