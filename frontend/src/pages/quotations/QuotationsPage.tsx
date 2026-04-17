import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { quotationService } from '@/services/quotationService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { QuotationStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { QuotationStatus, InsuranceType } from '@/types'

const STATUS_OPTIONS: { label: string; value: QuotationStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Pendiente', value: 'Pending' },
  { label: 'Procesando', value: 'Processing' },
  { label: 'Completado', value: 'Completed' },
  { label: 'Fallido', value: 'Failed' },
  { label: 'Expirado', value: 'Expired' },
]

export default function QuotationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QuotationStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, search, status],
    queryFn: () => quotationService.getQuotations({
      page,
      pageSize: 15,
      search: search || undefined,
      status: status || undefined,
    }),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-orion-text-primary">Cotizaciones</h1>
          {data && (
            <p className="text-sm text-orion-text-muted mt-0.5">
              {data.totalCount} cotizaciones en total
            </p>
          )}
        </div>
        <Link to="/quotations/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Nueva Cotización</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar por referencia o cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftElement={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orion-text-muted flex-shrink-0" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as QuotationStatus | ''); setPage(1) }}
              className="bg-orion-elevated border border-orion-border text-sm text-orion-text-primary 
                         rounded-lg px-3 py-2 focus:outline-none focus:border-orion-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-orion-elevated border-b border-orion-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">Referencia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">Resultados</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orion-border">
                {data?.items?.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-orion-elevated/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/quotations/${q.id}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/quotations/${q.id}`}
                        className="font-mono text-xs text-orion-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {q.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-orion-text-primary">{q.clientName}</td>
                    <td className="px-4 py-3 text-orion-text-secondary">{q.insuranceType}</td>
                    <td className="px-4 py-3"><QuotationStatusBadge status={q.status} /></td>
                    <td className="px-4 py-3 text-orion-text-secondary">{q.resultsCount}</td>
                    <td className="px-4 py-3 text-xs text-orion-text-muted">
                      {new Date(q.createdAt).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-orion-border">
                <p className="text-xs text-orion-text-muted">
                  Página {data.page} de {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary" size="xs"
                    disabled={!data.hasPreviousPage}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary" size="xs"
                    disabled={!data.hasNextPage}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
