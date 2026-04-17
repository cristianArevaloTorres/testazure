import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, CheckCircle, Clock, AlertTriangle, Plus, TrendingUp, Users, Activity } from 'lucide-react'
import apiClient from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import Card from '@/components/ui/Card'
import Badge, { QuotationStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { MonitoringDashboard, QuotationListItem } from '@/types'

function MetricCard({ label, value, icon: Icon, color, delta }: {
  label: string; value: string | number; icon: React.ElementType
  color: string; delta?: string
}) {
  return (
    <Card className="metric-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-orion-text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-orion-text-primary mt-1">{value}</p>
          {delta && <p className="text-xs text-emerald-400 mt-1">{delta}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'Admin' || user?.role === 'Supervisor'

  const { data: dashboard, isLoading: dashLoading } = useQuery<MonitoringDashboard>({
    queryKey: ['monitoring-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/monitoring/dashboard')
      return data
    },
    enabled: isAdmin,
    refetchInterval: 30_000,
  })

  const { data: recentQuotations, isLoading: qLoading } = useQuery<{ items: QuotationListItem[] }>({
    queryKey: ['recent-quotations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/quotations', { params: { pageSize: 5, page: 1 } })
      return data
    },
    refetchInterval: 60_000,
  })

  if (dashLoading || qLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-orion-text-primary">Dashboard</h1>
          <p className="text-sm text-orion-text-muted mt-0.5">
            Vista general del sistema LOCKTON ORION
          </p>
        </div>
        <Button
          as={Link}
          to="/quotations/new"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nueva Cotización
        </Button>
      </div>

      {/* Metrics row (Admin/Supervisor only) */}
      {isAdmin && dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Cotizaciones Totales"
            value={dashboard.quotations.total}
            icon={FileText}
            color="bg-orion-primary"
          />
          <MetricCard
            label="Completadas"
            value={dashboard.quotations.completed}
            icon={CheckCircle}
            color="bg-emerald-600"
          />
          <MetricCard
            label="Procesando"
            value={dashboard.quotations.processing}
            icon={Clock}
            color="bg-amber-600"
          />
          <MetricCard
            label="Fallidas Hoy"
            value={dashboard.scraping.failedToday}
            icon={AlertTriangle}
            color="bg-red-600"
          />
        </div>
      )}

      {isAdmin && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Usuarios Activos"
            value={dashboard.users.active}
            icon={Users}
            color="bg-purple-600"
          />
          <MetricCard
            label="Tasa de Éxito Scraping"
            value={`${dashboard.scraping.successRatePercent.toFixed(1)}%`}
            icon={TrendingUp}
            color="bg-cyan-600"
          />
          <MetricCard
            label="Conversaciones AI Hoy"
            value={dashboard.ai.conversationsToday}
            icon={Activity}
            color="bg-orion-gold bg-opacity-70"
          />
        </div>
      )}

      {/* Recent Quotations */}
      <Card>
        <Card.Header>
          <Card.Title>Cotizaciones Recientes</Card.Title>
          <Link to="/quotations" className="text-xs text-orion-primary hover:underline">
            Ver todas →
          </Link>
        </Card.Header>
        <Card.Body>
          {recentQuotations?.items?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-orion-text-muted mx-auto mb-3" />
              <p className="text-sm text-orion-text-muted">No hay cotizaciones aún</p>
              <Link to="/quotations/new">
                <Button variant="secondary" size="sm" className="mt-3">
                  Crear primera cotización
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuotations?.items?.map((q) => (
                <Link
                  key={q.id}
                  to={`/quotations/${q.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-orion-elevated hover:bg-orion-elevated/70 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-orion-text-primary truncate">{q.referenceNumber}</p>
                    <p className="text-xs text-orion-text-muted mt-0.5">{q.clientName} · {q.insuranceType}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="default">{q.resultsCount} resultados</Badge>
                    <QuotationStatusBadge status={q.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
