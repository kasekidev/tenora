'use client'

import { useEffect, useState } from 'react'
import { Wrench, Megaphone, MessageCircle, CreditCard, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/panel/page-header'
import { Skeleton } from '@/components/panel/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  getSettings, 
  updateMaintenance, 
  updateAnnouncement, 
  updateWhatsapp, 
  updatePaymentMethods 
} from '@/lib/api/settings'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PaymentMethod {
  key: string
  label: string
  desc: string
  color: string
  enabled: boolean
  instructions: string
  expanded: boolean
}

const PM_DEFS = [
  { key: 'wave', label: 'Wave', desc: 'Mobile money - Wave Niger', color: '#00D4FF' },
  { key: 'airtel', label: 'Airtel Money', desc: 'Mobile money - Airtel Niger', color: '#E40000' },
  { key: 'mynita', label: 'Mynita', desc: 'Paiement mobile - Mynita', color: '#F27200' },
  { key: 'amanata', label: 'Amanata', desc: 'Paiement mobile - Amanata', color: '#FFB608' },
  { key: 'usdt', label: 'USDT TRC20', desc: 'Crypto - reseau Tron (TRC20)', color: '#26A17B' },
  { key: 'zcash', label: 'ZCash', desc: 'Crypto - ZCash (ZEC)', color: '#F4B728' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [announcement, setAnnouncement] = useState({ enabled: false, text: '' })
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    PM_DEFS.map(def => ({ ...def, enabled: true, instructions: '', expanded: false }))
  )

  const [saving, setSaving] = useState({
    maintenance: false,
    announcement: false,
    whatsapp: false,
    payments: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data } = await getSettings()
      setMaintenance(data.maintenance ?? false)
      setAnnouncement({
        enabled: data.announcement?.enabled ?? false,
        text: data.announcement?.text ?? '',
      })
      setWhatsapp(data.whatsapp_number ?? '')
      
      if (Array.isArray(data.payment_methods)) {
        setPaymentMethods(prev => prev.map(m => {
          const fromApi = data.payment_methods.find((x: { id: string }) => x.id === m.key)
          if (fromApi) {
            return { ...m, enabled: fromApi.enabled ?? true, instructions: fromApi.instructions ?? '' }
          }
          return m
        }))
      }
    } catch (error) {
      console.error('[v0] Settings load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMaintenance = async (value: boolean) => {
    setMaintenance(value)
    setSaving(s => ({ ...s, maintenance: true }))
    try {
      await updateMaintenance(value)
      toast.success('Mode maintenance mis a jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(s => ({ ...s, maintenance: false }))
    }
  }

  const saveAnnouncement = async () => {
    setSaving(s => ({ ...s, announcement: true }))
    try {
      await updateAnnouncement(announcement)
      toast.success('Bandeau mis a jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(s => ({ ...s, announcement: false }))
    }
  }

  const saveWhatsapp = async () => {
    const cleaned = whatsapp.replace(/\D/g, '')
    if (!cleaned) return
    setSaving(s => ({ ...s, whatsapp: true }))
    try {
      await updateWhatsapp(cleaned)
      setWhatsapp(cleaned)
      toast.success('Numero WhatsApp mis a jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(s => ({ ...s, whatsapp: false }))
    }
  }

  const savePayments = async () => {
    setSaving(s => ({ ...s, payments: true }))
    try {
      const payload = paymentMethods.map(m => ({
        id: m.key,
        enabled: m.enabled,
        instructions: m.instructions,
      }))
      await updatePaymentMethods(payload)
      toast.success('Modes de paiement mis a jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(s => ({ ...s, payments: false }))
    }
  }

  const togglePaymentMethod = (key: string, field: 'enabled' | 'expanded', value?: boolean) => {
    setPaymentMethods(prev => prev.map(m => 
      m.key === key ? { ...m, [field]: value !== undefined ? value : !m[field] } : m
    ))
  }

  const updatePaymentInstructions = (key: string, instructions: string) => {
    setPaymentMethods(prev => prev.map(m => 
      m.key === key ? { ...m, instructions } : m
    ))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <PageHeader eyebrow="Configuration" title="Parametres" subtitle="Gerez la configuration de votre boutique" />
        <div className="flex items-center justify-center py-16">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Configuration"
        title="Parametres"
        subtitle="Gerez la configuration de votre boutique"
      />

      <Tabs defaultValue="maintenance" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-3.5 w-3.5" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-2">
            <Megaphone className="h-3.5 w-3.5" />
            Bandeau
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-3.5 w-3.5" />
            Paiements
          </TabsTrigger>
        </TabsList>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-red-soft border border-cyber-red/20 text-cyber-red">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mode maintenance</h3>
                <p className="text-sm text-muted-foreground">
                  Affiche une page de maintenance sur le shop public. Les visiteurs ne pourront pas acceder au catalogue.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={maintenance}
                  onCheckedChange={saveMaintenance}
                  disabled={saving.maintenance}
                />
                <span className={cn(
                  "text-sm font-medium",
                  maintenance ? "text-cyber-red" : "text-cyber-green"
                )}>
                  {maintenance ? 'Maintenance active - shop inaccessible' : 'Site en ligne'}
                </span>
              </div>
            </div>

            {maintenance && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-cyber-red-soft border border-cyber-red/20 p-3 text-sm text-cyber-red">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Votre boutique est actuellement inaccessible aux visiteurs.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Announcement Tab */}
        <TabsContent value="announcement">
          <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-yellow-soft border border-cyber-yellow/20 text-cyber-yellow">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Bandeau d'annonce</h3>
                <p className="text-sm text-muted-foreground">
                  Affiche un bandeau informatif en haut du shop. Ideal pour les promotions ou les infos importantes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={announcement.enabled}
                  onCheckedChange={(checked) => setAnnouncement(a => ({ ...a, enabled: checked }))}
                />
                <Label>Activer le bandeau</Label>
              </div>

              <div className="space-y-2">
                <Label>Texte du bandeau</Label>
                <Input
                  value={announcement.text}
                  onChange={(e) => setAnnouncement(a => ({ ...a, text: e.target.value }))}
                  placeholder="Ex : Livraison gratuite ce weekend"
                  disabled={!announcement.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Ce texte s'affiche dans le bandeau en haut de la boutique.
                </p>
              </div>

              {announcement.enabled && announcement.text.trim() && (
                <div className="flex items-center gap-2 rounded-lg bg-cyber-yellow-soft border border-cyber-yellow/20 p-3 text-sm text-cyber-yellow">
                  <Megaphone className="h-4 w-4 flex-shrink-0" />
                  {announcement.text}
                </div>
              )}

              <Button onClick={saveAnnouncement} disabled={saving.announcement}>
                {saving.announcement ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <div className="max-w-md rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Numero WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Numero utilise pour les redirections WhatsApp. Format international sans le + (ex: 22700000000).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Numero (chiffres uniquement)</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="22700000000"
                    type="tel"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={saveWhatsapp} disabled={saving.whatsapp}>
                {saving.whatsapp ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-yellow-soft border border-cyber-yellow/20 text-cyber-yellow">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Modes de paiement</h3>
                <p className="text-sm text-muted-foreground">
                  Activez / desactivez les methodes et personnalisez les instructions envoyees aux clients.
                  <br />
                  Variables disponibles: <code className="font-mono text-xs text-cyber-yellow bg-cyber-yellow-soft rounded px-1">{'{amount}'}</code> (montant) et <code className="font-mono text-xs text-cyber-yellow bg-cyber-yellow-soft rounded px-1">{'{order_id}'}</code> (numero de commande).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.key}
                  className={cn(
                    "rounded-lg border transition-colors",
                    pm.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div 
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold"
                      style={{ 
                        backgroundColor: `${pm.color}15`, 
                        color: pm.color,
                        border: `1px solid ${pm.color}30`
                      }}
                    >
                      {pm.label[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePaymentMethod(pm.key, 'expanded')}
                      className="gap-1"
                    >
                      {pm.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Instructions
                    </Button>
                    <Switch
                      checked={pm.enabled}
                      onCheckedChange={(checked) => togglePaymentMethod(pm.key, 'enabled', checked)}
                    />
                  </div>
                  
                  {pm.expanded && (
                    <div className="border-t border-border p-4">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Message envoye au client apres paiement
                      </Label>
                      <Textarea
                        value={pm.instructions}
                        onChange={(e) => updatePaymentInstructions(pm.key, e.target.value)}
                        rows={4}
                        placeholder={`Instructions de paiement pour ${pm.label}...\nEx: Envoyez {amount} au +227 XX XX XX via ${pm.label}.\nReference : commande #{order_id}`}
                      />
                      <p className="text-[10px] text-muted-foreground mt-2">
                        <code className="font-mono text-cyber-yellow">{'{amount}'}</code> = montant | <code className="font-mono text-cyber-yellow">{'{order_id}'}</code> = n de commande
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
              <Button onClick={savePayments} disabled={saving.payments}>
                {saving.payments ? 'Enregistrement...' : 'Enregistrer les paiements'}
              </Button>
              <span className="text-xs text-muted-foreground">
                Statuts actifs/inactifs et instructions sont sauvegardes ensemble.
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
