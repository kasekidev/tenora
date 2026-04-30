import { useEffect, useState } from "react";
import { useSite } from "@/context/SiteContext";
import { Megaphone, X } from "lucide-react";

const STORAGE_KEY = "tenora.announcement.dismissed";

export function AnnouncementBar() {
  const { data } = useSite();
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      /* sessionStorage indisponible (mode privé strict) — on ignore */
    }
  }, []);

  if (!data) return null;

  // En mode maintenance, le MaintenanceGate prend le relais et remplace toute l'UI.
  // On n'affiche donc rien ici (évite le double bandeau).
  if (data.maintenance) return null;

  if (!data.announcement?.enabled || !data.announcement.text) return null;

  // Clé d'identité : si le texte change, on ré-affiche même si déjà dismiss.
  const announcementKey = data.announcement.text;
  if (dismissed === announcementKey) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, announcementKey);
    } catch {
      /* ignore */
    }
    setDismissed(announcementKey);
  };

  return (
    <div
      role="region"
      aria-label="Annonce"
      aria-live="polite"
      className="relative bg-primary text-primary-foreground text-[11px] sm:text-sm font-bold uppercase tracking-widest py-2 pl-4 pr-10 sm:px-4 flex items-center justify-center gap-2 border-b-2 border-foreground/10 pt-safe"
    >
      <Megaphone aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate text-center">{data.announcement.text}</span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fermer l'annonce"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-primary-foreground/10 active:bg-primary-foreground/20 transition-colors rounded-sm"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
