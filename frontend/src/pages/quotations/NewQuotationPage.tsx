import { useState } from 'react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import { quotationService } from '@/services/quotationService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { InsuranceType } from '@/types'

const INSURANCE_TYPES: { value: InsuranceType; label: string; icon: string; description: string }[] = [
  { value: 'Auto', label: 'Automóvil', icon: '🚗', description: 'Cobertura para vehículos' },
  { value: 'Life', label: 'Vida', icon: '❤️', description: 'Protección para tu familia' },
  { value: 'Health', label: 'Salud', icon: '🏥', description: 'Gastos médicos mayores' },
  { value: 'Home', label: 'Hogar', icon: '🏠', description: 'Protección del inmueble' },
  { value: 'Business', label: 'Empresarial', icon: '🏢', description: 'Seguros comerciales' },
  { value: 'Travel', label: 'Viaje', icon: '✈️', description: 'Cobertura en viajes' },
  { value: 'Liability', label: 'Responsabilidad', icon: '⚖️', description: 'Responsabilidad civil' },
]

// ── Schemas por tipo de seguro ──────────────────────────────────────────────
const autoSchema = z.object({
  brand: z.string().min(1, 'Requerido'),
  model: z.string().min(1, 'Requerido'),
  year: z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  version: z.string().optional(),
  vehicleValue: z.coerce.number().min(1, 'Ingresa el valor comercial'),
  use: z.enum(['Personal', 'Comercial', 'Plataformas']),
  vin: z.string().optional(),
  postalCode: z.string().min(5, 'CP inválido').max(5),
  driverName: z.string().min(2, 'Requerido'),
  driverBirthDate: z.string().min(1, 'Requerido'),
  driverLicenseYears: z.coerce.number().min(0).max(60),
  maritalStatus: z.enum(['Soltero', 'Casado', 'Otro']),
  coverageType: z.enum(['Amplia', 'LimitadaPlus', 'Limitada', 'RCV']),
})

const lifeSchema = z.object({
  insuredAge: z.coerce.number().min(18).max(75),
  gender: z.enum(['Masculino', 'Femenino']),
  sumAssured: z.coerce.number().min(100000, 'Mínimo $100,000'),
  policyType: z.enum(['Temporal10', 'Temporal20', 'VidaEntera']),
  isSmoker: z.enum(['No', 'Si']),
  beneficiaries: z.string().optional(),
})

const healthSchema = z.object({
  insuredAge: z.coerce.number().min(0).max(80),
  gender: z.enum(['Masculino', 'Femenino']),
  coverageType: z.enum(['Individual', 'Pareja', 'Familiar']),
  membersCount: z.coerce.number().min(1).max(10),
  desiredDeductible: z.coerce.number().min(0),
  hasPreexistingConditions: z.enum(['No', 'Si']),
  maternityRider: z.enum(['No', 'Si']),
  dentalRider: z.enum(['No', 'Si']),
})

const homeSchema = z.object({
  postalCode: z.string().min(5, 'CP inválido').max(5),
  propertyType: z.enum(['Casa', 'Departamento', 'Local']),
  propertyValue: z.coerce.number().min(1, 'Requerido'),
  squareMeters: z.coerce.number().min(1, 'Requerido'),
  contentsValue: z.coerce.number().min(0),
  constructionType: z.enum(['Mampostería', 'Madera', 'Mixta']),
  isOwner: z.enum(['Propietario', 'Arrendatario']),
})

const businessSchema = z.object({
  businessType: z.string().min(2, 'Requerido'),
  employeesCount: z.coerce.number().min(1),
  assetsValue: z.coerce.number().min(1, 'Requerido'),
  annualRevenue: z.coerce.number().min(0),
  postalCode: z.string().min(5, 'CP inválido').max(5),
  coverages: z.string().optional(),
})

const travelSchema = z.object({
  destination: z.string().min(2, 'Requerido'),
  departureDate: z.string().min(1, 'Requerido'),
  returnDate: z.string().min(1, 'Requerido'),
  travelersCount: z.coerce.number().min(1).max(20),
  tripType: z.enum(['Nacional', 'Internacional', 'MultiViaje']),
  coverageAmount: z.coerce.number().min(0),
})

