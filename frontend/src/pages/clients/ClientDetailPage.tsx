import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText } from 'lucide-react'
import apiClient from '@/services/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { QuotationStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: client, isLoading: cLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/clients/${id}`)
      return data
    },
    enabled: !!id,
  })

  const { data: quotations, isLoading: qLoading } = useQuery({
    queryKey: ['client-quotations', id],
    queryFn: async () => {
      const { data } = await apiClient.get('/quotations', { params: { clientId: id, pageSize: 20 } })
      return data
    },
    enabled: !!id,
  })

  if (cLoading || qLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>Clientes</Button>
        </Link>
        <h1 className="text-xl font-bold text-orion-text-primary">{client?.fullName}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <Card.Header><Card.Title>Información del Cliente</Card.Title></Card.Header>
          <Card.Body className="space-y-3 text-sm">
            {client?.email && (
              <div className="flex items-center gap-2.5 text-orion-text-secondary">
                <Mail className="w-4 h-4 text-orion-text-muted" />
                {client.email}
              </div>
            )}
            {client?.phone && (
              <div className="flex items-center gap-2.5 text-orion-text-secondary">
                <Phone className="w-4 h-4 text-orion-text-muted" />
                {client.phone}
              </div>
            )}
            {(client?.state || client?.city) && (
              <div className="flex items-center gap-2.5 text-orion-text-secondary">
                <MapPin className="w-4 h-4 text-orion-text-muted" />
                {[client.city, client.state].filter(Boolean).join(', ')}
              </div>
            )}
            {client?.birthDate && (
              <div className="flex items-center gap-2.5 text-orion-text-secondary">
                <Calendar className="w-4 h-4 text-orion-text-muted" />
                {new Date(client.birthDate).toLocaleDateString('es-MX')}
              </div>
            )}
            {client?.advisorName && (
              <div className="pt-2 border-t border-orion-border">
                <p className="text-xs text-orion-text-muted">Asesor asignado</p>
                <p className="text-orion-text-primary font-medium mt-0.5">{client.advisorName}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>Cotizaciones ({quotations?.totalCount ?? 0})</Card.Title>
              <Link to={`/quotations/new`}>
                <Button size="xs" leftIcon={<FileText className="w-3 h-3" />}>Nueva</Button>
              </Link>
            </Card.Header>
            <Card.Body>
              {quotations?.items?.length === 0 ? (
                <p className="text-sm text-orion-text-muted py-4 text-center">Sin cotizaciones aún</p>
              ) : (
                <div className="space-y-2">
                  {quotations?.items?.map((q: { id: string; referenceNumber: string; insuranceType: string; status: string; createdAt: string }) => (
                    <Link
                      key={q.id}
                      to={`/quotations/${q.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-orion-elevated hover:bg-orion-elevated/70 transition-colors"
                    >
                      <div>
                        <p className="font-mono text-xs text-orion-primary">{q.referenceNumber}</p>
                        <p className="text-xs text-orion-text-muted mt-0.5">{q.insuranceType}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <QuotationStatusBadge status={q.status} />
                        <span className="text-xs text-orion-text-muted">{new Date(q.createdAt).toLocaleDateString('es-MX')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}
