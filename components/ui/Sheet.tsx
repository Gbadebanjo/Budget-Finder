'use client'

import { useEffect } from 'react'
import { Icon } from './Icon'
import { cn } from '@/lib/cn'

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          'relative w-full glass-strong sm:rounded-2xl rounded-t-3xl shadow-lg max-h-[90vh] flex flex-col',
          widths[size],
        )}
      >
        {(title || description) && (
          <header className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-3">
            <div>
              {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
              {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-surface-alt grid place-items-center text-muted"
              aria-label="Close"
            >
              <Icon name="x" size={16} />
            </button>
          </header>
        )}
        <div className="overflow-y-auto px-5 sm:px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}
