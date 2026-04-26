// Tenora — PaymentInstructions
// Carte d'instructions stylée affichée après création de la commande.
// Remplace les variables {amount} / {order_id} dans le template backend, et
// met en valeur les éléments importants : montant, référence, adresses crypto,
// avertissements (lignes débutant par ⚠).
import { useMemo, useState } from "react";
import { Check, Copy, Hash, Wallet, AlertTriangle, BadgeCheck } from "lucide-react";
import { PaymentLogo, getPaymentAccent } from "./PaymentLogo";
import { cn } from "@/lib/utils";

interface Props {
  methodId: string;
  methodName: string;
  rawInstructions: string;
  amountFormatted: string;
  orderId: number;
}

/** Substitution des placeholders backend. */
function resolveInstructions(tpl: string, amount: string, orderId: number) {
  return tpl
    .split("{amount}").join(amount)
    .split("{order_id}").join(String(orderId));
}

interface CopyableProps {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent?: string | null;
}

function Copyable({ label, value, Icon, accent }: CopyableProps) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {/* clipboard bloqué */}
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="group w-full flex items-center gap-3 rounded-lg border-2 border-border bg-background hover:border-foreground/40 transition-colors p-3 text-left"
    >
      <span
        style={accent ? { backgroundColor: accent } : undefined}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md text-white",
          !accent && "bg-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
          {label}
        </span>
        <span className="block font-semibold text-sm tabular-nums break-all line-clamp-2">
          {value}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest font-mono px-2 py-1 rounded transition-colors",
          copied ? "bg-success/15 text-success" : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
        )}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copié" : "Copier"}
      </span>
    </button>
  );
}

export function PaymentInstructions({
  methodId,
  methodName,
  rawInstructions,
  amountFormatted,
  orderId,
}: Props) {
  const accent = getPaymentAccent(methodId);

  const { intro, addresses, warnings, body } = useMemo(() => {
    const text = resolveInstructions(rawInstructions || "", amountFormatted, orderId);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const addr: { label: string; value: string }[] = [];
    const warn: string[] = [];
    const rest: string[] = [];

    for (const line of lines) {
      // ligne d'avertissement
      if (/^[⚠⚡]/.test(line) || /^attention/i.test(line)) {
        warn.push(line.replace(/^[⚠⚡]\s*/, ""));
        continue;
      }
      // "Adresse : ...", "Mémo : ...", "Compte : ...", "Référence : ..."
      const m = line.match(/^(Adresse|Adress|Address|Mémo|Memo|Compte|Référence|Reference|Numéro|Numero|Numero du compte)\s*:?\s*(.+)$/i);
      if (m) {
        addr.push({ label: m[1], value: m[2] });
        continue;
      }
      rest.push(line);
    }

    return {
      intro: rest[0] || `Effectuez votre paiement de ${amountFormatted} via ${methodName}.`,
      body: rest.slice(1),
      addresses: addr,
      warnings: warn,
    };
  }, [rawInstructions, amountFormatted, orderId, methodName]);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm">
      {/* Header bandeau couleur marque */}
      <div
        style={accent ? { backgroundColor: accent } : undefined}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-white",
          !accent && "bg-foreground"
        )}
      >
        <PaymentLogo methodId={methodId} name={methodName} variant="badge" className="ring-1 ring-white/20" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 font-mono">Instructions de paiement</p>
          <p className="font-display text-lg font-bold uppercase leading-none truncate">{methodName}</p>
        </div>
        <BadgeCheck className="size-5 opacity-90" />
      </div>

      {/* Corps */}
      <div className="p-4 space-y-4">
        {/* Montant + référence — toujours en haut, copiables */}
        <div className="grid sm:grid-cols-2 gap-2">
          <Copyable
            label="Montant à envoyer"
            value={amountFormatted}
            Icon={Wallet}
            accent={accent}
          />
          <Copyable
            label="Référence (obligatoire)"
            value={`#${orderId}`}
            Icon={Hash}
            accent={accent}
          />
        </div>

        {/* Adresses / numéros détectés */}
        {addresses.length > 0 && (
          <div className="space-y-2">
            {addresses.map((a, i) => (
              <Copyable
                key={i}
                label={a.label}
                value={a.value}
                Icon={Wallet}
                accent={accent}
              />
            ))}
          </div>
        )}

        {/* Texte d'intro + reste */}
        <div className="rounded-lg bg-muted/60 p-3 space-y-1.5">
          <p className="text-sm leading-relaxed">{intro}</p>
          {body.map((l, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{l}</p>
          ))}
        </div>

        {/* Avertissements */}
        {warnings.length > 0 && (
          <div className="rounded-lg border-2 border-warning/40 bg-warning/10 p-3 flex gap-2">
            <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-warning-foreground/90 leading-relaxed font-medium">
                  {w}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Étapes synthétiques */}
        <ol className="grid grid-cols-3 gap-2 text-center pt-1">
          {[
            { n: "1", t: "Payer" },
            { n: "2", t: "Capture" },
            { n: "3", t: "Valider" },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-md border border-border bg-background px-2 py-1.5"
            >
              <span
                style={accent ? { color: accent } : undefined}
                className={cn(
                  "block font-display font-bold text-base leading-none",
                  !accent && "text-foreground"
                )}
              >
                {s.n}
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground font-mono mt-0.5">
                {s.t}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
