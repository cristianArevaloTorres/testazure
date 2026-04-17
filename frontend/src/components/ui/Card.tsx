import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  glow?: 'blue' | 'gold' | 'none'
  hover?: boolean
}

export default function Card({ children, className, elevated, glow = 'none', hover }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border bg-orion-surface border-orion-border p-5',
        elevated && 'bg-orion-elevated',
        glow === 'blue' && 'shadow-glow-blue/20 border-orion-primary/20',
        glow === 'gold' && 'shadow-glow-gold/20 border-orion-gold/20',
        hover && 'hover:border-orion-border-light hover:shadow-card transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

Card.Title = function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-orion-text-primary', className)}>
      {children}
    </h3>
  )
}

Card.Body = function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('', className)}>{children}</div>
}
