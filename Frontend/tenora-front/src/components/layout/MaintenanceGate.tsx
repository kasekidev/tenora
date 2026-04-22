import { ReactNode } from "react";
import { useSite } from "@/context/SiteContext";
import Maintenance from "@/pages/Maintenance";

/**
 * MaintenanceGate — court-circuite TOUT le routing applicatif lorsque
 * `siteInit.maintenance === true`. Aucune route, aucun layout, aucune
 * navigation possible : seule la page Maintenance est rendue.
 *
 * Règle produit : "tout le monde bloqué" (même un éventuel admin connecté).
 * Pour reprendre la main, désactiver le flag depuis le backoffice.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { data, loading } = useSite();

  // Premier chargement : on évite un flash en n'affichant rien tant qu'on
  // ne sait pas si le site est en maintenance.
  if (!data && loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="size-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data?.maintenance) {
    return <Maintenance />;
  }

  return <>{children}</>;
}