import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Loader2, RefreshCw, Clock, CheckCircle2, AlertCircle, Zap, Pause, Play, Trash2 } from 'lucide-react'
import apiClient from '@/services/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import type { ScrapingJob, PagedResult } from '@/types'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'default'> = {
  Completed: 'success',
  Processing: 'primary',
  Retrying: 'warning',
  Failed: 'danger',
  DeadLettered: 'danger',
  Queued: 'default',
  Cancelled: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  Completed: 'Completado',
  Processing: 'Procesando',
  Retrying: 'Reintentando',
  Failed: 'Fallido',
  DeadLettered: 'Dead Letter',
  Queued: 'En cola',
  Cancelled: 'Cancelado',
}

function ActivityRow({ j, isPendingRetry, onRetry }: {
  j: ScrapingJob
  isPendingRetry: boolean
  onRetry: () => void
}) {
  const isActive = j.status === 'Processing' || j.status === 'Queued' || j.status === 'Retrying'
  return (
    <tr className="hover:bg-orion-elevated/50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-orion-primary">{j.referenceNumber}</span>
      </td>
      <td className="px-4 py-3 text-orion-text-primary">{j.insurerName ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {isActive && <Loader2 className="w-3 h-3 text-orion-primary animate-spin flex-shrink-0" />}
          {j.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />}
          {(j.status === 'Failed' || j.status === 'DeadLettered') && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
          <Badge variant={STATUS_VARIANT[j.status] ?? 'default'}>
            {STATUS_LABEL[j.status] ?? j.status}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3 text-orion-text-secondary text-center">{j.attemptNumber ?? 1}</td>
      <td className="px-4 py-3 text-orion-text-muted">
        {isActive ? (
          <span className="flex items-center gap-1 text-orion-primary text-xs">
            <Zap className="w-3 h-3" /> En progreso...
          </span>
        ) : j.durationMs ? `${(j.durationMs / 1000).toFixed(1)}s` : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-orion-text-muted">
        {j.startedAt ? new Date(j.startedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
      </td>
      <td className="px-4 py-3 max-w-xs">
        {j.errorMessage && (
          <span className="text-xs text-red-400 truncate block" title={j.errorMessage}>
            {j.errorMessage}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {(j.status === 'Failed' || j.status === 'DeadLettered') && (
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<RotateCcw className="w-3 h-3" />}
            isLoading={isPendingRetry}
            onClick={onRetry}
          >
            Reintentar
          </Button>
        )}
      </td>
    </tr>
  )
}

export default function ScrapingMonitorPage() {
  const [inputValue, setInputValue] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [confirmReset, setConfirmReset] = useState<'failed' | 'all' | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qc = useQueryClient()

  // Debounce: espera 400ms después de que el usuario deja de escribir
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(inputValue)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputValue])

  const { data, isFetching, isError } = useQuery<PagedResult<ScrapingJob>>({
    queryKey: ['scraping-jobs', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get('/monitoring/scraping/jobs', {
        params: { page, pageSize: 20, search: search || undefined }
      })
      setLastUpdated(new Date())
      return data
    },
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? []
      const hasActive = items.some(j => j.status === 'Processing' || j.status === 'Queued' || j.status === 'Retrying')
      return hasActive ? 3000 : false
    },
    staleTime: 0,
  })

  // Estado del simulador (paused/running)
  const { data: simStatus, refetch: refetchStatus } = useQuery<{ paused: boolean }>({
    queryKey: ['simulator-status'],
    queryFn: async () => { const { data } = await apiClient.get('/monitoring/scraping/simulator/status'); return data },
    refetchInterval: 5000,
  })

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.post(`/monitoring/scraping/jobs/${jobId}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scraping-jobs'] }),
  })

  const pauseMutation = useMutation({
    mutationFn: () => apiClient.post(simStatus?.paused ? '/monitoring/scraping/simulator/resume' : '/monitoring/scraping/simulator/pause'),
    onSuccess: () => { refetchStatus(); qc.invalidateQueries({ queryKey: ['simulator-status'] }) },
  })

  const resetMutation = useMutation({
    mutationFn: (all: boolean) => apiClient.delete(`/monitoring/scraping/data?all=${all}`),
    onSuccess: (res) => {
      setConfirmReset(null)
      qc.invalidateQueries({ queryKey: ['scraping-jobs'] })
      document.title = `✅ ${res.data?.message ?? 'Eliminado OK'}`
      setTimeout(() => { document.title = 'Lockton Orion' }, 3000)
    },
  })

  const activeJobs = data?.items?.filter(j =>
    j.status === 'Processing' || j.status === 'Queued' || j.status === 'Retrying'
  ) ?? []

  const isPaused = simStatus?.paused ?? false
  const isSearching = isFetching && inputValue !== search

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-orion-text-primary">Jobs de Scraping</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {/* Indicador de estado del simulador */}
            <span className={`flex items-center gap-1.5 text-sm font-medium ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              {isPaused ? 'Simulador pausado' : 'Simulador activo'}
            </span>
            {!isPaused && activeJobs.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-orion-primary">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {activeJobs.length} job{activeJobs.length > 1 ? 's' : ''} activo{activeJobs.length > 1 ? 's' : ''} — auto-refresco 3s
              </span>
            )}
            {lastUpdated && (
              <span className="flex items-center gap-1 text-xs text-orion-text-muted">
                <Clock className="w-3 h-3" />
                Actualizado {lastUpdated.toLocaleTimeString('es-MX', { timeStyle: 'medium' })}
              </span>
            )}
          </div>
        </div>

        {/* Botones de control */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pausar / Reanudar */}
          <Button
            variant={isPaused ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={pauseMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
            }
            onClick={() => pauseMutation.mutate()}
            disabled={pauseMutation.isPending}
          >
            {isPaused ? 'Reanudar' : 'Pausar'}
          </Button>

          {/* Eliminar fallidos */}
          {confirmReset === 'failed' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-400">¿Eliminar fallidos?</span>
              <Button variant="danger" size="xs" isLoading={resetMutation.isPending} onClick={() => resetMutation.mutate(false)}>Sí</Button>
              <Button variant="secondary" size="xs" onClick={() => setConfirmReset(null)}>No</Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setConfirmReset('failed')}
            >
              Eliminar fallidos
            </Button>
          )}

          {/* Eliminar todo */}
          {confirmReset === 'all' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-400">¿Eliminar TODO? (jobs + cotizaciones)</span>
              <Button variant="danger" size="xs" isLoading={resetMutation.isPending} onClick={() => resetMutation.mutate(true)}>Sí</Button>
              <Button variant="secondary" size="xs" onClick={() => setConfirmReset(null)}>No</Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
              onClick={() => setConfirmReset('all')}
            >
              Eliminar todo
            </Button>
          )}

          {/* Actualizar manualmente */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => qc.invalidateQueries({ queryKey: ['scraping-jobs'] })}
            disabled={isFetching}
          >
            {isFetching ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <Card className="p-4">
        <div className="relative">
          <Input
            placeholder="Ej: COT-2026-0003 o nombre de aseguradora..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            leftElement={
              isSearching
                ? <Loader2 className="w-4 h-4 animate-spin text-orion-primary" />
                : <Search className="w-4 h-4" />
            }
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orion-primary animate-pulse">
              Buscando...
            </span>
          )}
        </div>
        {search && (
          <p className="mt-2 text-xs text-orion-text-muted">
            {isFetching ? 'Buscando resultados...' : `${data?.totalCount ?? 0} resultado${(data?.totalCount ?? 0) !== 1 ? 's' : ''} para "${search}"`}
          </p>
        )}
      </Card>

      {/* Tabla */}
      <Card className="p-0 overflow-hidden">
        <div className={`transition-opacity duration-200 ${isFetching && !isSearching ? 'opacity-70' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead className="bg-orion-elevated border-b border-orion-border">
              <tr>
                {['Cotización', 'Aseguradora', 'Estado', 'Intentos', 'Duración', 'Iniciado', 'Error', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-orion-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-orion-border">
              {isFetching && !data?.items?.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-orion-text-muted">
                      <Loader2 className="w-8 h-8 animate-spin text-orion-primary" />
                      <span className="text-sm">
                        {search ? `Buscando "${search}"...` : 'Cargando jobs de scraping...'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-400">
                      <AlertCircle className="w-8 h-8" />
                      <span className="text-sm">Error al cargar. Intenta actualizar.</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-orion-text-muted">
                      <Search className="w-8 h-8 opacity-30" />
                      <span className="text-sm">
                        {search ? `No se encontraron jobs para "${search}"` : 'No hay jobs de scraping registrados'}
                      </span>
                      {search && (
                        <span className="text-xs opacity-70">Intenta con el número de cotización exacto, ej: COT-2026-0001</span>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((j) => (
                  <ActivityRow
                    key={j.id}
                    j={j}
                    isPendingRetry={retryMutation.isPending && retryMutation.variables === j.id}
                    onRetry={() => retryMutation.mutate(j.id)}
                  />
                ))
              )}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-orion-border">
              <p className="text-xs text-orion-text-muted">
                Mostrando {data.items.length} de {data.totalCount} — Página {data.page} de {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="xs" disabled={!data.hasPreviousPage} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="secondary" size="xs" disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
