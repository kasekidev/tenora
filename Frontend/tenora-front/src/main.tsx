import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ─── PWA — Enregistrement du service worker ────────────────────────────────
// Indispensable pour que Chrome propose le bouton "Installer l'app"
// (sans SW : seulement "Ajouter à l'écran d'accueil" = simple raccourci nav).
// Bloqué dans les iframes/preview Lovable pour éviter les caches périmés.
if ("serviceWorker" in navigator) {
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreview =
    location.hostname.includes("lovableproject.com") ||
    location.hostname.includes("lovable.app") && location.hostname.includes("id-preview--");

  if (!inIframe && !isPreview) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  }
}
