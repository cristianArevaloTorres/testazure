import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter } from 'lucide-react'
import apiClient from '@/services/api'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entityName: string
  entityId: string
  ipAddress: string
  method: string
  path: string
  statusCode: number
  timestamp: string
}

const METHOD_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
  GET: 'success',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [method, setMethod] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, method],
    queryFn: async () => {
      const { data } = await apiClient.get('/monitoring/audit', {
        params: { page, pageSize: 20, search: search || undefined, method: method || undefined }
      })
      return data
    },
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-orion-text-primary">Logs de Auditoría</h1>
        <p className="text-sm text-orion-text-muted mt-0.5">
          Registro completo de acciones en el sistema
        </p>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Buscar por usuario, entidad o ruta..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftElement={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orion-text-muted" />
            <select
              value={method}
              onChange={(e) => { setMethod(e.target.value); setPage(1) }}
              className="bg-orion-elevated border border-orion-border text-sm text-orion-text-primary 
                         rounded-lg px-3 py-2 focus:outline-none focus:border-orion-primary"
            >
              <option value="">Todos los métodos</option>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-orion-elevated border-b border-orion-border">
                <tr>
                  {['Timestamp', 'Usuario', 'Método', 'Ruta', 'Entidad', 'Estado', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orion-border">
                {data?.items?.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-orion-elevated/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-orion-text-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-orion-text-secondary">{log.userName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={METHOD_VARIANT[log.method] ?? 'default'}>{log.method}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-orion-text-muted max-w-48 truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className="px-4 py-3 text-orion-text-secondary">
                      {log.entityName && `${log.entityName}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={log.statusCode < 300 ? 'success' : log.statusCode < 500 ? 'warning' : 'danger'}
                      >
                        {log.statusCode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-orion-text-muted font-mono">{log.ipAddress}</td>
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
