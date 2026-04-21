import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmail() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (user?.is_verified) {
    setTimeout(() => navigate("/profil"), 0);
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyEmail(code);
      await refresh();
      toast.success("Email vérifié !");
      navigate("/profil");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Code invalide.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendOtp();
      toast.success("Code renvoyé.");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Impossible d'envoyer le code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container-app py-10 md:py-16 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md card-elev rounded-2xl p-6 md:p-8 text-center">
        <div className="size-14 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center mb-4">
          <MailCheck className="size-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Vérifiez votre email</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Entrez le code à 6 chiffres que nous avons envoyé à <span className="text-foreground font-medium">{user?.email}</span>.
        </p>
        <form onSubmit={verify} className="mt-6 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <Button type="submit" disabled={code.length !== 6 || loading} size="lg" className="w-full h-12 bg-gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Vérifier
          </Button>
        </form>
        <button onClick={resend} disabled={resending} className="text-sm text-primary hover:underline mt-4 inline-flex items-center gap-1">
          {resending && <Loader2 className="size-3 animate-spin" />} Renvoyer le code
        </button>
      </div>
    </div>
  );
}
