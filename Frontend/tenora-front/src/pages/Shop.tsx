import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, ChevronDown, ShoppingBag } from "lucide-react";
import { productsApi, type CategoryTree } from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Shop() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  // IMPORTANT — on n'active le scroll interne (deux colonnes indépendantes)
  // QUE sur desktop. Sur mobile, on laisse la page entière scroller
  // naturellement, sinon le touch-action interne entre en conflit avec le
  // scroll vertical du body et il faut viser les bords de l'écran.
  const scrollPaneClass =
    "md:min-h-0 md:h-full md:overflow-y-auto md:overscroll-contain md:[overscroll-behavior:contain] md:[touch-action:pan-y]";

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  const { data: tree = [], isLoading: loadingCats } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () =>
      productsApi.getCategoriesTree().then((r) =>
        // Exclure les catégories "import_export" — elles ont leur propre page /import.
        r.data.filter((c) => c.service_type !== "import_export")
      ),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["shop", { selectedId, q: debounced }],
    queryFn: () =>
      productsApi
        .getShopProducts({
          category_id: selectedId ?? undefined,
          q: debounced || undefined,
        })
        .then((r) => r.data),
  });

  const currentTitle = useMemo(() => {
    if (debounced) return `Recherche : « ${debounced} »`;
    if (!selectedId) return "Tous les produits";
    for (const c of tree) {
      if (c.id === selectedId) return c.name;
      const sub = c.subcategories.find((s) => s.id === selectedId);
      if (sub) return `${c.name} › ${sub.name}`;
    }
    return "Boutique";
  }, [selectedId, debounced, tree]);

  const Sidebar = (
    <div className="space-y-1">
      <button
        onClick={() => {
          setSelectedId(null);
          setFilterOpen(false);
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-widest border-2 transition",
          selectedId === null ? "border-primary text-primary bg-primary/10" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        <span className="inline-flex items-center gap-2"><ShoppingBag className="size-4" /> Tous</span>
      </button>
      {loadingCats && <p className="px-3 py-2 text-xs text-muted-foreground">Chargement…</p>}
      {tree.map((cat: CategoryTree) => {
        const isOpen = expanded.has(cat.id);
        return (
          <div key={cat.id}>
            <button
              onClick={() => {
                const n = new Set(expanded);
                isOpen ? n.delete(cat.id) : n.add(cat.id);
                setExpanded(n);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-muted transition border-2 border-transparent"
            >
              <span>{cat.name}</span>
              <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="ml-3 mt-0.5 mb-1 pl-3 border-l-2 border-border space-y-0.5">
                {cat.subcategories.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">—</p>
                )}
                {cat.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedId(sub.id);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-semibold transition border-2",
                      selectedId === sub.id ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container-app py-6 md:py-8 md:h-[calc(100vh-4rem)] md:overflow-hidden md:flex md:flex-col">
      {/* Page header brutalist */}
      <div className="mb-6 md:mb-6 border-b-2 border-border pb-5 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 font-mono">// Catalogue</p>
        <h1 className="font-display text-5xl md:text-7xl font-bold uppercase leading-none">{currentTitle}</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mt-3">
          {products.length} résultat{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
        </p>
      </div>

      {/*
        Layout : deux colonnes avec scroll INDÉPENDANT.
        - hauteur fixée au viewport (moins l'offset de la navbar/header)
        - chaque colonne a son propre overflow-y-auto + overscroll-contain
          → la molette ne "bubble" pas d'une colonne à l'autre ni vers la page.
      */}
      <div className="grid md:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-10 min-h-0 flex-1">
        {/* Sidebar desktop : scroll local */}
        <aside className={cn("hidden md:block pr-2 -mr-2", scrollPaneClass)}>
          <h2 className="font-display font-bold text-2xl uppercase mb-3">Catégories</h2>
          {Sidebar}
        </aside>

        {/* Produits : scroll local */}
        <main className={cn("min-h-0 md:pr-1", scrollPaneClass)}>
          {/* Topbar */}
          <div className="flex items-center gap-2 mb-5">
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden border-2 uppercase tracking-wider text-xs font-bold">
                  <SlidersHorizontal className="size-4" /> Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] max-w-sm overflow-y-auto border-r-2">
                <h2 className="font-display font-bold text-3xl uppercase mb-4">Catégories</h2>
                {Sidebar}
              </SheetContent>
            </Sheet>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit…"
                className="w-full h-11 pl-10 pr-10 bg-input border-2 border-border text-sm font-medium focus:outline-none focus:border-primary transition-colors"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted animate-pulse border-2 border-border" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 brut-card">
              <ShoppingBag className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-display font-bold text-3xl uppercase">Aucun produit</p>
              <p className="text-sm text-muted-foreground mt-1">Essayez une autre catégorie ou un autre terme.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {products.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-up">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
