import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftElement, rightElement, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-orion-text-secondary">
            {label}
            {props.required && <span className="text-orion-primary ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orion-text-muted">
              {leftElement}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full bg-orion-elevated border rounded-lg px-3 py-2.5 text-sm text-orion-text-primary',
              'placeholder-orion-text-muted transition-colors duration-200',
              'focus:outline-none focus:ring-1',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-orion-border focus:border-orion-primary focus:ring-orion-primary/30',
              leftElement && 'pl-9',
              rightElement && 'pr-9',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orion-text-muted">
              {rightElement}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-orion-text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
