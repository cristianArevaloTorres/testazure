import { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: React.ReactNode
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
}

export default function Modal({ isOpen, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={clsx(
          'relative w-full bg-orion-surface border border-orion-border rounded-xl shadow-2xl',
          'animate-fade-in',
          sizes[size]
        )}
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-5 pb-4 border-b border-orion-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-base font-semibold text-orion-text-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-orion-text-secondary">{description}</p>
                )}
              </div>
              <Button variant="ghost" size="xs" onClick={onClose} className="mt-0.5 flex-shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-5 pt-0 flex items-center justify-end gap-3 border-t border-orion-border mt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
