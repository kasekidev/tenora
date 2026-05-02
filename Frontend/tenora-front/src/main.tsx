import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Applique le thème sauvegardé avant le premier rendu (évite le flash).
// Le thème sombre est le thème par défaut — aucune classe = sombre.
try {
  const saved = localStorage.getItem("tenora-theme");
  if (saved === "light") {
    document.documentElement.classList.add("light");
  } else if (!saved) {
    // Première visite : on ancre explicitement le sombre
    localStorage.setItem("tenora-theme", "dark");
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreview =
    location.hostname.includes("lovableproject.com") ||
    location.hostname.includes("lovable.app") && location.hostname.includes("id-preview--");

  if (!inIframe && !isPreview) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  }
}
