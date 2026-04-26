// Tenora — PaymentLogo
// Composant unifié pour afficher le logo d'un moyen de paiement dans un cadre
// dont la couleur de fond s'adapte exactement à celle du logo SVG, afin que
// le logo "remplisse" visuellement le cadre sans trou ni bord parasite.
//
// Pour USDT (pas de SVG fourni), on rend un emblème typographique stylé.
import { cn } from "@/lib/utils";

type Variant = "tile" | "badge" | "thumb";

interface PaymentBrand {
  /** Image SVG (chemin public). */
  src?: string;
  /** Couleur de fond exacte du logo (utilisée pour le cadre). */
  bg: string;
  /** Couleur d'accent pour bordure / glow. */
  accent: string;
  /** Pour les paiements sans logo image, fallback typographique. */
  fallback?: { glyph: string; color: string };
  /** Padding interne — certains logos ont besoin de moins de marge. */
  pad?: string;
  /** Logo "occupe" déjà le cadre carré complet → padding nul. */
  fullBleed?: boolean;
}

const BRANDS: Record<string, PaymentBrand> = {
  wave:   { src: "/icons/wave.svg",        bg: "#1CC7FE", accent: "#1CC7FE", fullBleed: true },
  airtel: { src: "/icons/airtelMoney.svg", bg: "#FFFFFF", accent: "#E40914", fullBleed: true },
  mynita: { src: "/icons/Mynita.svg",      bg: "#FFFFFF", accent: "#0F172A", fullBleed: true },
  amanata:{ src: "/icons/Amanata.svg",     bg: "#FFFFFF", accent: "#0F172A", fullBleed: true },
  zcash:  { src: "/icons/Zcash.svg",       bg: "#FEE715", accent: "#F4B728", fullBleed: true },
  usdt:   {
    bg: "#26A17B", accent: "#26A17B",
    fallback: { glyph: "₮", color: "#FFFFFF" },
  },
};

interface Props {
  methodId: string;
  /** Nom du moyen de paiement (alt text + fallback texte si méthode inconnue). */
  name: string;
  variant?: Variant;
  className?: string;
}

const SIZE_CLASSES: Record<Variant, string> = {
  tile:  "size-14 sm:size-16",   // sélecteur principal sur la page produit
  badge: "size-9",                // petit badge inline
  thumb: "size-12",               // bande "trust" sur la home
};

export function PaymentLogo({ methodId, name, variant = "tile", className }: Props) {
  const brand = BRANDS[methodId];
  const sizeCls = SIZE_CLASSES[variant];

  if (!brand) {
    // Méthode inconnue → carré neutre avec initiale
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-foreground font-display font-bold border border-border",
          sizeCls,
          className,
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: brand.bg }}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-md ring-1 ring-black/5 shadow-sm shrink-0",
        sizeCls,
        className,
      )}
    >
      {brand.src ? (
        <img
          src={brand.src}
          alt={name}
          loading="lazy"
          className={cn(
            "size-full object-contain",
            brand.fullBleed ? "p-0" : (brand.pad || "p-1.5"),
          )}
        />
      ) : (
        <span
          aria-hidden
          style={{ color: brand.fallback!.color }}
          className="font-display text-3xl font-extrabold leading-none"
        >
          {brand.fallback!.glyph}
        </span>
      )}
    </div>
  );
}

/** Couleur d'accent utilisée par d'autres composants pour matcher la marque. */
export function getPaymentAccent(methodId: string): string | null {
  return BRANDS[methodId]?.accent ?? null;
}
