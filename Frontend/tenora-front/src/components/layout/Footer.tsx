import { Link } from "react-router-dom";
import { TenoraLogo } from "@/components/brand/TenoraLogo";
import { useSite } from "@/context/SiteContext";
import { MessageCircle, MapPin, Mail, ArrowUpRight, Download } from "lucide-react";

export function Footer() {
  const { data } = useSite();
  const wa = data?.whatsapp_number?.replace(/\D/g, "") || "";
  return (
    <footer className="mt-16 border-t-2 border-border bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" aria-hidden />
      <div className="container-app py-14 grid gap-10 md:grid-cols-12 relative">
        <div className="md:col-span-5 space-y-4">
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
              className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest border-2 border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
            >
              <MessageCircle className="size-4" /> Support WhatsApp <ArrowUpRight className="size-4" />
            </a>
          )}
        </div>
        <div className="md:col-span-3">
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-muted-foreground">Naviguer</h4>
          <ul className="space-y-3 text-sm font-semibold">
            <li><Link to="/boutique" className="hover:text-primary transition-colors inline-flex items-center gap-1">Boutique <ArrowUpRight className="size-3.5" /></Link></li>
            <li><Link to="/ebooks" className="hover:text-primary transition-colors inline-flex items-center gap-1">Ebooks <ArrowUpRight className="size-3.5" /></Link></li>
            <li><Link to="/import" className="hover:text-primary transition-colors inline-flex items-center gap-1">Import Shein <ArrowUpRight className="size-3.5" /></Link></li>
            <li><Link to="/mes-commandes" className="hover:text-primary transition-colors inline-flex items-center gap-1">Mes commandes <ArrowUpRight className="size-3.5" /></Link></li>
            <li><Link to="/installer" className="hover:text-primary transition-colors inline-flex items-center gap-1"><Download className="size-3.5" /> Installer l'app</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-muted-foreground">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Niamey, Niger</li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-primary" /> support@tenora.app</li>
          </ul>
        </div>
      </div>
      <div className="border-t-2 border-border py-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        © {new Date().getFullYear()} Tenora — Système opérationnel <span className="inline-block size-1.5 bg-success rounded-full ml-1 animate-pulse" />
      </div>
    </footer>
  );
}
