import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Upload, ShieldCheck, Zap, Image as ImageIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productsApi, ordersApi, formatXOF, type Order } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: site } = useSite();
  const productId = Number(id);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getProduct(productId).then((r) => r.data),
    enabled: !!productId,
  });

  const [fields, setFields] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderError, setOrderError] = useState("");

  const paymentMethods = (site?.payment_methods || []).filter((m) => m.enabled);
  const wa = site?.whatsapp_number?.replace(/\D/g, "") || "";

  if (isLoading)
    return (
      <div className="container-app py-10">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-3">
            <div className="h-8 w-2/3 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-12 w-1/2 bg-muted rounded" />
            <div className="h-24 w-full bg-muted rounded" />
          </div>
        </div>
      </div>
    );

  if (error || !product) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-muted-foreground mb-4">Produit introuvable.</p>
        <Button asChild variant="outline"><Link to="/boutique"><ArrowLeft className="size-4" /> Retour boutique</Link></Button>
      </div>
    );
  }

  const validateFields = () => {
    if (!product.required_fields) return true;
    for (const f of product.required_fields) {
      if (f.required && !fields[f.key]?.trim()) {
        setOrderError(`Le champ « ${f.label} » est obligatoire.`);
        return false;
      }
      if (f.regex && fields[f.key]) {
        try {
          if (!new RegExp(f.regex).test(fields[f.key])) {
            setOrderError(`Le champ « ${f.label} » est invalide.`);
            return false;
          }
        } catch {/* */ }
      }
    }
    return true;
  };

  const handleCreate = async () => {
    setOrderError("");
    if (!user) {
      navigate(`/connexion?redirect=/produit/${product.id}`);
      return;
    }
    if (!user.is_verified) {
      navigate("/verifier-email");
      return;
    }
    if (product.whatsapp_redirect && wa) {
      const params = new URLSearchParams();
      Object.entries(fields).forEach(([k, v]) => v && params.append(k, v));
      window.open(productsApi.getWhatsappLink(product.id, params), "_blank");
      return;
    }
    if (!validateFields()) return;
    if (!paymentMethod) {
      setOrderError("Choisissez un moyen de paiement.");
      return;
    }
    setCreating(true);
    try {
      const r = await ordersApi.create({
        product_id: product.id,
        quantity: 1,
        customer_info: fields,
        payment_method: paymentMethod,
      });
      setOrder(r.data);
    } catch (e: any) {
      setOrderError(e?.response?.data?.detail || "Une erreur est survenue.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async () => {
    if (!order || !file) return;
    setUploading(true);
    try {
      await ordersApi.uploadScreenshot(order.id, file);
      toast.success("Capture envoyée — votre commande est en cours de validation.");
      const method = paymentMethods.find((m) => m.id === order.payment_method)?.name || order.payment_method || "";
      navigate(
        `/confirmation?orderId=${order.id}&product=${encodeURIComponent(product.name)}&amount=${encodeURIComponent(formatXOF(order.total_price))}&method=${encodeURIComponent(method)}`
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Échec de l'envoi de la capture.");
    } finally {
      setUploading(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);

  return (
    <div className="container-app py-6 md:py-10">
      <Link to="/boutique" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="size-4" /> Retour boutique
      </Link>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        {/* IMAGE */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden card-elev">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground"><ImageIcon className="size-16 opacity-30" /></div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="chip bg-success/15 text-success border border-success/30"><Check className="size-3" /> En stock</span>
            <span className="chip bg-primary/15 text-primary border border-primary/30"><Zap className="size-3" /> Traitement &lt; 30 min</span>
            <span className="chip bg-muted text-muted-foreground border border-border"><ShieldCheck className="size-3" /> Paiement sécurisé</span>
          </div>
        </div>

        {/* INFO + ACTION */}
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>
            {product.description && <p className="text-muted-foreground mt-2">{product.description}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl md:text-4xl font-bold gradient-text">
              {formatXOF(product.final_price ?? product.price)}
            </span>
            {product.discount_percent ? (
              <>
                <span className="text-muted-foreground line-through">{formatXOF(product.price)}</span>
                <span className="chip bg-destructive text-destructive-foreground font-bold">-{product.discount_percent}%</span>
              </>
            ) : null}
          </div>

          <div className="card-elev rounded-2xl p-4 md:p-5 space-y-4">
            {!order ? (
              <>
                {orderError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm px-3 py-2">{orderError}</div>}
                {product.required_fields && product.required_fields.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold text-sm">Informations requises</p>
                    {product.required_fields.map((f) => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-muted-foreground">
                          {f.label}{f.required && <span className="text-destructive"> *</span>}
                        </label>
                        <input
                          value={fields[f.key] || ""}
                          onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder || ""}
                          className="mt-1 w-full h-11 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {!product.whatsapp_redirect && paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Moyen de paiement</p>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-left transition",
                            paymentMethod === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                          )}
                        >
                          <span className="text-xl">{m.icon}</span>
                          <span className="text-sm font-medium">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  size="lg"
                  className="w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : product.whatsapp_redirect ? <MessageCircle className="size-4" /> : <Zap className="size-4" />}
                  {product.whatsapp_redirect ? "Continuer sur WhatsApp" : "Commander maintenant"}
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-success/10 border border-success/30 text-success text-sm px-3 py-2 flex items-center gap-2">
                  <Check className="size-4" /> Commande #{order.id} créée. Réglez puis envoyez la capture.
                </div>

                {selectedMethod && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-semibold mb-1">{selectedMethod.icon} {selectedMethod.name}</p>
                    <p className="text-muted-foreground whitespace-pre-line">{selectedMethod.instructions}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold">Capture du paiement</label>
                  <div className="mt-2 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className={cn("border-2 border-dashed rounded-lg p-6 text-center", file ? "border-primary bg-primary/5" : "border-border")}>
                      <Upload className="size-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">{file ? file.name : "Cliquez pour choisir une capture"}</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, max ~5MB</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleUpload} disabled={!file || uploading} size="lg" className="w-full h-12 bg-gradient-primary text-primary-foreground">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Valider ma commande
                </Button>
              </>
            )}
          </div>

          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener"
              className="block text-center text-sm text-muted-foreground hover:text-whatsapp"
            >
              Une question ? <span className="underline">Contactez-nous sur WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