const liabilitySchema = z.object({
  liabilityType: z.enum(['Civil', 'Profesional', 'Patronal', 'Productos']),
  coverageLimit: z.coerce.number().min(1, 'Requerido'),
  activityDescription: z.string().min(5, 'Describe la actividad'),
  annualRevenue: z.coerce.number().min(0),
  employeesCount: z.coerce.number().min(0),
})

type AutoData = z.infer<typeof autoSchema>
type LifeData = z.infer<typeof lifeSchema>
type HealthData = z.infer<typeof healthSchema>
type HomeData = z.infer<typeof homeSchema>
type BusinessData = z.infer<typeof businessSchema>
type TravelData = z.infer<typeof travelSchema>
type LiabilityData = z.infer<typeof liabilitySchema>

const step3Schema = z.object({
  clientId: z.string().uuid('Selecciona un cliente válido'),
  notes: z.string().optional(),
})
type Step3Data = z.infer<typeof step3Schema>

// ── Helper ──────────────────────────────────────────────────────────────────
function SelectField({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-orion-text-secondary">{label}</label>
      <select
        className={`w-full px-3 py-2 rounded-lg bg-orion-elevated border text-sm text-orion-text-primary focus:outline-none focus:ring-1 focus:ring-orion-primary ${error ? 'border-red-500' : 'border-orion-border'}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

export default function NewQuotationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<InsuranceType | null>(null)
  const [requestData, setRequestData] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const STEPS = ['Tipo de Seguro', 'Datos del Riesgo', 'Datos del Cliente', 'Confirmar']

  // ── Forms por tipo ────────────────────────────────────────────────────────
  const autoForm = useForm<AutoData>({ resolver: zodResolver(autoSchema) })
  const lifeForm = useForm<LifeData>({ resolver: zodResolver(lifeSchema) })
  const healthForm = useForm<HealthData>({ resolver: zodResolver(healthSchema) })
  const homeForm = useForm<HomeData>({ resolver: zodResolver(homeSchema) })
  const businessForm = useForm<BusinessData>({ resolver: zodResolver(businessSchema) })
  const travelForm = useForm<TravelData>({ resolver: zodResolver(travelSchema) })
  const liabilityForm = useForm<LiabilityData>({ resolver: zodResolver(liabilitySchema) })

  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  const handleTypeSelect = (type: InsuranceType) => {
    setSelectedType(type)
    setStep(2)
  }

  const handleRiskData = (data: Record<string, unknown>) => {
    setRequestData(prev => ({ ...prev, ...data }))
    setStep(3)
  }

  const handleStep3 = (data: Step3Data) => {
    setRequestData(prev => ({ ...prev, ...data }))
    setStep(4)
  }

  const handleConfirm = async () => {
    if (!selectedType) return
    setIsSubmitting(true)
    setError('')
    try {
      const result = await quotationService.createQuotation({
        clientId: requestData.clientId as string,
        insuranceType: selectedType,
        requestData,
        notes: requestData.notes as string | undefined,
      })
      navigate(`/quotations/${result.id}`)
    } catch {
      setError('Error al crear la cotización. Intenta nuevamente.')
      setIsSubmitting(false)
    }
  }

  // ── Render risk form per type ───────────────────────────────────────────────
  const renderRiskForm = () => {
    if (selectedType === 'Auto') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = autoForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marca" placeholder="Toyota, Nissan..." error={e.brand?.message} {...r('brand')} />
            <Input label="Modelo" placeholder="Corolla, Versa..." error={e.model?.message} {...r('model')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Año" type="number" placeholder={String(new Date().getFullYear())} error={e.year?.message} {...r('year')} />
            <Input label="Versión / Trim" placeholder="XLE, SR, Base..." {...r('version')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor comercial ($)" type="number" placeholder="350000" error={e.vehicleValue?.message} {...r('vehicleValue')} />
            <Input label="VIN (opcional)" placeholder="3VWFE21C..." {...r('vin')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Uso del vehículo" error={e.use?.message} {...r('use')}>
              <option value="Personal">Personal</option>
              <option value="Comercial">Comercial</option>
              <option value="Plataformas">Plataformas (Uber/Didi)</option>
            </SelectField>
            <SelectField label="Tipo de cobertura" error={e.coverageType?.message} {...r('coverageType')}>
              <option value="Amplia">Amplia</option>
              <option value="LimitadaPlus">Limitada Plus</option>
              <option value="Limitada">Limitada</option>
              <option value="RCV">Solo RC/DT</option>
            </SelectField>
          </div>
          <div className="border-t border-orion-border pt-4 mt-2">
            <p className="text-xs text-orion-text-muted mb-3 font-medium uppercase tracking-wider">Conductor principal</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre completo" placeholder="Juan García López" error={e.driverName?.message} {...r('driverName')} />
              <Input label="Fecha de nacimiento" type="date" error={e.driverBirthDate?.message} {...r('driverBirthDate')} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Input label="Antigüedad licencia (años)" type="number" placeholder="5" error={e.driverLicenseYears?.message} {...r('driverLicenseYears')} />
              <SelectField label="Estado civil" error={e.maritalStatus?.message} {...r('maritalStatus')}>
                <option value="Soltero">Soltero/a</option>
                <option value="Casado">Casado/a</option>
                <option value="Otro">Otro</option>
              </SelectField>
              <Input label="CP del asegurado" placeholder="06600" maxLength={5} error={e.postalCode?.message} {...r('postalCode')} />
            </div>
          </div>
        </form>
      )
    }

    if (selectedType === 'Life') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = lifeForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Edad del asegurado" type="number" placeholder="35" error={e.insuredAge?.message} {...r('insuredAge')} />
            <SelectField label="Género" error={e.gender?.message} {...r('gender')}>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Suma asegurada ($)" type="number" placeholder="1000000" error={e.sumAssured?.message} {...r('sumAssured')} />
            <SelectField label="Tipo de póliza" error={e.policyType?.message} {...r('policyType')}>
              <option value="Temporal10">Temporal 10 años</option>
              <option value="Temporal20">Temporal 20 años</option>
              <option value="VidaEntera">Vida entera</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="¿Fumador?" error={e.isSmoker?.message} {...r('isSmoker')}>
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </SelectField>
            <Input label="Beneficiarios (opcional)" placeholder="María García 100%" {...r('beneficiaries')} />
          </div>
        </form>
      )
    }

    if (selectedType === 'Health') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = healthForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Edad (titular)" type="number" placeholder="35" error={e.insuredAge?.message} {...r('insuredAge')} />
            <SelectField label="Género" error={e.gender?.message} {...r('gender')}>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Tipo de cobertura" error={e.coverageType?.message} {...r('coverageType')}>
              <option value="Individual">Individual</option>
              <option value="Pareja">Pareja</option>
              <option value="Familiar">Familiar</option>
            </SelectField>
            <Input label="Número de integrantes" type="number" placeholder="1" error={e.membersCount?.message} {...r('membersCount')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deducible deseado ($)" type="number" placeholder="5000" error={e.desiredDeductible?.message} {...r('desiredDeductible')} />
            <SelectField label="Padecimientos previos" error={e.hasPreexistingConditions?.message} {...r('hasPreexistingConditions')}>
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Incluir cobertura maternidad" error={e.maternityRider?.message} {...r('maternityRider')}>
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </SelectField>
            <SelectField label="Incluir cobertura dental" error={e.dentalRider?.message} {...r('dentalRider')}>
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </SelectField>
          </div>
        </form>
      )
    }

    if (selectedType === 'Home') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = homeForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="CP del inmueble" placeholder="06600" maxLength={5} error={e.postalCode?.message} {...r('postalCode')} />
            <SelectField label="Tipo de propiedad" error={e.propertyType?.message} {...r('propertyType')}>
              <option value="Casa">Casa</option>
              <option value="Departamento">Departamento</option>
              <option value="Local">Local comercial</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor del inmueble ($)" type="number" placeholder="3000000" error={e.propertyValue?.message} {...r('propertyValue')} />
            <Input label="Metros cuadrados" type="number" placeholder="120" error={e.squareMeters?.message} {...r('squareMeters')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor de contenidos ($)" type="number" placeholder="150000" error={e.contentsValue?.message} {...r('contentsValue')} />
            <SelectField label="Tipo de construcción" error={e.constructionType?.message} {...r('constructionType')}>
              <option value="Mampostería">Mampostería / Concreto</option>
              <option value="Madera">Madera</option>
              <option value="Mixta">Mixta</option>
            </SelectField>
          </div>
          <SelectField label="Relación con el inmueble" error={e.isOwner?.message} {...r('isOwner')}>
            <option value="Propietario">Propietario</option>
            <option value="Arrendatario">Arrendatario</option>
          </SelectField>
        </form>
      )
    }

    if (selectedType === 'Business') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = businessForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Giro del negocio" placeholder="Restaurante, Tienda, Oficina..." error={e.businessType?.message} {...r('businessType')} />
            <Input label="Número de empleados" type="number" placeholder="10" error={e.employeesCount?.message} {...r('employeesCount')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor de activos ($)" type="number" placeholder="2000000" error={e.assetsValue?.message} {...r('assetsValue')} />
            <Input label="Ingresos anuales ($)" type="number" placeholder="5000000" error={e.annualRevenue?.message} {...r('annualRevenue')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="CP del negocio" placeholder="06600" maxLength={5} error={e.postalCode?.message} {...r('postalCode')} />
            <Input label="Coberturas adicionales (opcional)" placeholder="RC, Equipo electrónico..." {...r('coverages')} />
          </div>
        </form>
      )
    }

    if (selectedType === 'Travel') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = travelForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Destino" placeholder="Europa, Estados Unidos..." error={e.destination?.message} {...r('destination')} />
            <SelectField label="Tipo de viaje" error={e.tripType?.message} {...r('tripType')}>
              <option value="Nacional">Nacional</option>
              <option value="Internacional">Internacional</option>
              <option value="MultiViaje">Multi-viaje anual</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha de salida" type="date" error={e.departureDate?.message} {...r('departureDate')} />
            <Input label="Fecha de regreso" type="date" error={e.returnDate?.message} {...r('returnDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Número de viajeros" type="number" placeholder="2" error={e.travelersCount?.message} {...r('travelersCount')} />
            <Input label="Cobertura médica deseada ($)" type="number" placeholder="100000" error={e.coverageAmount?.message} {...r('coverageAmount')} />
          </div>
        </form>
      )
    }

    if (selectedType === 'Liability') {
      const { register: r, handleSubmit: hs, formState: { errors: e } } = liabilityForm
      return (
        <form id="riskform" onSubmit={hs(handleRiskData as Parameters<typeof hs>[0])} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Tipo de responsabilidad" error={e.liabilityType?.message} {...r('liabilityType')}>
              <option value="Civil">Civil General</option>
              <option value="Profesional">Profesional (E&O)</option>
              <option value="Patronal">Patronal</option>
              <option value="Productos">Productos</option>
            </SelectField>
            <Input label="Límite de cobertura ($)" type="number" placeholder="5000000" error={e.coverageLimit?.message} {...r('coverageLimit')} />
          </div>
          <Input label="Descripción de la actividad" placeholder="Consultoría de TI, venta de alimentos..." error={e.activityDescription?.message} {...r('activityDescription')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ingresos anuales ($)" type="number" placeholder="3000000" error={e.annualRevenue?.message} {...r('annualRevenue')} />
            <Input label="Número de empleados" type="number" placeholder="5" error={e.employeesCount?.message} {...r('employeesCount')} />
          </div>
        </form>
      )
    }

    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-orion-text-primary">Nueva Cotización</h1>
        <p className="text-sm text-orion-text-muted mt-0.5">
          Sistema ORION solicitará cotizaciones a todas las aseguradoras activas
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-orion-primary' : 'text-orion-text-muted'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                i + 1 < step ? 'bg-orion-primary border-orion-primary text-white' :
                i + 1 === step ? 'border-orion-primary text-orion-primary' :
                'border-orion-border text-orion-text-muted'
              }`}>
                {i + 1 < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i + 1 < step ? 'bg-orion-primary' : 'bg-orion-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 – Insurance Type */}
      {step === 1 && (
        <Card>
          <Card.Header><Card.Title>¿Qué tipo de seguro necesitas?</Card.Title></Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INSURANCE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleTypeSelect(t.value)}
                  className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                    selectedType === t.value
                      ? 'border-orion-primary bg-orion-primary/10 shadow-glow-blue/20'
                      : 'border-orion-border bg-orion-elevated hover:border-orion-border-light'
                  }`}
                >
                  <span className="text-2xl mb-2">{t.icon}</span>
                  <span className="text-sm font-medium text-orion-text-primary">{t.label}</span>
                  <span className="text-xs text-orion-text-muted mt-0.5 text-center">{t.description}</span>
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 2 – Risk-specific data */}
      {step === 2 && (
        <Card>
          <Card.Header>
            <Card.Title>Datos del riesgo</Card.Title>
            <span className="text-sm text-orion-text-muted">
              {INSURANCE_TYPES.find(t => t.value === selectedType)?.icon}{' '}
              {INSURANCE_TYPES.find(t => t.value === selectedType)?.label}
            </span>
          </Card.Header>
          <Card.Body>
            {renderRiskForm()}
          </Card.Body>
        </Card>
      )}

      {/* Step 3 – Client */}
      {step === 3 && (
        <Card>
          <Card.Header>
            <Card.Title>Datos del Cliente</Card.Title>
            <span className="text-sm text-orion-text-muted">Seguro: {selectedType}</span>
          </Card.Header>
          <Card.Body>
            <form id="step3form" onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
              <Input
                label="ID del Cliente"
                placeholder="UUID del cliente"
                error={step3Form.formState.errors.clientId?.message}
                hint="Ingresa el identificador del cliente en el sistema"
                {...step3Form.register('clientId')}
              />
              <Input
                label="Notas del asesor (opcional)"
                placeholder="Condiciones especiales, observaciones..."
                {...step3Form.register('notes')}
              />
            </form>
          </Card.Body>
        </Card>
      )}

      {/* Step 4 – Confirm */}
      {step === 4 && (
        <Card glow="blue">
          <Card.Header><Card.Title>Confirmar Solicitud</Card.Title></Card.Header>
          <Card.Body>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-orion-border">
                <span className="text-sm text-orion-text-muted">Tipo de seguro</span>
                <span className="text-sm font-medium text-orion-text-primary">
                  {INSURANCE_TYPES.find(t => t.value === selectedType)?.icon} {selectedType}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-orion-border">
                <span className="text-sm text-orion-text-muted">Cliente ID</span>
                <span className="text-xs font-mono text-orion-text-primary">{requestData.clientId as string}</span>
              </div>
              {Object.entries(requestData)
                .filter(([k]) => !['clientId', 'notes'].includes(k))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5">
                    <span className="text-xs text-orion-text-muted capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-xs text-orion-text-primary">{String(v)}</span>
                  </div>
                ))}
              {requestData.notes && (
                <div className="flex justify-between py-2 border-t border-orion-border mt-1">
                  <span className="text-sm text-orion-text-muted">Notas</span>
                  <span className="text-sm text-orion-text-primary">{requestData.notes as string}</span>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
            <div className="mt-4 p-3 bg-orion-primary/5 rounded-lg border border-orion-primary/20">
              <p className="text-xs text-orion-text-secondary">
                ORION enviará esta solicitud a todas las aseguradoras activas mediante el sistema de scraping automatizado.
                Recibirás los resultados en tiempo real conforme vayan llegando.
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
        >
          Anterior
        </Button>

        {step === 2 && (
          <Button
            type="submit"
            form="riskform"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        )}

        {step === 3 && (
          <Button
            type="submit"
            form="step3form"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        )}

        {step === 4 && (
          <Button
            onClick={handleConfirm}
            isLoading={isSubmitting}
            variant="gold"
          >
            Enviar Cotización
          </Button>
        )}
      </div>
    </div>
  )
}
