import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, User, LogOut, Package, BookOpen, Truck, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TenoraLogo } from "@/components/brand/TenoraLogo";
import { cn } from "@/lib/utils";

const links = [
  { to: "/boutique", label: "Boutique", icon: ShoppingBag },
  { to: "/ebooks", label: "Ebooks", icon: BookOpen },
  { to: "/import", label: "Import", icon: Truck },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-border">
      <div className="container-app h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <TenoraLogo className="text-2xl text-foreground group-hover:text-primary transition-colors" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors border-2",
                  isActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="uppercase tracking-wider text-xs">
                <Link to="/mes-commandes"><Package className="size-4" />Commandes</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="uppercase tracking-wider text-xs">
                <Link to="/profil"><User className="size-4" />{user.email.split("@")[0]}</Link>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="size-4" /></Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="uppercase tracking-wider text-xs">
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary uppercase tracking-wider text-xs font-bold border-2 border-primary hover-shift"
              >
                <Link to="/inscription">S'inscrire →</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden border-2">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] max-w-sm p-0 bg-sidebar border-l-2 border-sidebar-border">
              <div className="flex items-center justify-between p-4 border-b-2 border-sidebar-border">
                <TenoraLogo className="text-xl" />
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="size-5" /></Button>
              </div>
              <div className="p-3 space-y-1">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-3 border-2 text-sm font-bold uppercase tracking-wider",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent"
                      )
                    }
                  >
                    <l.icon className="size-5" /> {l.label}
                  </NavLink>
                ))}
              </div>
              <div className="p-3 border-t-2 border-sidebar-border space-y-2">
                {user ? (
                  <>
                    <Link onClick={() => setOpen(false)} to="/profil" className="flex items-center gap-3 px-3 py-3 text-sm font-bold uppercase tracking-wider hover:bg-sidebar-accent">
                      <User className="size-5" /> Mon profil
                    </Link>
                    <Link onClick={() => setOpen(false)} to="/mes-commandes" className="flex items-center gap-3 px-3 py-3 text-sm font-bold uppercase tracking-wider hover:bg-sidebar-accent">
                      <Package className="size-5" /> Mes commandes
                    </Link>
                    <Button variant="outline" className="w-full border-2 uppercase tracking-wider text-xs" onClick={() => { setOpen(false); handleLogout(); }}>
                      <LogOut className="size-4" /> Se déconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full border-2 uppercase tracking-wider text-xs">
                      <Link onClick={() => setOpen(false)} to="/connexion">Se connecter</Link>
                    </Button>
                    <Button asChild className="w-full bg-primary text-primary-foreground border-2 border-primary uppercase tracking-wider text-xs font-bold">
                      <Link onClick={() => setOpen(false)} to="/inscription">Créer un compte →</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
