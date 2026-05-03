import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { TenoraLogo } from "@/components/brand/TenoraLogo";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/profil";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Bienvenue !");
      navigate(redirect);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-10 md:py-16 overflow-hidden">
      {/* Grille d'arrière-plan */}
      <div className="absolute inset-0 bg-grid opacity-[0.07] pointer-events-none" aria-hidden />
      {/* Halos ambiants */}
      <div className="absolute -top-24 right-[-10%] w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-[90px] pointer-events-none" aria-hidden />
      <div className="absolute bottom-0 left-[-5%] w-72 h-72 rounded-full bg-primary/6 blur-[70px] pointer-events-none" aria-hidden />
      {/* Ligne de décoration horizontale */}
      <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none" aria-hidden />

      {/* Carte */}
      <div className="relative z-10 w-full max-w-md mx-4 card-elev p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-7">
          <TenoraLogo className="text-2xl mb-4" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground mt-1">Heureux de vous revoir.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="border border-destructive/40 bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3 bg-input border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mot de passe</label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                id="login-password"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-11 bg-input border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Masquer" : "Afficher"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full h-12 mt-1 bg-gradient-primary text-primary-foreground shadow-glow"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            Se connecter
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-5 pt-5 border-t border-border">
          Pas de compte ?{" "}
          <Link to="/inscription" className="text-primary font-bold hover:underline">
            Créer un compte →
          </Link>
        </p>
      </div>
    </div>
  );
}
