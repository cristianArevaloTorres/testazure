import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-orion-elevated text-orion-text-secondary border-orion-border',
  primary: 'bg-orion-primary/15 text-orion-primary border-orion-primary/25',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  gold: 'bg-orion-gold/15 text-orion-gold border-orion-gold/25',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-orion-text-muted',
  primary: 'bg-orion-primary',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
  gold: 'bg-orion-gold',
  purple: 'bg-purple-400',
}

export default function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

// Convenience component for quotation status
export function QuotationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    Pending: { label: 'Pendiente', variant: 'warning' },
    Processing: { label: 'Procesando', variant: 'primary' },
    Completed: { label: 'Completado', variant: 'success' },
    PartiallyCompleted: { label: 'Parcial', variant: 'info' },
    Failed: { label: 'Fallido', variant: 'danger' },
    Cancelled: { label: 'Cancelado', variant: 'default' },
    Expired: { label: 'Expirado', variant: 'default' },
    Draft: { label: 'Borrador', variant: 'purple' },
  }
  const config = map[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={config.variant} dot>{config.label}</Badge>
}
