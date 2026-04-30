import { Link } from "react-router-dom";
import { TenoraLogo } from "@/components/brand/TenoraLogo";
import { useSite } from "@/context/SiteContext";
import { MessageCircle, MapPin, Mail, ArrowUpRight, Download, ShieldCheck, ScrollText } from "lucide-react";

export function Footer() {
  const { data } = useSite();
  const wa = data?.whatsapp_number?.replace(/\D/g, "") || "";

  return (
    <footer className="mt-16 border-t-2 border-border bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" aria-hidden />

      {/* Bloc principal */}
      <div className="container-app py-14 grid gap-10 md:gap-8 md:grid-cols-12 relative">
        {/* Brand */}
        <div className="md:col-span-4 space-y-4">
          <TenoraLogo className="text-3xl" />
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Le digital, livré vite au Niger. Recharges jeux, abonnements streaming, ebooks et import.
            Paiement Mobile Money. Support WhatsApp 24/7.
          </p>
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener"
              aria-label="Contacter le support Tenora sur WhatsApp (nouvel onglet)"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest border-2 border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
            >
              <MessageCircle className="size-4" /> Support WhatsApp <ArrowUpRight className="size-4" />
            </a>
          )}
        </div>

        {/* Naviguer */}
        <div className="md:col-span-3">
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-primary">Naviguer</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <FooterLink to="/boutique">Boutique</FooterLink>
            <FooterLink to="/ebooks">Ebooks</FooterLink>
            <FooterLink to="/import">Import Shein</FooterLink>
            <FooterLink to="/mes-commandes">Mes commandes</FooterLink>
            <FooterLink to="/installer" icon={<Download className="size-3.5" />}>Installer l'app</FooterLink>
          </ul>
        </div>

        {/* Légal */}
        <div className="md:col-span-2">
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-primary">Légal</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <FooterLink to="/legal#conditions" icon={<ScrollText className="size-3.5" />}>Conditions</FooterLink>
            <FooterLink to="/legal#confidentialite" icon={<ShieldCheck className="size-3.5" />}>Confidentialité</FooterLink>
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-3">
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-primary">Contact</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 text-primary shrink-0" /> Niamey, Niger
            </li>
            <li className="flex items-center gap-2 text-muted-foreground break-all">
              <Mail className="size-4 text-primary shrink-0" /> supporttenora@gmail.com
            </li>
            {wa && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="size-4 text-primary shrink-0" />
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" aria-label="Contacter Tenora sur WhatsApp (nouvel onglet)" className="hover:text-primary transition-colors">
                  WhatsApp 24/7
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t-2 border-border">
        <div className="container-app py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <p className="flex items-center gap-2">
            © {new Date().getFullYear()} Tenora — Par Nebula inc.
          </p>
          <p className="flex items-center gap-2">
            Système opérationnel
            <span aria-hidden="true" className="inline-block size-1.5 bg-success rounded-full animate-pulse" />
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  to,
  children,
  icon,
}: {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
      >
        {icon}
        {children}
        <ArrowUpRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </Link>
    </li>
  );
}
