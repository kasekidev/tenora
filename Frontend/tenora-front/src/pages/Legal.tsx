import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ShieldCheck, ScrollText, MessageCircle, Lock, RefreshCcw, Mail, ArrowUpRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";

/**
 * /legal — Conditions d'utilisation + Politique de confidentialité.
 * Single page, deux ancres : #conditions, #confidentialite
 */
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
      {/* Header brutaliste */}
      <header className="mb-12 border-b-2 border-border pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-primary text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
          <ScrollText className="size-3.5" /> Mentions légales
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight leading-[0.95]">
          Conditions <span className="text-primary">&</span><br />
          Confidentialité<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-4 max-w-xl">
          La transparence, c'est notre base. Voici comment Tenora fonctionne, ce qu'on protège,
          et ce à quoi vous pouvez vous attendre.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2">
          <a href="#conditions" className="px-3 py-2 border-2 border-border hover:border-primary text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors">
            → Conditions d'utilisation
          </a>
          <a href="#confidentialite" className="px-3 py-2 border-2 border-border hover:border-primary text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors">
            → Politique de confidentialité
          </a>
        </nav>
      </header>

      {/* CONDITIONS D'UTILISATION */}
      <section id="conditions" className="scroll-mt-24 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 grid place-items-center bg-primary text-primary-foreground border-2 border-primary">
            <ScrollText className="size-5" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Conditions d'utilisation
          </h2>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <Block n="01" title="Acceptation">
            En créant un compte ou en passant commande sur Tenora, vous acceptez les présentes conditions
            dans leur intégralité. Si vous n'êtes pas d'accord avec un point, merci de ne pas utiliser le service.
          </Block>

          <Block n="02" title="Nature du service">
            Tenora propose des recharges de jeux (Free Fire, MLBB, etc.), abonnements streaming, ebooks
            et un service d'import (Shein, Alibaba…). Les commandes sont traitées manuellement ou
            automatiquement selon le produit, généralement sous quelques minutes à quelques heures.
          </Block>

          <Block n="03" title="Paiement & livraison">
            Le paiement s'effectue principalement par Mobile Money (Airtel Money, Moov Money, Zamani Cash…).
            La livraison numérique est instantanée après validation. Pour les imports, les délais
            dépendent du fournisseur et vous sont communiqués lors de la commande.
          </Block>

          <Block n="04" title="Remboursements & satisfaction">
            <strong className="text-primary">Toute commande non satisfaite peut être remboursée sur simple demande</strong>,
            tant que le produit n'a pas été consommé/livré ou que le problème nous est imputable
            (mauvaise recharge, retard anormal, produit indisponible, etc.). Contactez-nous via WhatsApp
            avec votre numéro de commande, on traite ça vite et sans bureaucratie.
          </Block>

          <Block n="05" title="Comportement attendu">
            Vous vous engagez à fournir des informations exactes (email, ID de jeu, numéro Mobile Money…).
            Toute tentative de fraude, de paiement frauduleux ou d'utilisation abusive du service entraîne
            la suspension immédiate du compte sans remboursement.
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

          {/* Contact / suggestions */}
          <div className="mt-8 border-2 border-primary bg-primary/5 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold uppercase tracking-wider text-sm mb-1">Une question, une suggestion ?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  On lit tout, on répond vite, et on adore les retours qui nous aident à faire mieux.
                  N'hésitez surtout pas à nous écrire — poliment, on fera de même 😊
                </p>
                {wa && (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest border-2 border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                  >
                    <MessageCircle className="size-4" /> Nous écrire sur WhatsApp <ArrowUpRight className="size-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POLITIQUE DE CONFIDENTIALITÉ */}
      <section id="confidentialite" className="scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 grid place-items-center bg-primary text-primary-foreground border-2 border-primary">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Politique de confidentialité
          </h2>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          {/* Highlight sécurité */}
          <div className="border-2 border-border bg-card p-5 md:p-6 grid md:grid-cols-3 gap-4">
            <SafetyBadge icon={Lock} title="Mots de passe hashés" desc="Stockés via un hash cryptographique à sens unique. Personne — pas même nous — ne peut les lire." />
            <SafetyBadge icon={ShieldCheck} title="Données minimales" desc="On ne collecte que ce qui est strictement nécessaire pour traiter votre commande." />
            <SafetyBadge icon={RefreshCcw} title="Pas de revente" desc="Aucune donnée n'est vendue, louée ou partagée à des fins publicitaires. Jamais." />
          </div>

          <Block n="01" title="Ce qu'on collecte">
            Uniquement le strict nécessaire : votre <strong>email</strong> (pour vous identifier et vous
            envoyer les confirmations), un <strong>numéro de téléphone optionnel</strong> (pour le suivi
            WhatsApp si vous le souhaitez), et les <strong>informations de commande</strong> (ID de jeu,
            adresse de livraison pour les imports…).
          </Block>

          <Block n="02" title="Ce qu'on NE stocke PAS">
            Aucune donnée bancaire (les paiements Mobile Money sont gérés par les opérateurs eux-mêmes).
            Aucun mot de passe en clair : votre mot de passe est <strong>haché</strong> dès la saisie via
            un algorithme cryptographique sécurisé. Personne — administrateurs inclus — n'a accès à votre
            mot de passe en clair. Si vous l'oubliez, on ne peut pas vous le « retrouver », seulement le réinitialiser.
          </Block>

          <Block n="03" title="À quoi ça sert">
            Strictement à : créer votre compte, traiter vos commandes, vous contacter en cas de problème,
            et améliorer le service (statistiques anonymes). Point.
          </Block>

          <Block n="04" title="Avec qui on partage">
            <strong>Personne</strong>, sauf strict besoin opérationnel : par exemple, votre adresse de
            livraison est transmise au transporteur pour les imports. Aucune donnée n'est vendue,
            louée, ni utilisée à des fins publicitaires tierces.
          </Block>

          <Block n="05" title="Sécurité technique">
            Connexion chiffrée (HTTPS) sur tout le site. Mots de passe hachés. Sessions sécurisées par
            jetons. Accès aux données limité à un nombre minimal de personnes habilitées.
          </Block>

          <Block n="06" title="Vos droits">
            Vous pouvez à tout moment : consulter vos données depuis votre profil, demander leur
            modification, ou demander la suppression complète de votre compte (et de toutes les données
            associées) en nous contactant via WhatsApp ou email. On s'exécute dans les meilleurs délais.
          </Block>

          <Block n="07" title="Cookies & traceurs">
            On utilise uniquement les cookies essentiels au fonctionnement du site (session,
            préférences). Pas de tracking publicitaire, pas de revente à des régies tierces.
          </Block>

          <Block n="08" title="Conservation">
            Vos données sont conservées tant que votre compte est actif. À la suppression du compte,
            elles sont effacées sous 30 jours, sauf obligations légales (preuve de transaction).
          </Block>

          {/* Contact */}
          <div className="mt-8 border-2 border-border bg-card p-5 md:p-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Contact confidentialité</p>
                <p className="text-sm font-bold">supporttenora@gmail.com</p>
              </div>
            </div>
            {wa && (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest border-2 border-primary hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
          </div>

          <p className="text-[11px] uppercase tracking-widest text-muted-foreground pt-4 border-t-2 border-border">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
          </p>
        </div>
      </section>
    </div>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <article className="border-l-2 border-border hover:border-primary transition-colors pl-5 py-1">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[10px] text-primary font-bold tracking-widest">{n}</span>
        <h3 className="font-bold uppercase tracking-wider text-sm">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </article>
  );
}

function SafetyBadge({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="space-y-2">
      <div className="size-8 grid place-items-center bg-primary/10 border-2 border-primary text-primary">
        <Icon className="size-4" />
      </div>
      <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
