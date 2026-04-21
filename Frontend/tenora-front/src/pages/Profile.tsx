import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, Phone, ShieldCheck, ShieldAlert, Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    try {
      const r = await authApi.updateProfile({ phone });
      setUser(r.data);
      toast.success("Profil mis à jour.");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-app py-8 md:py-12 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="size-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-2xl font-bold shadow-glow">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Mon profil</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="card-elev rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" /> {user.email}
          </span>
          {user.is_verified ? (
            <span className="chip bg-success/15 text-success border border-success/30"><ShieldCheck className="size-3" /> Vérifié</span>
          ) : (
            <button onClick={() => navigate("/verifier-email")} className="chip bg-warning/15 text-warning border border-warning/30">
              <ShieldAlert className="size-3" /> À vérifier
            </button>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+227 ..." className="w-full h-11 pl-10 pr-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null} Enregistrer
        </Button>
      </div>

      <Button onClick={async () => { await logout(); navigate("/"); }} variant="outline" className="w-full mt-4">
        <LogOut className="size-4" /> Se déconnecter
      </Button>
    </div>
  );
}
