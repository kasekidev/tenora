// Remplace le contenu de src/main.tsx par ceci.
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ─────────────────────────────────────────────────────────────────────────────
// Service worker — uniquement en production, et JAMAIS dans une iframe
// (preview Lovable/Vercel embed) pour éviter les caches périmés en dev.
// Critère PWA Android : un SW enregistré avec un fetch handler + manifest valide.
// ─────────────────────────────────────────────────────────────────────────────
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  if (!inIframe) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("[SW] register failed:", err));
    });
  } else {
    // En iframe (preview), on désinscrit tout SW résiduel pour ne pas servir
    // d'ancien build.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
}
