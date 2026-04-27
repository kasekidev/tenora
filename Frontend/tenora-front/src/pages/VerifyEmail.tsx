import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmail() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Si déjà vérifié → redirige proprement (pas de setState pendant le render)
  useEffect(() => {
    if (user?.is_verified) navigate("/profil", { replace: true });
  }, [user?.is_verified, navigate]);

  const submitCode = async (value: string) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    try {
      await authApi.verifyEmail(value);
      await refresh();
      toast.success("Email vérifié !");
      navigate("/profil");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Code invalide.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    if (value.length === 6) submitCode(value);
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    submitCode(code);
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendOtp();
      toast.success("Code renvoyé.");
      setCode("");
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
          Entrez le code à 6 chiffres envoyé à{" "}
          <span className="text-foreground font-medium">{user?.email}</span>.
        </p>

        <form onSubmit={verify} className="mt-6 space-y-5">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleChange}
              disabled={loading}
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="size-12 md:size-14 text-xl md:text-2xl font-semibold rounded-lg border border-border bg-input first:rounded-l-lg last:rounded-r-lg shadow-sm"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            disabled={code.length !== 6 || loading}
            size="lg"
            className="w-full h-12 bg-gradient-primary text-primary-foreground shadow-glow"
          >
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Vérifier
          </Button>
        </form>

        <button
          onClick={resend}
          disabled={resending}
          className="text-sm text-primary hover:underline mt-5 inline-flex items-center gap-1"
        >
          {resending && <Loader2 className="size-3 animate-spin" />} Renvoyer le code
        </button>
      </div>
    </div>
  );
}
