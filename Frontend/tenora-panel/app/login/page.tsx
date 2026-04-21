'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await login(email, password)
      router.push('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('administrateurs') ? msg : 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.88 0.18 95 / 0.03) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.88 0.18 95 / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Glowing orbs */}
      <div className="fixed -top-64 -left-48 w-[600px] h-[600px] rounded-full bg-cyber-yellow/5 blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-cyber-cyan/5 blur-[100px] pointer-events-none" />

      {/* Scanline */}
      <div className="scanline" />

      {/* Login card */}
      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          {/* Top glow line */}
          <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyber-yellow/50 to-transparent opacity-50" />

          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyber-yellow-soft border border-cyber-yellow/20 shadow-[0_0_20px_rgba(252,227,0,0.15)]">
              <span className="font-mono text-lg font-bold text-cyber-yellow">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tenora</h1>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyber-yellow bg-cyber-yellow-soft border border-cyber-yellow/20 rounded px-1.5 py-0.5">
                Panel v2
              </span>
            </div>
          </div>

          <div className="h-px bg-border mb-6" />

          <h2 className="text-lg font-semibold mb-1">Connexion administrateur</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Acces reserve aux membres autorises de l'equipe.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Adresse e-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tenora.com"
                  className="pl-10"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-cyber-red-soft border border-cyber-red/20 p-3 text-sm text-cyber-red animate-fade-in-up">
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 font-semibold shadow-[0_0_20px_rgba(252,227,0,0.2)] hover:shadow-[0_0_30px_rgba(252,227,0,0.35)]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Acceder au panel
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyber-yellow opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyber-yellow" />
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              Systeme operationnel - Tenora {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
