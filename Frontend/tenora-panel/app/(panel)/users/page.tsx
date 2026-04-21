'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Users, Shield } from 'lucide-react'
import { PageHeader } from '@/components/panel/page-header'
import { DataCard, DataCardHeader, DataCardContent } from '@/components/panel/data-card'
import { SkeletonRow } from '@/components/panel/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUsers } from '@/lib/api/users'
import { cn } from '@/lib/utils'

interface User {
  id: number
  email: string
  is_admin: boolean
  created_at: string
  order_count?: number
  total_spent?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getUsers({ 
        page, 
        per_page: pageSize, 
        q: search || undefined 
      })
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('[v0] Users fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const fmtPrice = (n: number) => `${n?.toLocaleString('fr-FR')} F`

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        subtitle={`${total} compte${total !== 1 ? 's' : ''} enregistres`}
      />

      <DataCard>
        <DataCardHeader>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2 ml-auto rounded-md border border-border bg-muted/50 px-3 py-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">{total}</span>
          </div>
        </DataCardHeader>

        <DataCardContent>
          {loading ? (
            <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyber-yellow to-cyber-yellow/70 font-mono text-xs font-bold text-primary-foreground shadow-[0_0_10px_rgba(252,227,0,0.2)]">
                    {user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      {user.is_admin && (
                        <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-cyber-cyan bg-cyber-cyan-soft border border-cyber-cyan/20 rounded px-1.5 py-0.5">
                          <Shield className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {fmtDate(user.created_at)}
                  </div>
                  
                  <span className="font-mono text-xs font-semibold text-cyber-yellow bg-cyber-yellow-soft border border-cyber-yellow/20 rounded-full px-2 py-0.5">
                    {user.order_count || 0}
                  </span>
                  
                  <div className="font-mono text-sm font-medium min-w-[80px] text-right">
                    {fmtPrice(user.total_spent || 0)}
                  </div>
                  
                  <span className={cn(
                    "text-xs font-semibold rounded-full px-2.5 py-0.5 border",
                    user.is_admin 
                      ? "text-cyber-cyan bg-cyber-cyan-soft border-cyber-cyan/20"
                      : "text-muted-foreground bg-muted border-border"
                  )}>
                    {user.is_admin ? 'Admin' : 'Client'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Precedent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} sur {Math.ceil(total / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </DataCardContent>
      </DataCard>
    </div>
  )
}
