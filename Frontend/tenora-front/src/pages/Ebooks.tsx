import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, Check, Sparkles, Upload, X, Copy, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ebooksApi, ordersApi, formatXOF, resolveAssetUrl, type Ebook, type PaymentMethod } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { cn } from "@/lib/utils";

export default function Ebooks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: site } = useSite();

  const { data: ebooks = [], isLoading } = useQuery({
    queryKey: ["ebooks"],
    staleTime: 5 * 60_000,
    queryFn: () => ebooksApi.list().then((r) => r.data),
});

  const { data: myOrders = [] } = useQuery({
    queryKey: ["orders", "my"],          // ← même clé que Orders.tsx
    enabled: !!user,
    staleTime: 30_000,
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
});

  const purchasedIds = useMemo(
    () => new Set(myOrders.filter((o) => o.status === "completed").map((o) => o.product_id)),
    [myOrders]
  );

  const [selected, setSelected] = useState<Ebook | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  async function handleDownload(eb: Ebook) {
    if (!user) {
      toast.error("Connectez-vous pour télécharger.");
      navigate("/connexion");
      return;
    }
    setDownloading(eb.id);
    try {
      const res = await ebooksApi.download(eb.id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.detail || "Erreur lors du téléchargement.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${eb.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Téléchargement démarré !");
    } catch {
      toast.error("Impossible de télécharger le fichier.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero">
        <div className="absolute inset-0 bg-grid opacity-[0.05]" aria-hidden />
        <div className="container-app relative py-12 md:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-4 animate-fade-up">
            <span className="chip bg-secondary/15 text-secondary border border-secondary/30 mx-auto">
              <Sparkles className="size-3.5" /> Bibliothèque digitale
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Développez vos <span className="gradient-text">compétences</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Ressources digitales sélectionnées. Achetez une fois, téléchargez pour toujours.
            </p>
          </div>
        </div>
      </section>

      <section className="container-app py-10 md:py-14">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-elev rounded-2xl overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : ebooks.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 space-y-4">
            <BookOpen className="size-14 mx-auto text-muted-foreground" />
            <h2 className="font-display text-xl font-bold">Aucun ebook disponible</h2>
            <p className="text-sm text-muted-foreground">
              Revenez bientôt — de nouveaux titres arrivent régulièrement.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ebooks.map((eb) => {
              const owned = purchasedIds.has(eb.id);
              const cover = resolveAssetUrl(eb.image_url || eb.image_path);
              return (
                <article
                  key={eb.id}
                  className="group card-elev rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 transition-all hover:-translate-y-0.5"
                >
                  <button
                    onClick={() => setSelected(eb)}
                    className="relative h-56 overflow-hidden bg-muted text-left"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={eb.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <BookOpen className="size-12" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 chip bg-background/80 backdrop-blur text-foreground border border-border">
                      PDF
                    </span>
                    {owned && (
                      <span className="absolute top-3 right-3 chip bg-success/90 text-success-foreground">
                        <Check className="size-3" /> Acheté
                      </span>
                    )}
                  </button>

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h3 className="font-display font-bold text-lg leading-tight line-clamp-2">{eb.name}</h3>
                    {eb.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{eb.description}</p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                      <div className="space-y-0.5">
                        {eb.discount_percent ? (
                          <span className="block text-xs text-muted-foreground line-through">
                            {formatXOF(eb.price)}
                          </span>
                        ) : null}
                        <span className="font-display text-xl font-bold gradient-text">
                          {formatXOF(eb.final_price)}
                        </span>
                      </div>
                      {owned ? (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(eb)}
                          disabled={downloading === eb.id}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          <Download className="size-4" />
                          {downloading === eb.id ? "..." : "Télécharger"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelected(eb)}
                          className="bg-gradient-primary text-primary-foreground"
                        >
                          Acheter
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <EbookPurchaseDialog
        ebook={selected}
        owned={selected ? purchasedIds.has(selected.id) : false}
        onClose={() => setSelected(null)}
        onDownload={handleDownload}
        downloading={downloading}
        paymentMethods={site?.payment_methods?.filter((p) => p.enabled) ?? []}
      />
    </div>
  );
}

/* ============================== Purchase Dialog ============================== */

function EbookPurchaseDialog({
  ebook,
  owned,
  onClose,
  onDownload,
  downloading,
  paymentMethods,
}: {
  ebook: Ebook | null;
  owned: boolean;
  onClose: () => void;
  onDownload: (e: Ebook) => void;
  downloading: number | null;
  paymentMethods: PaymentMethod[];
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [info, setInfo] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (ebook) {
      setInfo({});
      setMethod(null);
      setError("");
      setOrderId(null);
      setFile(null);
    }
  }, [ebook?.id]);

  if (!ebook) return null;

  const cover = resolveAssetUrl(ebook.image_url || ebook.image_path);
  const formattedInstructions =
    method?.instructions
      ?.replace(/\{amount\}/g, formatXOF(ebook.final_price))
      ?.replace(/#\{order_id\}/g, orderId ? `#${orderId}` : "#[en attente]")
      ?.replace(/\{order_id\}/g, orderId ? String(orderId) : "[en attente]") ?? "";

  async function copyInstructions() {
    if (!formattedInstructions) return;
    await navigator.clipboard.writeText(formattedInstructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function submit() {
    if (!ebook || !method) return;
    if (!user) {
      toast.error("Connectez-vous pour acheter.");
      navigate("/connexion");
      return;
    }
    for (const f of ebook.required_fields ?? []) {
      if (f.required && !info[f.key]?.trim()) {
        setError(`Le champ "${f.label}" est obligatoire.`);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const res = await ordersApi.create({
        product_id: ebook.id,
        quantity: 1,
        customer_info: info,
        payment_method: method.id,
      });
      setOrderId(res.data.id);
      toast.success("Commande créée — joignez votre reçu.");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la commande.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadReceipt() {
    if (!file || !orderId) return;
    setUploading(true);
    try {
      await ordersApi.uploadScreenshot(orderId, file);
      onClose();
      navigate(
        `/confirmation?id=${orderId}&product=${encodeURIComponent(ebook!.name)}&amount=${encodeURIComponent(
          formatXOF(ebook!.final_price)
        )}`
      );
    } catch {
      toast.error("Erreur lors de l'envoi du reçu.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={!!ebook} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0 max-h-[92vh] overflow-y-auto">
        {cover && (
          <div className="relative h-48 md:h-56 overflow-hidden">
            <img src={cover} alt={ebook.name} className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}
        <div className="p-6 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Ebook</p>
            <DialogTitle className="font-display text-2xl">{ebook.name}</DialogTitle>
            <DialogDescription className="sr-only">Détails et achat de l'ebook</DialogDescription>
          </DialogHeader>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-2xl font-bold gradient-text">{formatXOF(ebook.final_price)}</span>
            {ebook.discount_percent ? (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatXOF(ebook.price)}</span>
                <span className="chip bg-destructive/15 text-destructive">
                  -{Math.round(ebook.discount_percent)}%
                </span>
              </>
            ) : null}
          </div>

          {ebook.description && <p className="text-sm text-muted-foreground">{ebook.description}</p>}

          <ul className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            {["Fichier PDF téléchargeable", "Accès à vie après achat", "Lisible sur tous appareils"].map((i) => (
              <li key={i} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-success shrink-0" /> {i}
              </li>
            ))}
          </ul>

          <div className="border-t border-border" />

          {owned ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-success/10 border border-success/30 text-success px-4 py-3 text-sm flex items-center gap-2">
                <Check className="size-4" /> Vous possédez déjà cet ebook.
              </div>
              <Button
                onClick={() => onDownload(ebook)}
                disabled={downloading === ebook.id}
                className="w-full bg-success text-success-foreground hover:bg-success/90 h-11"
              >
                <Download className="size-4" />
                Télécharger le PDF
              </Button>
            </div>
          ) : orderId ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/10 border border-primary/30 text-primary px-4 py-3 text-sm flex items-center gap-2">
                <Check className="size-4" /> Commande #{orderId} créée
              </div>
              {method && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{method.icon} {method.name}</span>
                    <button
                      onClick={copyInstructions}
                      className="text-xs px-2.5 py-1 rounded-md bg-background border border-border hover:bg-muted inline-flex items-center gap-1.5"
                    >
                      <Copy className="size-3" /> {copied ? "Copié" : "Copier"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono">
                    {formattedInstructions}
                  </pre>
                </div>
              )}
              <div>
                <Label className="text-sm">Joindre votre reçu (recommandé)</Label>
                <label className="mt-2 flex items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer text-sm text-muted-foreground transition">
                  <Upload className="size-4" />
                  {file ? file.name : "Glisser ou cliquer pour téléverser une image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    navigate(`/confirmation?id=${orderId}`);
                  }}
                >
                  Passer
                </Button>
                <Button
                  className="flex-1 bg-gradient-primary text-primary-foreground"
                  disabled={!file || uploading}
                  onClick={uploadReceipt}
                >
                  {uploading ? "Envoi..." : "Envoyer le reçu"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {ebook.required_fields?.length ? (
                <div className="space-y-3">
                  {ebook.required_fields.map((f) => (
                    <div key={f.key}>
                      <Label className="text-sm">
                        {f.label} {f.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        value={info[f.key] || ""}
                        placeholder={f.placeholder || ""}
                        onChange={(e) => setInfo({ ...info, [f.key]: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold mb-2">Mode de paiement</p>
                {paymentMethods.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun mode de paiement disponible.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setMethod(pm)}
                        className={cn(
                          "relative rounded-xl border-2 px-3 py-3 text-left text-sm transition",
                          method?.id === pm.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <span className="text-lg">{pm.icon}</span>
                        <p className="font-medium text-xs mt-1">{pm.name}</p>
                        {method?.id === pm.id && (
                          <Check className="absolute top-2 right-2 size-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {method && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Instructions
                    </span>
                    <button
                      onClick={copyInstructions}
                      className="text-xs px-2.5 py-1 rounded-md bg-background border border-border hover:bg-muted inline-flex items-center gap-1.5"
                    >
                      <Copy className="size-3" /> {copied ? "Copié" : "Copier"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono">
                    {formattedInstructions}
                  </pre>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full h-11 bg-gradient-primary text-primary-foreground"
                disabled={loading || !method}
                onClick={submit}
              >
                <ShoppingBag className="size-4" />
                {loading ? "Création..." : `Acheter — ${formatXOF(ebook.final_price)}`}
              </Button>
              {!method && (
                <p className="text-xs text-center text-muted-foreground">
                  ↑ Choisissez un mode de paiement pour continuer
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
