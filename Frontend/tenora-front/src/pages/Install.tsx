import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Share,
  Plus,
  Smartphone,
  CheckCircle2,
  Zap,
  Wifi,
  Bell,
  ArrowLeft,
  Apple,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Type minimal pour l'event beforeinstallprompt (Chromium).
 * Pas exposé dans les types DOM standards.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): "android" | "ios" | "desktop" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|mac|linux/.test(ua)) return "desktop";
  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform] = useState(detectPlatform);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: "Ouverture instantanée", desc: "Lancement direct depuis ton écran d'accueil, sans Chrome." },
    { icon: Wifi, title: "Connexion légère", desc: "Optimisé pour les réseaux 3G/4G du Niger." },
    { icon: Smartphone, title: "Plein écran", desc: "Comme une vraie app native, pas de barres de navigateur." },
    { icon: Bell, title: "Notifications (bientôt)", desc: "On te tient au courant de tes commandes." },
  ];

  return (
    <div className="container-app py-8 md:py-12 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="size-4" /> Retour à l'accueil
      </Link>

      {/* HEADER */}
      <div className="mb-8 border-b-2 border-border pb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 font-mono">// App</p>
        <h1 className="font-display text-5xl md:text-7xl font-bold uppercase leading-none">
          Installer<br />
          <span className="text-transparent bg-clip-text bg-gradient-primary">Tenora</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-xl">
          Ajoute Tenora à ton écran d'accueil. Aucun téléchargement depuis le Play Store, aucun compte Google requis. Léger, rapide, sans pub.
        </p>
      </div>

      {/* STATUS / CTA */}
      {installed ? (
        <div className="brut-card p-6 md:p-8 mb-8 border-success">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="size-10 text-success shrink-0" />
            <div>
              <h2 className="font-display text-3xl uppercase font-bold mb-1">App installée ✓</h2>
              <p className="text-sm text-muted-foreground">
                Tenora est déjà sur ton appareil. Lance-la depuis ton écran d'accueil pour le meilleur ressenti.
              </p>
            </div>
          </div>
        </div>
      ) : platform === "android" && deferredPrompt ? (
        <div className="brut-card p-6 md:p-8 mb-8 hover:border-primary">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
            <div>
              <h2 className="font-display text-3xl uppercase font-bold mb-1">Prêt à installer</h2>
              <p className="text-sm text-muted-foreground">Un clic et c'est plié.</p>
            </div>
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground border-2 border-primary uppercase tracking-wider font-bold text-base h-14 px-8"
            >
              <Download className="size-5" /> Installer maintenant
            </Button>
          </div>
        </div>
      ) : platform === "ios" ? (
        <div className="brut-card p-6 md:p-8 mb-8 hover:border-accent">
          <div className="flex items-start gap-3 mb-4">
            <Apple className="size-8 text-accent shrink-0" />
            <div>
              <h2 className="font-display text-3xl uppercase font-bold">Installation iOS</h2>
              <p className="text-sm text-muted-foreground">Suis ces 3 étapes dans Safari :</p>
            </div>
          </div>
          <ol className="space-y-3">
            <Step n="1" icon={Share} text="Touche le bouton Partager en bas de Safari" />
            <Step n="2" icon={Plus} text="Choisis « Sur l'écran d'accueil »" />
            <Step n="3" icon={CheckCircle2} text="Confirme avec « Ajouter » en haut à droite" />
          </ol>
        </div>
      ) : platform === "android" ? (
        <div className="brut-card p-6 md:p-8 mb-8">
          <h2 className="font-display text-3xl uppercase font-bold mb-3">Installation Android</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ouvre cette page dans <strong className="text-foreground">Chrome</strong>, puis :
          </p>
          <ol className="space-y-3">
            <Step n="1" icon={Smartphone} text="Touche les 3 points ⋮ en haut à droite" />
            <Step n="2" icon={Plus} text="Choisis « Ajouter à l'écran d'accueil »" />
            <Step n="3" icon={CheckCircle2} text="Confirme avec « Installer »" />
          </ol>
        </div>
      ) : (
        <div className="brut-card p-6 md:p-8 mb-8">
          <h2 className="font-display text-3xl uppercase font-bold mb-2">Installation desktop</h2>
          <p className="text-sm text-muted-foreground">
            Sur Chrome / Edge, regarde l'icône <Download className="inline size-4" /> dans la barre d'adresse, ou ouvre le menu et clique sur « Installer Tenora ».
          </p>
        </div>
      )}

      {/* FEATURES */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3 font-mono">// Pourquoi installer</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="brut-card p-5 hover:border-primary/60">
              <f.icon className="size-6 text-primary mb-3" />
              <h3 className="font-display font-bold text-2xl uppercase leading-none mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({ n, icon: Icon, text }: { n: string; icon: any; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="shrink-0 size-9 border-2 border-primary text-primary font-display text-xl font-bold flex items-center justify-center">
        {n}
      </span>
      <Icon className="size-5 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium">{text}</span>
    </li>
  );
}