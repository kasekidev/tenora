import { NavLink } from "react-router-dom";
import { Home, ShoppingBag, Package, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/boutique", label: "Shop", icon: ShoppingBag },
  { to: "/ebooks", label: "Ebooks", icon: BookOpen },
];

export function MobileTabBar() {
  const { user } = useAuth();
  const all = [
    ...tabs,
    user
      ? { to: "/mes-commandes", label: "Cmd.", icon: Package }
      : { to: "/connexion", label: "Login", icon: User },
    { to: user ? "/profil" : "/inscription", label: user ? "Moi" : "Join", icon: User },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-xl border-t-2 border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-5">
        {all.map((t) => (
          <NavLink
            key={t.to + t.label}
            to={t.to}
            end={(t as { end?: boolean }).end}
            className={({ isActive }) =>
              cn(
                // min-h 56px = recommandation Android Material pour tap targets
                "relative flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 px-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors",
                "active:bg-muted/40",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary" />
                )}
                <t.icon
                  className={cn(
                    "size-[20px] transition-transform",
                    isActive && "scale-110 drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                  )}
                />
                <span className="truncate max-w-full leading-none">{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
