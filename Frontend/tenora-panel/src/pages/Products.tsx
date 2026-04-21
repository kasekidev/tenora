import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, ImageIcon, Package } from "lucide-react";
import { PageHeader } from "@/components/panel/PageHeader";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { DataCard, DataCardHeader, DataCardContent } from "@/components/panel/DataCard";
import { SkeletonRow } from "@/components/panel/PanelSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api/client";

interface Product {
  id: number; name: string; description?: string; price: number;
  stock?: number | null; is_active: boolean;
  image_path?: string; category_id?: number; category_name?: string;
  whatsapp_redirect?: boolean;
}
interface Cat { id: number; name: string; }

const empty = {
  name: "", price: 0, description: "", category_id: "",
  stock: "", is_active: true, whatsapp_redirect: false,
};

const imgUrl = (p?: string) => {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  return `${base}/uploads/${p}`;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [delDialog, setDelDialog] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p.data || []);
      setCats(c.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q);
  });

  const fmt = (n: number) => `${n?.toLocaleString("fr-FR")} F`;

  const openCreate = () => {
    setEditing(null); setForm(empty);
    setPendingImage(null); setImagePreview(null);
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || "", price: p.price || 0, description: p.description || "",
      category_id: p.category_id?.toString() || "",
      stock: p.stock?.toString() || "",
      is_active: p.is_active ?? true,
      whatsapp_redirect: p.whatsapp_redirect ?? false,
    });
    setPendingImage(null);
    setImagePreview(p.image_path ? imgUrl(p.image_path) : null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        is_active: form.is_active,
        whatsapp_redirect: form.whatsapp_redirect,
        price: Number(form.price) || 0,
        category_id: form.category_id ? Number(form.category_id) : null,
        stock: form.stock ? Number(form.stock) : null,
      };
      if (editing) {
        await updateProduct(editing.id, payload);
        if (pendingImage) await uploadProductImage(editing.id, pendingImage);
        toast.success("Produit mis a jour");
      } else {
        const { data } = await createProduct(payload);
        if (pendingImage && data?.id) await uploadProductImage(data.id, pendingImage);
        toast.success("Produit cree");
      }
      setShowForm(false);
      load();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete.id);
      toast.success("Produit supprime");
      load();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDelDialog(false); setToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Catalogue" title="Produits" subtitle={`// ${products.length} produits`}>
        <Button onClick={openCreate} className="h-9 rounded-none border-2 border-primary bg-primary text-primary-foreground mono uppercase tracking-wider text-xs hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Nouveau
        </Button>
      </PageHeader>

      <DataCard>
        <DataCardHeader>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 h-9 rounded-none border-2 mono text-xs" />
          </div>
          <span className="chip border-border ml-auto">{filtered.length}</span>
        </DataCardHeader>

        <DataCardContent>
          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-8 w-8 mb-2" />
              <p className="text-sm mono">// Aucun produit</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                  {p.image_path ? (
                    <img src={imgUrl(p.image_path)} alt={p.name} className="h-12 w-12 object-cover border-2 border-border shrink-0" />
                  ) : (
                    <div className="h-12 w-12 border-2 border-border bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.category_name && (
                        <span className="chip border-tertiary/40 text-tertiary bg-tertiary-soft">{p.category_name}</span>
                      )}
                      {p.stock != null && (
                        <span className={cn(
                          "chip",
                          p.stock === 0 ? "border-destructive/40 text-destructive" :
                          p.stock < 5 ? "border-warning/40 text-warning" :
                          "border-success/40 text-success"
                        )}>
                          {p.stock} stk
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="display text-lg text-primary">{fmt(p.price)}</p>
                  </div>
                  <StatusBadge status={p.is_active ? "active" : "inactive"} />
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-none hover:bg-primary hover:text-primary-foreground" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-none hover:bg-destructive hover:text-destructive-foreground" onClick={() => { setToDelete(p); setDelDialog(true); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataCardContent>
      </DataCard>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-none border-2 max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="mono uppercase tracking-wider text-sm">
              // {editing ? "Edition" : "Creation"} produit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-none border-2 mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Prix (F)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded-none border-2 mono" />
              </div>
              <div>
                <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Illimite" className="rounded-none border-2 mono" />
              </div>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Categorie</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="rounded-none border-2 mono"><SelectValue placeholder="Selectionner" /></SelectTrigger>
                <SelectContent className="rounded-none border-2">
                  {cats.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-none border-2 mono text-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Image</Label>
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="" className="h-16 w-16 object-cover border-2 border-border" />
                  <Button type="button" variant="outline" size="sm" className="rounded-none border-2" onClick={() => { setPendingImage(null); setImagePreview(null); }}>
                    Changer
                  </Button>
                </div>
              ) : (
                <Input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setPendingImage(f); setImagePreview(URL.createObjectURL(f));
                }} className="rounded-none border-2 mono text-xs file:mr-2 file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1 file:font-bold file:uppercase file:tracking-wider file:text-[10px]" />
              )}
            </div>
            <div className="flex items-center justify-between border-t-2 border-border pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="mono text-xs uppercase tracking-wider">Actif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.whatsapp_redirect} onCheckedChange={(v) => setForm({ ...form, whatsapp_redirect: v })} />
                <Label className="mono text-xs uppercase tracking-wider">WhatsApp</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none border-2" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-none border-2 border-primary bg-primary text-primary-foreground mono uppercase tracking-wider hover:bg-primary/90">
              {saving ? "..." : editing ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={delDialog} onOpenChange={setDelDialog}>
        <AlertDialogContent className="rounded-none border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="mono uppercase tracking-wider">// Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le produit "{toDelete?.name}" sera definitivement supprime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-none border-2 border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
