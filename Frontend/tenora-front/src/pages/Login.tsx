import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Loader2, Mail, Lock } from "lucide-react";
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
    <div className="container-app py-10 md:py-16 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md card-elev rounded-2xl p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <TenoraLogo className="size-12 mb-3" />
          <h1 className="font-display text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-muted-foreground mt-1">Heureux de vous revoir.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>}
          <div>
            <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input id="login-email" name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 pl-10 pr-3 rounded-lg bg-input border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">Mot de passe</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 pl-10 pr-3 rounded-lg bg-input border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full h-12 bg-gradient-primary text-primary-foreground shadow-glow">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} Se connecter
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-5">
          Pas de compte ? <Link to="/inscription" className="text-primary font-medium hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
