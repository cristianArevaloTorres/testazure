import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import apiClient from '@/services/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Client, PagedResult } from '@/types'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PagedResult<Client>>({
    queryKey: ['clients', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get('/clients', { params: { page, pageSize: 15, search: search || undefined } })
      return data
    },
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-orion-text-primary">Clientes</h1>
          {data && <p className="text-sm text-orion-text-muted mt-0.5">{data.totalCount} clientes registrados</p>}
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Nuevo Cliente</Button>
      </div>

      <Card className="p-4">
        <Input
          placeholder="Buscar por nombre, correo o RFC..."
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
                  {['Nombre', 'Correo', 'Teléfono', 'Asesor', 'Cotizaciones', 'Registro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orion-border">
                {data?.items?.map((c) => (
                  <tr key={c.id} className="hover:bg-orion-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${c.id}`} className="text-orion-primary hover:underline font-medium">
                        {c.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-orion-text-secondary">{c.email}</td>
                    <td className="px-4 py-3 text-orion-text-muted">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-orion-text-secondary">{c.advisorName ?? '—'}</td>
                    <td className="px-4 py-3 text-orion-text-secondary">{c.quotationCount}</td>
                    <td className="px-4 py-3 text-xs text-orion-text-muted">
                      {new Date(c.createdAt).toLocaleDateString('es-MX')}
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
