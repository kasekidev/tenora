import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  LogOut,
  AtSign,
  Lock,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || "");
  const [username, setUsername] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  if (!user) return null;

  const hasUsername = !!user.username;
  const usernameValid = username === "" || USERNAME_RE.test(username);

  const savePhone = async () => {
    setSavingPhone(true);
    try {
      const r = await authApi.updateProfile({ phone });
      setUser(r.data);
      toast.success("Téléphone mis à jour.");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erreur.");
    } finally {
      setSavingPhone(false);
    }
  };

  const saveUsername = async () => {
    if (!USERNAME_RE.test(username)) {
      toast.error("Pseudo invalide.");
      return;
    }
    if (
      !window.confirm(
        `Confirmer le pseudo « ${username} » ?\n\nUne fois enregistré, il ne pourra plus jamais être modifié.`,
      )
    ) {
      return;
    }
    setSavingUsername(true);
    try {
      const r = await authApi.updateProfile({ username });
      setUser(r.data);
      toast.success("Pseudo enregistré définitivement.");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erreur.");
    } finally {
      setSavingUsername(false);
    }
  };

  // Initiale d'avatar : pseudo en priorité, sinon email
  const initial = (user.username || user.email).charAt(0).toUpperCase();

  return (
    <div className="container-app py-8 md:py-12 max-w-2xl">
      {/* ── En-tête ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="size-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-2xl font-bold shadow-glow">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold truncate">
            {user.username ? `@${user.username}` : "Mon profil"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* ── Carte Identité ─────────────────────────────────── */}
      <div className="card-elev rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" /> {user.email}
          </span>
          {user.is_verified ? (
            <span className="chip bg-success/15 text-success border border-success/30">
              <ShieldCheck className="size-3" /> Vérifié
            </span>
          ) : (
            <button
              onClick={() => navigate("/verifier-email")}
              className="chip bg-warning/15 text-warning border border-warning/30"
            >
              <ShieldAlert className="size-3" /> À vérifier
            </button>
          )}
        </div>

        {/* ── Pseudo ─────────────────────────────────────── */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
              <AtSign className="size-3.5" /> Pseudonyme
            </label>
            {hasUsername && (
              <span className="chip bg-muted text-muted-foreground border border-border">
                <Lock className="size-3" /> Verrouillé
              </span>
            )}
          </div>

          {hasUsername ? (
            <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 font-display text-base">
              @{user.username}
            </div>
          ) : (
            <>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: tenora_fan"
                  maxLength={20}
                  className={`w-full h-11 pl-10 pr-3 rounded-lg bg-input border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    usernameValid
                      ? "border-border focus:border-primary"
                      : "border-destructive/60 focus:border-destructive"
                  }`}
                />
              </div>
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-2">
                <Info className="size-3 mt-0.5 shrink-0" />
                <span>
                  3 à 20 caractères : lettres, chiffres, <code>_</code> ou{" "}
                  <code>-</code>.{" "}
                  <strong className="text-foreground">
                    Définitif une fois enregistré.
                  </strong>
                </span>
              </p>
              <Button
                onClick={saveUsername}
                disabled={savingUsername || !username || !usernameValid}
                className="w-full mt-3 bg-gradient-primary text-primary-foreground"
              >
                {savingUsername ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <AtSign className="size-4" />
                )}{" "}
                Définir mon pseudo
              </Button>
            </>
          )}
        </div>

        {/* ── Téléphone ──────────────────────────────────── */}
        <div className="border-t border-border pt-5">
          <label className="text-xs font-medium text-muted-foreground">
            Téléphone
          </label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+227 ..."
              className="w-full h-11 pl-10 pr-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <Button
            onClick={savePhone}
            disabled={savingPhone}
            className="w-full mt-3 bg-gradient-primary text-primary-foreground"
          >
            {savingPhone ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
            Enregistrer le téléphone
          </Button>
        </div>
      </div>

      <Button
        onClick={async () => {
          await logout();
          navigate("/");
        }}
        variant="outline"
        className="w-full mt-4"
      >
        <LogOut className="size-4" /> Se déconnecter
      </Button>
    </div>
  );
}
