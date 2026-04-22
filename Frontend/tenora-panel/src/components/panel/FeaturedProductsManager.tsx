import { useEffect, useMemo, useState } from "react";
import { Flame, GripVertical, Plus, X, ArrowUp, ArrowDown, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getProducts } from "@/lib/api/products";
import {
  getFeaturedProducts,
  updateFeaturedProducts,
  type FeaturedProduct,
} from "@/lib/api/settings";

interface PanelProduct {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  stock: number;
  category_id?: number;
}

const MAX_FEATURED = 12;

export function FeaturedProductsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<PanelProduct[]>([]);
  const [selected, setSelected] = useState<FeaturedProduct[]>([]);
  const [initialIds, setInitialIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [prodsRes, featRes] = await Promise.all([
          getProducts(),
          getFeaturedProducts(),
        ]);
        const prods = (prodsRes.data ?? []) as PanelProduct[];
        setAllProducts(prods);

        const ids: number[] = featRes.data?.product_ids ?? [];
        setInitialIds(ids);

        // Preserve l'ordre admin en s'appuyant sur les details renvoyes.
        // Si le backend a deja filtre les supprimes, on s'aligne dessus.
        const detailsById = new Map<number, FeaturedProduct>();
        (featRes.data?.products ?? []).forEach((p) => detailsById.set(p.id, p));

        const ordered: FeaturedProduct[] = [];
        ids.forEach((id) => {
          const fromDetails = detailsById.get(id);
          if (fromDetails) {
            ordered.push(fromDetails);
            return;
          }
          const fromList = prods.find((p) => p.id === id);
          if (fromList) {
            ordered.push({
              id: fromList.id,
              name: fromList.name,
              price: fromList.price,
              is_active: fromList.is_active,
              stock: fromList.stock,
            });
          }
        });
        setSelected(ordered);
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger les produits Hot Now");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts
      .filter((p) => !selectedIds.has(p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) || String(p.id).includes(q) : true))
      .slice(0, 50);
  }, [allProducts, selectedIds, query]);

  const dirty = useMemo(() => {
    if (selected.length !== initialIds.length) return true;
    return selected.some((p, i) => p.id !== initialIds[i]);
  }, [selected, initialIds]);

  const add = (p: PanelProduct) => {
    if (selected.length >= MAX_FEATURED) {
      toast.error(`Maximum ${MAX_FEATURED} produits en Hot Now.`);
      return;
    }
    setSelected((arr) => [
      ...arr,
      {
        id: p.id,
        name: p.name,
        price: p.price,
        is_active: p.is_active,
        stock: p.stock,
      },
    ]);
  };

  const remove = (id: number) =>
    setSelected((arr) => arr.filter((p) => p.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    setSelected((arr) => {
      const next = [...arr];
      const target = index + dir;
      if (target < 0 || target >= next.length) return arr;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const ids = selected.map((p) => p.id);
      const r = await updateFeaturedProducts(ids);
      setInitialIds(r.data?.product_ids ?? ids);
      toast.success(r.data?.message ?? "Hot Now mis a jour");
    } catch (e: unknown) {
      const detail =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="brut-card p-6">
        <p className="mono text-xs uppercase tracking-wider text-muted-foreground">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="brackets brut-card p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 border-2 border-primary/40 bg-primary-soft flex items-center justify-center text-primary">
          <Flame className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="display text-xl mb-1">Produits Hot Now</h3>
          <p className="text-sm text-muted-foreground">
            Selectionnez et ordonnez les produits affiches dans la section
            "Hot Now" de la page d'accueil. Si vide, fallback automatique sur
            les 8 plus recents.
          </p>
        </div>
      </div>

      {/* SELECTION ACTUELLE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="eyebrow" style={{ color: "hsl(var(--muted-foreground))" }}>
            Selection actuelle
          </Label>
          <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {selected.length} / {MAX_FEATURED}
          </span>
        </div>

        {selected.length === 0 ? (
          <div className="border-2 border-dashed border-border p-6 text-center">
            <p className="mono text-xs uppercase tracking-wider text-muted-foreground">
              Aucun produit selectionne — fallback sur les plus recents
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {selected.map((p, i) => {
              const inactive = !p.is_active;
              const oos = p.stock === 0;
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 border-2 border-border bg-card p-3",
                    inactive && "opacity-60 border-warning/40"
                  )}
                >
                  <span className="mono text-xs text-muted-foreground w-6 text-center">
                    {i + 1}
                  </span>
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      #{p.id} · {Math.round(p.price).toLocaleString("fr-FR")} F
                      {inactive && " · INACTIF"}
                      {oos && " · RUPTURE"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="h-8 w-8 border-2 border-border flex items-center justify-center hover:border-primary disabled:opacity-30 disabled:hover:border-border"
                      aria-label="Monter"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === selected.length - 1}
                      className="h-8 w-8 border-2 border-border flex items-center justify-center hover:border-primary disabled:opacity-30 disabled:hover:border-border"
                      aria-label="Descendre"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="h-8 w-8 border-2 border-destructive/40 text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Retirer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {selected.some((p) => !p.is_active || p.stock === 0) && (
          <div className="mt-3 flex items-center gap-2 border-2 border-warning/40 bg-warning-soft p-3 text-xs text-warning mono">
            <AlertCircle className="h-4 w-4" />
            Certains produits selectionnes sont inactifs ou en rupture — ils ne
            s'afficheront pas sur le site public.
          </div>
        )}
      </div>

      {/* AJOUTER */}
      <div>
        <Label className="eyebrow mb-3 block" style={{ color: "hsl(var(--muted-foreground))" }}>
          Ajouter un produit
        </Label>
        <div className="relative mb-3">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou ID..."
            className="rounded-none border-2 mono pl-9"
          />
        </div>
        <div className="border-2 border-border max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 mono text-xs uppercase tracking-wider text-muted-foreground text-center">
              Aucun produit disponible
            </p>
          ) : (
            <ul className="divide-y-2 divide-border">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      #{p.id} · {Math.round(p.price).toLocaleString("fr-FR")} F
                      {!p.is_active && " · INACTIF"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => add(p)}
                    disabled={selected.length >= MAX_FEATURED}
                    size="sm"
                    className="rounded-none border-2 border-primary bg-primary text-primary-foreground mono uppercase tracking-wider text-xs hover:bg-primary/90 h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* SAVE */}
      <div className="pt-4 border-t-2 border-border flex items-center gap-3">
        <Button
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-none border-2 border-primary bg-primary text-primary-foreground mono uppercase tracking-wider hover:bg-primary/90"
        >
          {saving ? "..." : "Enregistrer"}
        </Button>
        {dirty && (
          <span className="mono text-[10px] uppercase tracking-wider text-warning">
            // modifications non sauvegardees
          </span>
        )}
      </div>
    </div>
  );
}
