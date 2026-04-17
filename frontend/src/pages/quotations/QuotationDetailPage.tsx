import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart2, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { quotationService } from '@/services/quotationService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge, { QuotationStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { StatusHistory } from '@/types'

function StatusIcon({ status }: { status: string }) {
  if (status === 'Completed') return <CheckCircle className="w-4 h-4 text-emerald-400" />
  if (status === 'Failed') return <XCircle className="w-4 h-4 text-red-400" />
  if (status === 'Processing') return <Clock className="w-4 h-4 text-amber-400" />
  return <AlertCircle className="w-4 h-4 text-orion-text-muted" />
}

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getQuotation(id!),
    enabled: !!id,
    refetchInterval: (data) => {
      // Keep polling if still processing
      if (data?.state?.data?.status === 'Processing' || data?.state?.data?.status === 'Pending') {
        return 5_000
      }
      return false
    },
  })

  if (isLoading) return <PageLoader />
  if (!quotation) return (
    <div className="text-center py-12">
      <p className="text-orion-text-muted">Cotización no encontrada</p>
      <Link to="/quotations"><Button variant="secondary" size="sm" className="mt-3">Volver</Button></Link>
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/quotations">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-orion-text-primary font-mono">{quotation.referenceNumber}</h1>
            <QuotationStatusBadge status={quotation.status} />
          </div>
          <p className="text-sm text-orion-text-muted mt-0.5">
            {quotation.clientName} · {quotation.insuranceType} · Creado {new Date(quotation.createdAt).toLocaleDateString('es-MX')}
          </p>
        </div>
        {quotation.status === 'Completed' && (
          <Link to={`/quotations/${id}/comparison`}>
            <Button leftIcon={<BarChart2 className="w-4 h-4" />} variant="gold">
              Ver Comparativo
            </Button>
          </Link>
        )}
        {quotation.status === 'Failed' && (
          <Button
            leftIcon={<RotateCcw className="w-4 h-4" />}
            variant="secondary"
            onClick={() => quotationService.retryQuotation(id!)}
          >
            Reintentar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <Card.Header><Card.Title>Resultados ({quotation.results.length})</Card.Title></Card.Header>
            <Card.Body>
              {quotation.results.length === 0 ? (
                <div className="text-center py-6">
                  {(quotation.status === 'Pending' || quotation.status === 'Processing') ? (
                    <>
                      <div className="w-8 h-8 border-2 border-orion-border border-t-orion-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-orion-text-muted">Recopilando cotizaciones...</p>
                    </>
                  ) : (
                    <p className="text-sm text-orion-text-muted">No se obtuvieron resultados</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {quotation.results.map((r) => (
                    <div
                      key={r.id}
                      className={`p-4 rounded-lg border ${r.isRecommended
                        ? 'border-orion-gold/30 bg-orion-gold/5'
                        : 'border-orion-border bg-orion-elevated'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-orion-text-primary">{r.insurerName}</p>
                            {r.isRecommended && <Badge variant="gold">⭐ Recomendado</Badge>}
                          </div>
                          <p className="text-xs text-orion-text-muted mt-0.5">{r.productName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-orion-text-primary">
                            ${r.annualPremium.toLocaleString('es-MX')}
                          </p>
                          <p className="text-xs text-orion-text-muted">anual</p>
                        </div>
                      </div>
                      {r.recommendationReason && (
                        <p className="text-xs text-orion-text-muted mt-2 pt-2 border-t border-orion-border">
                          {r.recommendationReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Sidebar: History + Info */}
        <div className="space-y-4">
          <Card>
            <Card.Header><Card.Title>Información</Card.Title></Card.Header>
            <Card.Body className="space-y-2.5 text-sm">
              <InfoRow label="Tipo" value={quotation.insuranceType} />
              <InfoRow label="Estado" value={<QuotationStatusBadge status={quotation.status} />} />
              {quotation.advisorNotes && <InfoRow label="Notas" value={quotation.advisorNotes} />}
              {quotation.lastErrorMessage && (
                <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs text-red-400">{quotation.lastErrorMessage}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header><Card.Title>Historial</Card.Title></Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {quotation.history?.map((h: StatusHistory, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <StatusIcon status={h.newStatus} />
                    <div>
                      <p className="text-orion-text-primary font-medium">{h.newStatus}</p>
                      {h.reason && <p className="text-orion-text-muted">{h.reason}</p>}
                      <p className="text-orion-text-muted">{new Date(h.changedAt).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-orion-text-muted flex-shrink-0">{label}</span>
      <span className="text-orion-text-primary text-right">{value}</span>
    </div>
  )
}
