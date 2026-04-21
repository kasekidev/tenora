import { useSite } from "@/context/SiteContext";
import { Megaphone, Wrench } from "lucide-react";

export function AnnouncementBar() {
  const { data } = useSite();
  if (!data) return null;
  if (data.maintenance) {
    return (
      <div className="bg-warning text-warning-foreground text-center text-xs sm:text-sm font-bold uppercase tracking-widest py-2 px-4 flex items-center justify-center gap-2 border-b-2 border-foreground/10">
        <Wrench className="size-4" />
        Site en maintenance — certaines fonctionnalités peuvent être indisponibles.
      </div>
    );
  }
  if (data.announcement?.enabled && data.announcement.text) {
    return (
      <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm font-bold uppercase tracking-widest py-2 px-4 flex items-center justify-center gap-2 border-b-2 border-foreground/10">
        <Megaphone className="size-4 shrink-0" />
        <span className="truncate">{data.announcement.text}</span>
      </div>
    );
  }
  return null;
}
