import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ShieldCheck, ScrollText, MessageCircle, Lock, RefreshCcw, Mail, ArrowUpRight, Zap, BadgeCheck } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function Legal() {
  const { hash } = useLocation();
  const { data } = useSite();
  const wa = data?.whatsapp_number?.replace(/\D/g, "") || "";

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [hash]);

  return (
    <div className="container-app py-10 md:py-16 max-w-4xl">

      {/* ── HEADER ── */}
      <header className="mb-14 border-b-2 border-border pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-primary bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-5">
          <ScrollText className="size-3.5" /> Mentions légales
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight leading-[0.95]">
          Conditions <span className="text-primary">&</span><br />
          Confidentialité<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-4 max-w-xl leading-relaxed">
          La transparence, c'est notre base. Voici comment Tenora fonctionne,
          ce qu'on protège, et ce à quoi vous pouvez vous attendre.
        </p>

        {/* Raccourcis */}
        <nav className="mt-7 flex flex-wrap gap-3">
          <a
            href="#conditions"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-border hover:border-primary hover:text-primary text-xs font-bold uppercase tracking-wider transition-colors group"
          >
            <ScrollText className="size-3.5 group-hover:text-primary" />
            Conditions d'utilisation
          </a>
          <a
            href="#confidentialite"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-border hover:border-primary hover:text-primary text-xs font-bold uppercase tracking-wider transition-colors group"
          >
            <ShieldCheck className="size-3.5 group-hover:text-primary" />
            Politique de confidentialité
          </a>
        </nav>
      </header>

      {/* ── CONDITIONS D'UTILISATION ── */}
      <section id="conditions" className="scroll-mt-24 mb-20">
        <SectionTitle icon={ScrollText} label="01" title="Conditions d'utilisation" />

        {/* Résumé rapide — le plus important en haut */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <QuickBadge icon={Zap} color="primary" title="Livraison rapide" desc="Quelques minutes à quelques heures selon le produit." />
          <QuickBadge icon={BadgeCheck} color="success" title="Satisfait ou remboursé" desc="Sur simple demande, tant que le produit n'est pas consommé." />
          <QuickBadge icon={MessageCircle} color="amber" title="Support réactif" desc="WhatsApp 24/7 pour toute question ou problème." />
        </div>

        <div className="space-y-0 divide-y-2 divide-border">
          <Block n="01" title="Acceptation">
            En créant un compte ou en passant commande sur Tenora, vous acceptez les présentes conditions
            dans leur intégralité. Si vous n'êtes pas d'accord avec un point, merci de ne pas utiliser le service.
          </Block>

          <Block n="02" title="Nature du service">
            Tenora propose des recharges de jeux (Free Fire, MLBB, etc.), abonnements streaming, ebooks
            et un service d'import (Shein, Alibaba…). Les commandes sont traitées manuellement ou
            automatiquement selon le produit, <strong className="text-foreground">généralement sous quelques minutes à quelques heures</strong>.
          </Block>

          <Block n="03" title="Paiement & livraison">
            Le paiement s'effectue principalement par <strong className="text-foreground">Mobile Money</strong> (Airtel Money, Moov Money, Zamani Cash…).
            La livraison numérique est instantanée après validation. Pour les imports, les délais
            dépendent du fournisseur et vous sont communiqués lors de la commande.
          </Block>

          <Block n="04" title="Remboursements & satisfaction" highlight>
            <strong className="text-primary">Toute commande non satisfaite peut être remboursée sur simple demande</strong>,
            tant que le produit n'a pas été consommé/livré ou que le problème nous est imputable
            (mauvaise recharge, retard anormal, produit indisponible, etc.).{" "}
            Contactez-nous via WhatsApp avec votre numéro de commande,{" "}
            <strong className="text-foreground">on traite ça vite et sans bureaucratie</strong>.
          </Block>

          <Block n="05" title="Comportement attendu">
            Vous vous engagez à fournir des informations exactes (email, ID de jeu, numéro Mobile Money…).
            Toute tentative de fraude, de paiement frauduleux ou d'utilisation abusive du service entraîne
            la <strong className="text-destructive">suspension immédiate du compte sans remboursement</strong>.
          </Block>

          <Block n="06" title="Disponibilité">
            On fait notre maximum pour que le service soit disponible 24/7, mais on ne peut pas garantir
            une absence totale d'interruption (maintenance, problème opérateur, panne réseau…).
            En cas de souci, on prévient sur WhatsApp et la bannière du site.
          </Block>

          <Block n="07" title="Évolution des conditions">
            Ces conditions peuvent évoluer. Les changements importants vous seront notifiés.
            Continuer à utiliser Tenora après une mise à jour vaut acceptation de la nouvelle version.
          </Block>
        </div>

        {/* Contact / suggestions */}
        <div className="mt-10 border-2 border-primary bg-primary/5 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="size-10 grid place-items-center bg-primary text-primary-foreground shrink-0">
              <MessageCircle className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-1">
                Une question, une suggestion ?
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                On lit tout, on répond vite, et on adore les retours qui nous aident à faire mieux.
                N'hésitez surtout pas à nous écrire — poliment, on fera de même 😊
              </p>
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-widest border-2 border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                >
                  <MessageCircle className="size-4" /> Nous écrire sur WhatsApp <ArrowUpRight className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── POLITIQUE DE CONFIDENTIALITÉ ── */}
      <section id="confidentialite" className="scroll-mt-24">
        <SectionTitle icon={ShieldCheck} label="02" title="Politique de confidentialité" />

        {/* Les 3 piliers sécurité — mis en avant */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <SafetyBadge icon={Lock} title="Mots de passe hashés" desc="Stockés via un hash cryptographique à sens unique. Personne — pas même nous — ne peut les lire." />
          <SafetyBadge icon={ShieldCheck} title="Données minimales" desc="On ne collecte que ce qui est strictement nécessaire pour traiter votre commande." />
          <SafetyBadge icon={RefreshCcw} title="Pas de revente" desc="Aucune donnée n'est vendue, louée ou partagée à des fins publicitaires. Jamais." />
        </div>

        <div className="space-y-0 divide-y-2 divide-border">
          <Block n="01" title="Ce qu'on collecte">
            Uniquement le strict nécessaire : votre <strong className="text-foreground">email</strong> (pour vous
            identifier et vous envoyer les confirmations), un <strong className="text-foreground">numéro de téléphone
            optionnel</strong> (pour le suivi WhatsApp si vous le souhaitez), et les <strong className="text-foreground">
            informations de commande</strong> (ID de jeu, adresse de livraison pour les imports…).
          </Block>

          <Block n="02" title="Ce qu'on NE stocke PAS" highlight>
            Aucune donnée bancaire (les paiements Mobile Money sont gérés par les opérateurs eux-mêmes).
            Aucun mot de passe en clair : votre mot de passe est{" "}
            <strong className="text-primary">haché dès la saisie</strong> via un algorithme cryptographique
            sécurisé. Personne — administrateurs inclus — n'a accès à votre mot de passe en clair.
            Si vous l'oubliez, on ne peut pas vous le « retrouver », seulement le réinitialiser.
          </Block>

          <Block n="03" title="À quoi ça sert">
            Strictement à : créer votre compte, traiter vos commandes, vous contacter en cas de problème,
            et améliorer le service (statistiques anonymes). <strong className="text-foreground">Point.</strong>
          </Block>

          <Block n="04" title="Avec qui on partage">
            <strong className="text-foreground">Personne</strong>, sauf strict besoin opérationnel :
            par exemple, votre adresse de livraison est transmise au transporteur pour les imports.
            Aucune donnée n'est vendue, louée, ni utilisée à des fins publicitaires tierces.
          </Block>

          <Block n="05" title="Sécurité technique">
            Connexion chiffrée (<strong className="text-foreground">HTTPS</strong>) sur tout le site.
            Mots de passe hachés. Sessions sécurisées par jetons. Accès aux données limité à un
            nombre minimal de personnes habilitées.
          </Block>

          <Block n="06" title="Vos droits">
            Vous pouvez à tout moment : consulter vos données depuis votre profil, demander leur
            modification, ou demander la <strong className="text-foreground">suppression complète de votre compte</strong>{" "}
            (et de toutes les données associées) en nous contactant via WhatsApp ou email.
            On s'exécute dans les meilleurs délais.
          </Block>

          <Block n="07" title="Cookies & traceurs">
            On utilise uniquement les <strong className="text-foreground">cookies essentiels</strong> au
            fonctionnement du site (session, préférences). Pas de tracking publicitaire,
            pas de revente à des régies tierces.
          </Block>

          <Block n="08" title="Conservation">
            Vos données sont conservées tant que votre compte est actif. À la suppression du compte,
            elles sont effacées sous <strong className="text-foreground">30 jours</strong>, sauf obligations
            légales (preuve de transaction).
          </Block>
        </div>

        {/* Contact confidentialité */}
        <div className="mt-10 border-2 border-border bg-card p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 grid place-items-center bg-primary/10 border-2 border-primary text-primary shrink-0">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                Contact confidentialité
              </p>
              <p className="text-sm font-bold">supporttenora@gmail.com</p>
            </div>
          </div>
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest border-2 border-primary hover:opacity-90 transition-opacity shrink-0"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          )}
        </div>

        <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-6 mt-6 border-t-2 border-border">
          Dernière mise à jour :{" "}
          {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
        </p>
      </section>
    </div>
  );
}

/* ── Composants internes ── */

function SectionTitle({ icon: Icon, label, title }: { icon: any; label: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="relative shrink-0">
        <div className="size-12 grid place-items-center bg-primary text-primary-foreground border-2 border-primary">
          <Icon className="size-6" />
        </div>
        <span className="absolute -top-2 -right-2 font-mono text-[9px] bg-background border-2 border-primary text-primary px-1 font-bold leading-none py-0.5">
          {label}
        </span>
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function Block({
  n,
  title,
  children,
  highlight,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <article
      className={`py-5 px-1 transition-colors ${
        highlight ? "bg-primary/5 px-5 -mx-5 border-l-4 border-primary" : ""
      }`}
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span className="inline-flex items-center justify-center size-5 bg-primary text-primary-foreground font-mono text-[10px] font-bold shrink-0">
          {n}
        </span>
        <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed pl-8">{children}</div>
    </article>
  );
}

function QuickBadge({ icon: Icon, color, title, desc }: { icon: any; color: "primary" | "success" | "amber"; title: string; desc: string }) {
  const colorMap = {
    primary: "bg-primary/10 border-primary/40 text-primary",
    success: "bg-success/10 border-success/40 text-success",
    amber: "bg-amber-500/10 border-amber-500/40 text-amber-500",
  };
  return (
    <div className={`border-2 p-4 space-y-2 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0" />
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function SafetyBadge({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="border-2 border-border bg-card p-4 space-y-2 hover:border-primary transition-colors">
      <div className="size-8 grid place-items-center bg-primary/10 border-2 border-primary text-primary">
        <Icon className="size-4" />
      </div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
