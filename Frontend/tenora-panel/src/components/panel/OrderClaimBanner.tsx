// src/components/panel/OrderClaimBanner.tsx
// ----------------------------------------------------------------------------
// Bannière de verrou affichée en haut du dialog/détail d'une commande.
// 3 états visuels :
//   1. Libre        → bouton "Prendre en charge" (claim)
//   2. Mien         → bandeau primaire + bouton "Libérer" + countdown 30 min
//   3. Pris ailleurs → bandeau destructive "Verrouillée par @pseudo" + lecture seule
//
// Polling auto toutes les 15s. Layout responsive (stack mobile, row dès sm).
// ----------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, LockOpen, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  claimOrder,
  releaseOrder,
  getClaimStatus,
  type OrderClaim,
} from "@/lib/api/orderClaim";

interface Props {
  orderId: number;
  /** État initial fourni par le parent (renvoyé par GET /panel/orders/:id ou /panel/orders). */
  initialClaim?: OrderClaim | null;
  /** ID de l'admin courant pour détecter "is_mine" sans round-trip. */
  currentAdminId: number;
  /**
   * Appelé chaque fois que l'état du claim change.
   * `canEdit = true` ⇔ l'admin courant peut modifier (libre OU claim à lui).
   */
  onChange?: (state: { claim: OrderClaim | null; canEdit: boolean }) => void;
  /** Désactive complètement les actions (ex: commande dans un statut terminal). */
  disabled?: boolean;
}

const POLL_INTERVAL_MS = 15_000;

export function OrderClaimBanner({
  orderId,
  initialClaim = null,
  currentAdminId,
  onChange,
  disabled = false,
}: Props) {
  const [claim, setClaim] = useState<OrderClaim | null>(initialClaim);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { toast } = useToast();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync si l'orderId change (réutilisation du dialog pour une autre commande).
  useEffect(() => {
    setClaim(initialClaim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const isMine = claim?.claimed_by_id === currentAdminId;
  const canEdit = !claim?.claimed_by_id || isMine;

  // Notifie le parent à chaque changement.
  useEffect(() => {
    onChangeRef.current?.({ claim, canEdit });
  }, [claim, canEdit]);

  // Tick d'horloge pour le countdown (1 s).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Polling pour détecter les changements d'autres admins.
  const refresh = useCallback(async () => {
    try {
      const res = await getClaimStatus(orderId);
      setClaim(res.claim);
    } catch {
      /* silencieux : on ne casse pas l'UI sur un poll raté */
    }
  }, [orderId]);

  useEffect(() => {
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const handleClaim = async () => {
    setBusy(true);
    try {
      const res = await claimOrder(orderId);
      setClaim(res.claim);
      toast({ title: "Commande verrouillée", description: "Tu peux la traiter sereinement." });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Impossible de verrouiller.";
      toast({ title: "Verrou refusé", description: msg, variant: "destructive" });
      // En cas de 423, on rafraîchit pour afficher qui a claim.
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    setBusy(true);
    try {
      const res = await releaseOrder(orderId);
      setClaim(res.claim);
      toast({ title: "Verrou libéré" });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.response?.data?.detail || "Impossible de libérer.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  // Countdown joli "12:34"
  const remaining = useMemo(() => {
    if (!claim?.expires_at) return null;
    const diff = new Date(claim.expires_at).getTime() - now;
    if (diff <= 0) return "00:00";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [claim?.expires_at, now]);

  // Container commun : stack en mobile, row dès sm.
  const wrapper =
    "flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-2";

  // ===== Rendu =====
  // 1) Libre
  if (!claim?.claimed_by_id) {
    return (
      <div className={cn(wrapper, "border-dashed border-border bg-muted/20")}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <LockOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs mono uppercase tracking-wider text-muted-foreground">
              // Commande libre
            </p>
            <p className="text-sm break-words">
              Aucun admin ne traite cette commande.
              <span className="text-muted-foreground"> Verrouille-la pour éviter les doublons.</span>
            </p>
          </div>
        </div>
        <Button
          onClick={handleClaim}
          disabled={busy || disabled}
          className="rounded-none border-2 mono uppercase text-[11px] tracking-wider w-full sm:w-auto h-10 sm:h-9 shrink-0"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
          Prendre en charge
        </Button>
      </div>
    );
  }

  // 2) C'est moi qui ai claim
  if (isMine) {
    return (
      <div className={cn(wrapper, "border-primary bg-primary-soft/40")}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs mono uppercase tracking-wider text-primary">
              // Tu traites cette commande
            </p>
            <p className="text-sm break-words">
              Tu es le seul à pouvoir la modifier.
              {remaining && (
                <span className="text-muted-foreground">
                  {" "}
                  Verrou actif encore <span className="mono font-bold">{remaining}</span>.
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRelease}
          disabled={busy}
          className="rounded-none border-2 mono uppercase text-[11px] tracking-wider w-full sm:w-auto h-10 sm:h-9 shrink-0"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <LockOpen className="h-3.5 w-3.5 mr-1" />}
          Libérer
        </Button>
      </div>
    );
  }

  // 3) Quelqu'un d'autre a claim
  const owner = claim.claimed_by_username || claim.claimed_by_email || "un autre admin";
  return (
    <div className={cn(wrapper, "border-destructive bg-destructive/10 items-start sm:items-center")}>
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs mono uppercase tracking-wider text-destructive">
          // Verrouillée
        </p>
        <p className="text-sm break-words">
          Cette commande est traitée par{" "}
          <span className="chip border-destructive/40 text-destructive bg-destructive/10 mono break-all">
            @{owner}
          </span>
          {remaining && (
            <span className="text-muted-foreground">
              {" "}— se libère dans <span className="mono font-bold">{remaining}</span> si inactif.
            </span>
          )}
        </p>
        <p className="text-[11px] mono text-muted-foreground mt-1">
          Lecture seule. Demande à l'admin de libérer ou attends l'expiration.
        </p>
      </div>
    </div>
  );
}
