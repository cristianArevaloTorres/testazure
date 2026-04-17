import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Star, TrendingDown, Shield, CheckCircle, XCircle,
  ExternalLink, Globe, Users, Car, Home, Briefcase, Plane, Heart,
} from 'lucide-react'
import { quotationService } from '@/services/quotationService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { QuotationResult } from '@/types'

// ─── Etiquetas legibles para claves de cobertura ────────────────────────────
const COVERAGE_LABELS: Record<string, string> = {
  // Auto
  dañosMateriales:          'Daños materiales',
  roboTotal:                'Robo total',
  roboParcialesPiezas:      'Robo de piezas',
  responsabilidadCivil:     'Resp. civil',
  gastosMedicos:            'Gastos médicos',
  asistenciaVial:           'Asistencia vial 24/7',
  autoSustituto:            'Auto sustituto (días)',
  cristales:                'Cristales',
  equipo_especial:          'Equipo especial',
  // Vida
  fallecimiento:            'Fallecimiento',
  invalidezTotal:           'Invalidez total',
  enfermedadGrave:          'Enfermedad grave',
  ahorro:                   'Componente de ahorro',
  sumaAsegurada:            'Suma asegurada',
  coberturaAccidentes:      'Cobertura accidentes',
  dobleIndemnizacion:       'Doble indemnización',
  // Salud
  maternidad:               'Maternidad',
  dental:                   'Dental',
  vision:                   'Visión',
  hospitalaria:             'Cobertura hospitalaria',
  // Hogar
  incendio:                 'Incendio',
  robo:                     'Robo',
  inundacion:               'Inundación',
  cristalesHogar:           'Cristales',
  rotura:                   'Rotura de maquinaria',
  // Empresarial
  interrupcionNegocio:      'Interrupción de negocio',
  equipoElectronico:        'Equipo electrónico',
  // Viaje
  asistenciaMedica:         'Asistencia médica',
  cancelacion:              'Cancelación de viaje',
  equipaje:                 'Equipaje',
  deportesExtremos:         'Deportes extremos',
}

function labelFor(key: string) {
  return COVERAGE_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
}

function formatCoverageValue(key: string, val: unknown): string | null {
  if (typeof val === 'boolean') return null   // solo icono
  if (typeof val === 'number') {
    if (key === 'autoSustituto') return `${val} días`
    if (val >= 1_000) return `$${val.toLocaleString('es-MX')}`
    return String(val)
  }
  if (typeof val === 'string') return val
  return null
}

// ─── Score color ────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 85) return 'from-emerald-500 to-teal-400'
  if (score >= 70) return 'from-orion-primary to-orion-accent'
  return 'from-amber-500 to-orange-400'
}

