'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Tags, Upload, X, ImageIcon } from 'lucide-react'
import { PageHeader } from '@/components/panel/page-header'
import { DataCard, DataCardContent } from '@/components/panel/data-card'
import { SkeletonRow } from '@/components/panel/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  deleteCategoryImage,
} from '@/lib/api/categories'
import { toast } from 'sonner'

interface Category {
  id: number
  name: string
  slug: string
  service_type: string
  parent_id?: number | null
  is_active: boolean
  image_path?: string | null
  product_count?: number
}

const SERVICE_TYPES = [
  { value: 'none',         label: 'Aucun' },
  { value: 'digital',      label: 'Digital' },
  { value: 'physical',     label: 'Physique' },
  { value: 'subscription', label: 'Abonnement' },
]

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const defaultForm = {
  name: '',
  slug: '',
  service_type: 'none',
  is_active: true,
  parent_id: null as number | null,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Category | null>(null)
  const [form, setForm]         = useState(defaultForm)
  const [slugManual, setSlugManual] = useState(false)

  // Image states
  const [pendingImage, setPendingImage]   = useState<File | null>(null)
  const [imagePreview, setImagePreview]   = useState<string | null>(null)
  const [deletingImage, setDeletingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteDialog, setDeleteDialog]         = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('[categories] load error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetImageState = () => {
    setPendingImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getParentName = (parentId: number | null | undefined) => {
    if (!parentId) return null
    return categories.find((c) => c.id === parentId)?.name ?? null
  }

  // Root categories available as parent (exclude self in edit mode)
  const rootCategories = categories.filter(
    (c) => !c.parent_id && (!editing || c.id !== editing.id),
  )

  // ── Dialog open ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setSlugManual(false)
    resetImageState()
    setShowForm(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({
      name:         c.name,
      slug:         c.slug,
      service_type: c.service_type || 'none',
      is_active:    c.is_active,
      parent_id:    c.parent_id ?? null,
    })
    setSlugManual(true)
    resetImageState()
    setShowForm(true)
  }

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleNameChange = (value: string) => {
    const updated = { ...form, name: value }
    if (!slugManual) updated.slug = toSlug(value)
    setForm(updated)
  }

  const handleSlugChange = (value: string) => {
    setSlugManual(value.length > 0)
    setForm({ ...form, slug: value })
  }

  // ── Image handlers ─────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 MB)')
      return
    }
    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemovePending = () => {
    setPendingImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteCurrentImage = async () => {
    if (!editing) return
    setDeletingImage(true)
    try {
      await deleteCategoryImage(editing.id)
      toast.success('Image supprimée')
      const updated = { ...editing, image_path: null }
      setEditing(updated)
      setCategories((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, image_path: null } : c)),
      )
    } catch {
      toast.error("Erreur lors de la suppression de l'image")
    } finally {
      setDeletingImage(false)
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Le nom est obligatoire'); return }
    if (!editing && !form.slug.trim()) { toast.error('Le slug est obligatoire'); return }

    setSaving(true)
    try {
      let categoryId = editing?.id

      if (editing) {
        await updateCategory(editing.id, {
          name:         form.name,
          slug:         form.slug || undefined,
          service_type: form.service_type,
          is_active:    form.is_active,
          // NOTE: parent_id nécessite d'ajouter le champ dans CategoryUpdate (backend).
          parent_id:    form.parent_id,
        })
        toast.success('Catégorie mise à jour')
      } else {
        const { data } = await createCategory({
          name:         form.name,
          slug:         form.slug,
          service_type: form.service_type,
          is_active:    form.is_active,
          parent_id:    form.parent_id ?? undefined,
        })
        categoryId = data.id
        toast.success('Catégorie créée')
      }

      // Upload image si en attente
      if (pendingImage && categoryId) {
        try {
          await uploadCategoryImage(categoryId, pendingImage)
        } catch {
          toast.error("Catégorie sauvegardée mais l'upload de l'image a échoué")
        }
      }

      await load()
      setShowForm(false)
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      toast.error(detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const confirmDelete = (c: Category) => {
    setCategoryToDelete(c)
    setDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    try {
      await deleteCategory(categoryToDelete.id)
      toast.success('Catégorie supprimée')
      await load()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteDialog(false)
      setCategoryToDelete(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Catalogue"
        title="Catégories"
        subtitle={`${categories.length} catégorie${categories.length !== 1 ? 's' : ''}`}
      >
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle
        </Button>
      </PageHeader>

      <DataCard>
        <DataCardContent>
          {loading ? (
            <div>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <Tags className="h-5 w-5" />
              </div>
              <p className="text-sm">Aucune catégorie</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((category) => {
                const parentName = getParentName(category.parent_id)
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {category.image_path ? (
                        <img
                          src={category.image_path}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">📁</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{category.name}</p>
                        {parentName && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                            ↳ {parentName}
                          </span>
                        )}
                      </div>
                      {category.slug && (
                        <p className="font-mono text-[10px] text-muted-foreground">{category.slug}</p>
                      )}
                    </div>

                    <span className="font-mono text-xs font-semibold text-cyber-yellow bg-cyber-yellow-soft border border-cyber-yellow/20 rounded-full px-2.5 py-0.5">
                      {category.product_count || 0}
                    </span>

                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                      category.is_active
                        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                        : 'text-muted-foreground bg-muted border-border'
                    }`}>
                      {category.is_active ? 'actif' : 'inactif'}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-cyber-red hover:text-cyber-red hover:bg-cyber-red-soft"
                        onClick={() => confirmDelete(category)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DataCardContent>
      </DataCard>

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Modifier — ${editing.name}` : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* Image */}
            <div className="space-y-2">
              <Label>Image</Label>

              {imagePreview ? (
                /* Nouvelle image sélectionnée — preview */
                <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemovePending}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : editing?.image_path ? (
                /* Image existante */
                <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border">
                  <img src={editing.image_path} alt={editing.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleDeleteCurrentImage}
                    disabled={deletingImage}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                /* Aucune image — zone d'upload */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 rounded-lg border border-dashed border-border bg-muted/40 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">Cliquer pour choisir (JPG, PNG, WEBP · max 5 MB)</span>
                </button>
              )}

              {/* Bouton "Changer" si une image est déjà présente */}
              {(imagePreview || editing?.image_path) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Changer l'image
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              {!editing && pendingImage && (
                <p className="text-[10px] text-muted-foreground">
                  L'image sera uploadée juste après la création.
                </p>
              )}
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Streaming"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>
                Slug
                {!editing && <span className="text-cyber-red ml-1">*</span>}
              </Label>
              <Input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="ex: streaming"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Identifiant unique, généré automatiquement depuis le nom
              </p>
            </div>

            {/* Type de service */}
            <div className="space-y-2">
              <Label>Type de service</Label>
              <Select
                value={form.service_type}
                onValueChange={(v) => setForm({ ...form, service_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie mère — création ET édition */}
            <div className="space-y-2">
              <Label>
                Catégorie mère{' '}
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Select
                value={form.parent_id !== null ? String(form.parent_id) : '__none__'}
                onValueChange={(v) =>
                  setForm({ ...form, parent_id: v === '__none__' ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune (catégorie racine)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune (catégorie racine)</SelectItem>
                  {rootCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actif — création ET édition */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-[10px] text-muted-foreground">Visible dans la boutique</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '...' : (editing ? 'Enregistrer' : 'Créer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer "{categoryToDelete?.name}" ?
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
