'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, List, Grid, Pencil, Trash2, ImageIcon } from 'lucide-react'
import { PageHeader } from '@/components/panel/page-header'
import { StatusBadge } from '@/components/panel/status-badge'
import { DataCard, DataCardHeader, DataCardContent } from '@/components/panel/data-card'
import { SkeletonRow, Skeleton } from '@/components/panel/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api/products'
import { getCategories } from '@/lib/api/categories'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  stock?: number | null
  is_active: boolean
  image_path?: string
  category_id?: number
  category_name?: string
  whatsapp_redirect?: boolean
}

interface Category {
  id: number
  name: string
}

const defaultForm = {
  name: '',
  price: 0,
  description: '',
  category_id: '',
  image_path: '',
  stock: '',
  is_active: true,
  whatsapp_redirect: false,
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(defaultForm)
  
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([getProducts(), getCategories()])
      setProducts(pRes.data || [])
      setCategories(cRes.data || [])
    } catch (error) {
      console.error('[v0] Products load error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.name?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q)
  })

  const openCreate = () => {
    setEditingProduct(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({
      name: p.name || '',
      price: p.price || 0,
      description: p.description || '',
      category_id: p.category_id?.toString() || '',
      image_path: p.image_path || '',
      stock: p.stock?.toString() || '',
      is_active: p.is_active ?? true,
      whatsapp_redirect: p.whatsapp_redirect ?? false,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        category_id: form.category_id ? Number(form.category_id) : null,
        stock: form.stock ? Number(form.stock) : null,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        toast.success('Produit mis a jour')
      } else {
        await createProduct(payload)
        toast.success('Produit cree')
      }
      await loadProducts()
      setShowForm(false)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (p: Product) => {
    setProductToDelete(p)
    setDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete.id)
      toast.success('Produit supprime')
      await loadProducts()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteDialog(false)
      setProductToDelete(null)
    }
  }

  const fmtPrice = (n: number) => `${n?.toLocaleString('fr-FR')} F`

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Catalogue"
        title="Produits"
        subtitle="Gerez votre catalogue de produits"
      >
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </PageHeader>

      <DataCard>
        <DataCardHeader>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'table' ? "bg-cyber-yellow-soft text-cyber-yellow" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 border-l border-border transition-colors",
                  viewMode === 'grid' ? "bg-cyber-yellow-soft text-cyber-yellow" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5">
              <span className="font-mono text-xs text-muted-foreground">{filtered.length}</span>
            </div>
          </div>
        </DataCardHeader>

        <DataCardContent>
          {loading ? (
            viewMode === 'table' ? (
              <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="text-sm">Aucun produit</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="divide-y divide-border">
              {filtered.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  {product.image_path ? (
                    <img
                      src={product.image_path}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {product.category_name && (
                      <span className="font-mono text-[10px] font-semibold text-cyber-yellow bg-cyber-yellow-soft border border-cyber-yellow/20 rounded px-1.5 py-0.5">
                        {product.category_name}
                      </span>
                    )}
                  </div>
                  
                  <div className="font-mono text-sm font-medium">
                    {fmtPrice(product.price)}
                  </div>
                  
                  <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
                  
                  {product.stock != null ? (
                    <span className={cn(
                      "font-mono text-xs font-semibold rounded px-2 py-0.5 border",
                      product.stock === 0 
                        ? "text-cyber-red bg-cyber-red-soft border-cyber-red/20"
                        : product.stock < 5
                        ? "text-cyber-yellow bg-cyber-yellow-soft border-cyber-yellow/20"
                        : "text-cyber-green bg-cyber-green-soft border-cyber-green/20"
                    )}>
                      {product.stock}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Inf.</span>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-cyber-red hover:text-cyber-red hover:bg-cyber-red-soft" onClick={() => confirmDelete(product)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filtered.map((product) => (
                <div
                  key={product.id}
                  onClick={() => openEdit(product)}
                  className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-border/80 hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-video bg-muted">
                    {product.image_path ? (
                      <img
                        src={product.image_path}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
                    </div>
                  </div>
                  <div className="p-3">
                    {product.category_name && (
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyber-yellow mb-1">
                        {product.category_name}
                      </p>
                    )}
                    <p className="text-sm font-medium truncate mb-1">{product.name}</p>
                    <p className="font-mono text-sm font-semibold">{fmtPrice(product.price)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(product) }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-cyber-red hover:text-cyber-red hover:bg-cyber-red-soft" onClick={(e) => { e.stopPropagation(); confirmDelete(product) }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataCardContent>
      </DataCard>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? `Modifier - ${editingProduct.name}` : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nom du produit</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Netflix Premium 1 mois"
              />
            </div>

            <div className="space-y-2">
              <Label>Prix (FCFA)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description courte du produit..."
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>URL Image</Label>
              <Input
                value={form.image_path}
                onChange={(e) => setForm({ ...form, image_path: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Stock (vide = illimite)</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Statut</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <span className={cn("text-xs font-medium", form.is_active ? "text-cyber-green" : "text-muted-foreground")}>
                    {form.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>WhatsApp</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.whatsapp_redirect}
                    onCheckedChange={(checked) => setForm({ ...form, whatsapp_redirect: checked })}
                  />
                  <span className={cn("text-xs font-medium", form.whatsapp_redirect ? "text-cyber-green" : "text-muted-foreground")}>
                    {form.whatsapp_redirect ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '...' : (editingProduct ? 'Enregistrer' : 'Creer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer "{productToDelete?.name}" ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-cyber-red hover:bg-cyber-red/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