export default function ComparisonPage() {
  const { id } = useParams<{ id: string }>()

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getQuotation(id!),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />
  if (!quotation) return null

  const sorted = [...quotation.results].sort((a, b) => b.recommendationScore - a.recommendationScore)
  const best = sorted[0]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/quotations/${id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Detalle
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-orion-text-primary">Comparativo de Cotizaciones</h1>
          <p className="text-sm text-orion-text-muted mt-0.5">
            {quotation.referenceNumber} · {sorted.length} aseguradoras
          </p>
        </div>
      </div>

      {/* Best pick banner */}
      {best && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orion-gold/10 border border-orion-gold/30">
          <Star className="w-5 h-5 text-orion-gold flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orion-gold">
              Mejor opción: {best.insurerName} – {best.productName}
            </p>
            {best.recommendationReason && (
              <p className="text-xs text-orion-text-secondary mt-0.5">{best.recommendationReason}</p>
            )}
          </div>
          <span className="text-lg font-bold text-orion-text-primary">
            ${best.annualPremium.toLocaleString('es-MX')} / año
          </span>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((r: QuotationResult, idx: number) => {
          const coverageEntries = r.coverage ? Object.entries(r.coverage) : []
          const booleans  = coverageEntries.filter(([, v]) => typeof v === 'boolean')
          const numerics  = coverageEntries.filter(([, v]) => typeof v === 'number')

          return (
            <div
              key={r.id}
              className={`rounded-xl border flex flex-col gap-0 overflow-hidden transition-all ${
                r.isRecommended
                  ? 'border-orion-gold/40 shadow-glow-gold/10'
                  : 'border-orion-border hover:border-orion-border-light'
              }`}
            >
              {/* ── Header de la aseguradora ── */}
              <div className={`p-4 flex items-start justify-between gap-2 ${
                r.isRecommended
                  ? 'bg-gradient-to-br from-orion-gold/10 to-orion-surface'
                  : 'bg-orion-elevated'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-base">🥇</span>}
                    {idx === 1 && <span className="text-base">🥈</span>}
                    {idx === 2 && <span className="text-base">🥉</span>}
                    <p className="font-semibold text-orion-text-primary truncate">{r.insurerName}</p>
                  </div>
                  <p className="text-xs text-orion-text-muted mt-0.5 truncate">{r.productName}</p>

                  {/* Links de la aseguradora */}
                  <div className="flex items-center gap-3 mt-2">
                    {r.insurerPortalUrl && (
                      <a
                        href={r.insurerPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-orion-primary hover:text-orion-accent transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver oferta
                      </a>
                    )}
                    {r.insurerWebsite && (
                      <a
                        href={r.insurerWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-orion-text-muted hover:text-orion-text-secondary transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        Sitio web
                      </a>
                    )}
                  </div>
                </div>
                {r.isRecommended && <Badge variant="gold">Recomendado</Badge>}
              </div>

              <div className="p-4 bg-orion-surface flex flex-col gap-4 flex-1">
                {/* Pricing */}
                <div className="bg-orion-elevated rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orion-text-primary">
                    ${r.annualPremium.toLocaleString('es-MX')}
                  </p>
                  <p className="text-xs text-orion-text-muted">prima anual</p>
                  <p className="text-sm text-orion-text-secondary mt-1">
                    ${r.monthlyPremium.toLocaleString('es-MX')} / mes
                  </p>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orion-text-muted flex-shrink-0" />
                  <div className="flex-1 bg-orion-elevated rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${scoreColor(r.recommendationScore)}`}
                      style={{ width: `${r.recommendationScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-orion-text-secondary w-6 text-right">
                    {r.recommendationScore}
                  </span>
                </div>

                {/* Deductible */}
                <div className="flex items-center justify-between text-sm border-b border-orion-border pb-3">
                  <span className="text-orion-text-muted flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Deducible
                  </span>
                  <span className="text-orion-text-primary font-medium">
                    {r.deductible === 0 ? 'Sin deducible' : `$${r.deductible.toLocaleString('es-MX')}`}
                  </span>
                </div>

                {/* Numeric coverage values */}
                {numerics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-orion-text-muted uppercase tracking-wide">Montos</p>
                    {numerics.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="text-orion-text-muted">{labelFor(k)}</span>
                        <span className="text-orion-text-primary font-medium tabular-nums">
                          {formatCoverageValue(k, v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boolean coverages */}
                {booleans.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-orion-text-muted uppercase tracking-wide">Coberturas</p>
                    <div className="grid grid-cols-1 gap-1">
                      {booleans.map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 text-xs">
                          {v ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-orion-text-muted/50 flex-shrink-0" />
                          )}
                          <span className={v ? 'text-orion-text-secondary' : 'text-orion-text-muted/60 line-through'}>
                            {labelFor(k)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation reason */}
                {r.recommendationReason && (
                  <p className="text-xs text-orion-text-muted italic border-t border-orion-border pt-3">
                    {r.recommendationReason}
                  </p>
                )}

                {/* Screenshot de Playwright */}
                {r.screenshotUrl && (
                  <div className="border-t border-orion-border pt-3">
                    <p className="text-xs font-medium text-orion-text-muted uppercase tracking-wide mb-2">
                      Captura del portal
                    </p>
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'}${r.screenshotUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'}${r.screenshotUrl}`}
                        alt={`Captura ${r.insurerName}`}
                        className="w-full rounded-lg border border-orion-border group-hover:border-orion-primary transition-colors"
                      />
                      <p className="text-xs text-orion-primary mt-1 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Ver captura completa
                      </p>
                    </a>
                  </div>
                )}

                {r.validUntil && (
                  <p className="text-xs text-orion-text-muted text-right">
                    Válida hasta {new Date(r.validUntil).toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
