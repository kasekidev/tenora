import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Zap, LayoutDashboard, FolderTree, Package, ShoppingCart, Inbox, Users, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/orders", label: "Commandes", icon: ShoppingCart },
  { to: "/imports", label: "Imports", icon: Inbox },
  { to: "/users", label: "Utilisateurs", icon: Users },
  { to: "/settings", label: "Parametres", icon: Settings },
];

export function Topbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Deconnecte");
    navigate("/login");
  };

  const now = new Date();
  const ts = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <header className="sticky top-0 z-20 border-b-2 border-border bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 h-14">
          {/* Mobile burger */}
          <button
            className="lg:hidden h-9 w-9 flex items-center justify-center border-2 border-border hover:border-primary transition-colors shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="display text-lg truncate">TENORA</span>
          </div>

          {/* Search-like breadcrumb / sys status — desktop only */}
          <div className="hidden lg:flex items-center gap-3 mono text-xs">
            <span className="text-muted-foreground">SYS://</span>
            <span className="text-primary">tenora.admin</span>
            <span className="text-muted-foreground animate-blink">_</span>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 chip border-border">
            <span className="status-dot bg-success text-success" />
            <span>{ts}</span>
          </div>

          {/* User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-xs font-semibold truncate max-w-[160px]">{user?.email}</span>
              <span className="eyebrow text-[9px]">ADMIN</span>
            </div>
            <div className="h-9 w-9 bg-primary text-primary-foreground border-2 border-primary flex items-center justify-center mono font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <button
              onClick={handleLogout}
              className="h-9 w-9 border-2 border-border hover:border-destructive hover:text-destructive flex items-center justify-center transition-colors shrink-0"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute inset-y-0 left-0 w-[85vw] max-w-xs bg-sidebar border-r-2 border-sidebar-border p-5 animate-slide-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-9 w-9 bg-primary flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="display text-lg leading-none truncate">TENORA</p>
                  <p className="eyebrow text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>ADMIN.PANEL</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="h-9 w-9 border-2 border-border flex items-center justify-center shrink-0" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profil compact mobile */}
            {user?.email && (
              <div className="brackets bg-sidebar-accent/40 p-3 mb-4">
                <p className="eyebrow mb-1">// CONNECTÉ</p>
                <p className="text-xs mono truncate">{user.email}</p>
              </div>
            )}

            <nav className="space-y-1 flex-1 overflow-y-auto -mx-1 px-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-3 border-2 mono text-xs uppercase tracking-[0.12em] font-semibold transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Logout dans le drawer pour les mobiles très étroits */}
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="mt-4 flex items-center justify-center gap-2 px-3 py-3 border-2 border-border hover:border-destructive hover:text-destructive mono text-xs uppercase tracking-[0.12em] font-semibold transition-colors"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
