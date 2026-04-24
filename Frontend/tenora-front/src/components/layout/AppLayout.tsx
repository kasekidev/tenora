import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";
import { AnnouncementBar } from "./AnnouncementBar";
import { WhatsAppFab } from "./WhatsAppFab";
import { useEffect } from "react";

export function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-dvh flex flex-col bg-background overflow-x-hidden px-safe">
      <AnnouncementBar />
      <Navbar />
      {/* pb-24 mobile = espace pour la tab bar fixe (~64px) + safe area iOS/Android */}
      <main className="flex-1 min-h-0 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <WhatsAppFab />
    </div>
  );
}

