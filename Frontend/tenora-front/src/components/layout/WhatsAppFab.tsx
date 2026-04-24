import { useSite } from "@/context/SiteContext";
import { MessageCircle } from "lucide-react";

/**
 * Bouton flottant WhatsApp — visible sur mobile ET desktop.
 * Sur mobile, on le positionne au-dessus de la MobileTabBar (bottom ~76px + safe-area).
 * Sur desktop, bottom-right classique.
 *
 * Performant: CSS only, aucune JS animation lourde, rendu une seule fois.
 * Le numero vient de SiteInit.whatsapp_number (backend), avec fallback vide = composant masque.
 */
export function WhatsAppFab() {
  const { data } = useSite();
  const raw = data?.whatsapp_number?.trim();
  if (!raw) return null;

  // Nettoyage: on ne garde que les chiffres (wa.me accepte que le format international sans +).
  const number = raw.replace(/[^\d]/g, "");
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Bonjour Tenora 👋 j'ai une question"
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Tenora sur WhatsApp"
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:right-6 md:h-16 md:w-16 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] md:bottom-6"
    >
      <MessageCircle className="h-7 w-7 md:h-8 md:w-8" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">WhatsApp</span>
      {/* Pulse discret — respecte prefers-reduced-motion via index.css */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full animate-pulse-glow"
      />
    </a>
  );
}

export default WhatsAppFab;
