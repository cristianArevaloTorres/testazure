import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, Search } from 'lucide-react'
import apiClient from '@/services/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { AppUser, PagedResult } from '@/types'

const roleVariant: Record<string, 'danger' | 'purple' | 'primary' | 'success'> = {
  Admin: 'danger',
  Supervisor: 'purple',
  Advisor: 'primary',
  Client: 'success',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PagedResult<AppUser>>({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get('/users', { params: { page, pageSize: 15, search: search || undefined } })
      return data
    },
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-orion-text-primary">Usuarios del Sistema</h1>
          {data && <p className="text-sm text-orion-text-muted mt-0.5">{data.totalCount} usuarios</p>}
        </div>
        <Button leftIcon={<UserPlus className="w-4 h-4" />}>Nuevo Usuario</Button>
      </div>

      <Card className="p-4">
        <Input
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          leftElement={<Search className="w-4 h-4" />}
        />
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-orion-elevated border-b border-orion-border">
                <tr>
                  {['Usuario', 'Correo', 'Rol', 'Estado', 'Último acceso', 'Creado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orion-border">
                {data?.items?.map((u) => (
                  <tr key={u.id} className="hover:bg-orion-elevated/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-orion-text-primary">{u.fullName}</td>
                    <td className="px-4 py-3 text-orion-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant[u.role] ?? 'default'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'default'} dot>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-orion-text-muted">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es-MX') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-orion-text-muted">
                      {new Date(u.createdAt).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-orion-border">
                <p className="text-xs text-orion-text-muted">Página {data.page} de {data.totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="xs" disabled={!data.hasPreviousPage} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                  <Button variant="secondary" size="xs" disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
