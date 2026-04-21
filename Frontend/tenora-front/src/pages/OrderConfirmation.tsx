import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSite } from "@/context/SiteContext";

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const product = params.get("product");
  const amount = params.get("amount");
  const method = params.get("method");
  const { data: site } = useSite();
  const wa = site?.whatsapp_number?.replace(/\D/g, "") || "";

  const steps = [
    { title: "Vérification du paiement", desc: "Notre équipe vérifie votre capture (en moyenne 5 à 30 minutes)." },
    { title: "Traitement de la commande", desc: "Activation de l'abonnement ou de la recharge." },
    { title: "Confirmation WhatsApp", desc: "Vous recevrez un message dès la livraison." },
  ];

  return (
    <div className="container-app py-10 md:py-16 max-w-xl">
      <div className="card-elev rounded-3xl p-6 md:p-8 text-center">
        <div className="size-16 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center mb-3 animate-pulse-glow">
          <CheckCircle2 className="size-8" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Commande enregistrée</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">Merci pour votre commande !</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Commande <span className="font-semibold text-foreground">#{orderId}</span> reçue. On s'en occupe.
        </p>

        <dl className="mt-6 divide-y divide-border rounded-2xl bg-muted/40 text-left">
          {product && <Row label="Produit" value={product} />}
          {amount && <Row label="Total" value={amount} valueClass="font-display gradient-text font-bold" />}
          {method && <Row label="Paiement" value={method} />}
          <Row label="Statut" value={<span className="chip bg-warning/15 text-warning">En attente de validation</span>} />
        </dl>

        <div className="mt-6 text-left">
          <p className="font-semibold text-sm mb-2">Prochaines étapes</p>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <div className="size-7 shrink-0 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">{i + 1}</div>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 bg-gradient-primary text-primary-foreground"><Link to="/mes-commandes"><Package className="size-4" /> Mes commandes</Link></Button>
          {wa && (
            <Button asChild variant="outline" className="flex-1 border-whatsapp/40 text-whatsapp hover:bg-whatsapp hover:text-whatsapp-foreground">
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener"><MessageCircle className="size-4" /> Support</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: any; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
