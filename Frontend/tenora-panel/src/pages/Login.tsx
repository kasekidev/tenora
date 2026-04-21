import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, ready, fetchMe } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (ready && isLoggedIn) navigate("/", { replace: true });
  }, [ready, isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Bienvenue admin");
      navigate("/", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      let msg: string;
      if (status === 401) msg = typeof detail === "string" ? detail : "Email ou mot de passe incorrect.";
      else if (err?.message?.includes("administrateurs")) msg = err.message;
      else if (err?.code === "ERR_NETWORK") msg = "Impossible de joindre l'API. Verifiez VITE_API_URL et la config CORS.";
      else msg = typeof detail === "string" ? detail : (err?.message || "Erreur de connexion");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Bg grid */}
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40" />
      {/* Glows */}
      <div className="absolute top-0 left-1/4 h-96 w-96 bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 bg-secondary/15 blur-[120px] rounded-full" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Top bar mock */}
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center justify-between">
          <span>// SECURE.SHELL</span>
          <span className="flex items-center gap-2">
            <span className="status-dot bg-success text-success" />
            ENCRYPTED
          </span>
        </div>

        <div className="brackets brut-card p-8 bg-card relative">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative h-12 w-12 bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" strokeWidth={3} />
              <span className="absolute inset-0 bg-primary translate-x-1.5 translate-y-1.5 -z-10" />
            </div>
            <div>
              <p className="display text-2xl leading-none">TENORA</p>
              <p className="eyebrow mt-1.5">ADMIN.PANEL // ACCESS</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="display text-3xl mb-2">
              <span className="gradient-text">Authentification</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Acces reserve aux administrateurs autorises.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="eyebrow flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                <Mail className="h-3 w-3" /> Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tenora.com"
                required
                autoComplete="email"
                className="h-11 mono border-2 rounded-none bg-input/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="eyebrow flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                <Lock className="h-3 w-3" /> Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 mono border-2 rounded-none bg-input/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 border-2 border-destructive/40 bg-destructive-soft p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "brut-btn brut-btn-shadow w-full h-12 bg-primary border-primary text-primary-foreground text-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "Connexion..." : (
                <span className="flex items-center gap-2">
                  Acceder au panel <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] mono uppercase tracking-[0.2em] text-muted-foreground">
            // toutes les actions sont journalisees
          </p>
        </div>

        <div className="mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3 text-center">
          TENORA &copy; {new Date().getFullYear()} — All systems online
        </div>
      </div>
    </div>
  );
}
