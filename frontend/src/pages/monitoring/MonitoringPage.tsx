import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, Server, MessageSquare, AlertOctagon, CheckCircle, XCircle } from 'lucide-react'
import apiClient from '@/services/api'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { MonitoringDashboard } from '@/types'

function HealthIndicator({ healthy, label }: { healthy: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {healthy
        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
        : <XCircle className="w-4 h-4 text-red-400" />
      }
      <span className="text-sm text-orion-text-secondary">{label}</span>
    </div>
  )
}

export default function MonitoringPage() {
  const { data, isLoading } = useQuery<MonitoringDashboard>({
    queryKey: ['monitoring-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/monitoring/dashboard')
      return data
    },
    refetchInterval: 15_000,
  })

  if (isLoading) return <PageLoader />

  const d = data

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-orion-text-primary">Monitoreo del Sistema</h1>
        <p className="text-sm text-orion-text-muted mt-0.5">
          Estado en tiempo real — actualiza cada 15 segundos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quotations */}
        <Card>
          <Card.Header>
            <Card.Title>Cotizaciones</Card.Title>
            <Activity className="w-4 h-4 text-orion-primary" />
          </Card.Header>
          <Card.Body className="space-y-2.5">
            {d && (
              <>
                <MetricRow label="Total" value={d.quotations.total} />
                <MetricRow label="Pendientes" value={d.quotations.pending} highlight="warning" />
                <MetricRow label="Procesando" value={d.quotations.processing} highlight="primary" />
                <MetricRow label="Completadas" value={d.quotations.completed} highlight="success" />
                <MetricRow label="Fallidas" value={d.quotations.failed} highlight="danger" />
              </>
            )}
          </Card.Body>
        </Card>

        {/* Scraping */}
        <Card>
          <Card.Header>
            <Card.Title>Motor de Scraping</Card.Title>
            <Link to="/monitoring/scraping">
              <Badge variant="primary">Ver jobs →</Badge>
            </Link>
          </Card.Header>
          <Card.Body className="space-y-2.5">
            {d && (
              <>
                <MetricRow label="Jobs Activos" value={d.scraping.activeJobs} />
                <MetricRow label="Fallidos Hoy" value={d.scraping.failedToday} highlight="danger" />
                <MetricRow label="Tasa de Éxito" value={`${d.scraping.successRatePercent.toFixed(1)}%`} highlight="success" />
                <MetricRow label="Tiempo Promedio" value={`${d.scraping.avgProcessingMs}ms`} />
              </>
            )}
          </Card.Body>
        </Card>

        {/* Messaging */}
        <Card>
          <Card.Header>
            <Card.Title>Azure Service Bus</Card.Title>
            <Server className="w-4 h-4 text-orion-text-muted" />
          </Card.Header>
          <Card.Body className="space-y-2.5">
            {d && (
              <>
                <HealthIndicator healthy={d.messaging.queuesHealthy} label="Colas saludables" />
                <MetricRow label="Dead Letter" value={d.messaging.deadLetterCount} highlight={d.messaging.deadLetterCount > 0 ? 'danger' : undefined} />
                <MetricRow label="Mensajes Hoy" value={d.messaging.messagesProcessedToday} />
              </>
            )}
          </Card.Body>
        </Card>

        {/* Users */}
        <Card>
          <Card.Header>
            <Card.Title>Usuarios</Card.Title>
            <MessageSquare className="w-4 h-4 text-orion-text-muted" />
          </Card.Header>
          <Card.Body className="space-y-2.5">
            {d && (
              <>
                <MetricRow label="Usuarios Activos" value={d.users.active} />
                <MetricRow label="Nuevos este mes" value={d.users.newThisMonth} highlight="success" />
              </>
            )}
          </Card.Body>
        </Card>

        {/* AI */}
        <Card>
          <Card.Header>
            <Card.Title>ORION AI</Card.Title>
            <AlertOctagon className="w-4 h-4 text-orion-gold" />
          </Card.Header>
          <Card.Body className="space-y-2.5">
            {d && (
              <>
                <MetricRow label="Conversaciones Hoy" value={d.ai.conversationsToday} />
                <MetricRow label="Respuesta Promedio" value={`${d.ai.avgResponseMs}ms`} />
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

function MetricRow({ label, value, highlight }: {
  label: string
  value: string | number
  highlight?: 'success' | 'warning' | 'danger' | 'primary'
}) {
  const valueColors: Record<string, string> = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    primary: 'text-orion-primary',
  }
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-orion-text-muted">{label}</span>
      <span className={`font-semibold ${highlight ? valueColors[highlight] : 'text-orion-text-primary'}`}>
        {value}
      </span>
    </div>
  )
}
