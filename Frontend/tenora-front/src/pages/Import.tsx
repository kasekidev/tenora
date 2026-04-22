import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { importsApi, productsApi, type CategoryTree } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Truck, Loader2, Upload, MessageCircle, Check } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { toast } from "sonner";

export default function ImportPage() {
  const { data: site } = useSite();
  const wa = site?.whatsapp_number?.replace(/\D/g, "") || "";

  // ── Catégories : on ne garde QUE les sous-catégories du service `import_export`.
  const { data: tree = [] } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => productsApi.getCategoriesTree().then((r) => r.data),
  });

  const importChoices = tree
    .filter((c: CategoryTree) => c.service_type === "import_export")
    .flatMap((c) =>
      c.subcategories.length > 0
        ? c.subcategories.map((s) => ({ id: s.id, name: s.name }))
        : [{ id: c.id, name: c.name }]
    );

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return toast.error("Choisissez une catégorie.");
    if (!url) return toast.error("Lien de l'article requis.");
    setLoading(true);
    try {
      const r = await importsApi.create({
        category_id: Number(categoryId),
        article_url: url,
        article_description: desc || undefined,
      });
      if (file) {
        try {
          await importsApi.uploadScreenshot(r.data.id, file);
        } catch (err) {
          // L'upload de screenshot ne doit pas bloquer la redirection WhatsApp :
          // l'utilisateur pourra toujours envoyer la capture dans la conversation.
          console.warn("Upload screenshot échoué (non bloquant)", err);
          toast.warning("Capture non envoyée — vous pourrez la joindre dans WhatsApp.");
        }
      }
      setCreatedId(r.data.id);
      toast.success("Demande envoyée — redirection vers WhatsApp…");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Redirection WhatsApp automatique juste après confirmation ─────────────
  // window.open(..., "_blank") au lieu de location.href :
  //   - évite les blocages iOS Safari sur les redirections top-frame post-POST
  //   - laisse la SPA intacte si l'utilisateur revient en arrière
  //   - se comporte comme la logique des articles (Product.tsx)
  useEffect(() => {
    if (createdId && wa) {
      const link = importsApi.getWhatsappLink(createdId);
      const t = setTimeout(() => {
        window.open(link, "_blank", "noopener,noreferrer");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [createdId, wa]);

  if (createdId) {
    return (
      <div className="container-app py-12 max-w-xl">
        <div className="card-elev rounded-2xl p-8 text-center">
          <div className="size-14 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center mb-3">
            <Check className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">Demande #{createdId} reçue</h1>
          <p className="text-muted-foreground mt-2">
            Vous allez être redirigé vers WhatsApp pour finaliser avec notre équipe.
          </p>
          {wa && (
            <Button asChild className="mt-5 bg-whatsapp text-whatsapp-foreground hover:opacity-90">
              <a
                href={importsApi.getWhatsappLink(createdId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" /> Ouvrir WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8 md:py-12 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
          <Truck className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Demande d'import</h1>
          <p className="text-sm text-muted-foreground">
            Shein, Alibaba, Amazon… commandez sans carte internationale.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="card-elev rounded-2xl p-5 md:p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full h-11 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="">Choisir…</option>
            {importChoices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Lien de l'article</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.shein.com/..."
            className="mt-1 w-full h-11 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Description <span className="text-muted-foreground/70">(optionnel)</span>
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Taille, couleur, quantité…"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Capture d'écran <span className="text-muted-foreground/70">(optionnel)</span>
          </label>
          <div className="mt-1 relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center ${
                file ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Upload className="size-5 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-sm">{file ? file.name : "Ajouter une capture"}</p>
            </div>
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full h-12 bg-gradient-primary text-primary-foreground shadow-glow"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />} Envoyer la demande
        </Button>
      </form>
    </div>
  );
}
