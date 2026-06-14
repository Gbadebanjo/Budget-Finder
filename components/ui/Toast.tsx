'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Icon } from './Icon'

type ToastTone = 'success' | 'danger' | 'info'
interface Toast { id: number; tone: ToastTone; title: string; description?: string }

const ToastContext = createContext<{ push: (t: Omit<Toast, 'id'>) => void } | null>(null)
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { ...t, id }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto glass-strong rounded-2xl px-4 py-3 shadow-md flex items-start gap-3 fade-in"
          >
            <div className={
              t.tone === 'success' ? 'text-success' :
              t.tone === 'danger'  ? 'text-danger' : 'text-info'
            }>
              <Icon
                name={t.tone === 'success' ? 'check' : t.tone === 'danger' ? 'x' : 'sparkles'}
                size={18}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="text-xs text-muted mt-0.5">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Self-mounting toast root for app shell — relies on global event. */
export function ToastDispatcher() {
  const { push } = useToast()
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Omit<Toast, 'id'>>).detail
      if (detail) push(detail)
    }
    window.addEventListener('finflow:toast', handler)
    return () => window.removeEventListener('finflow:toast', handler)
  }, [push])
  return null
}

export function toast(t: { tone?: ToastTone; title: string; description?: string }) {
  window.dispatchEvent(new CustomEvent('finflow:toast', { detail: { tone: 'info' as ToastTone, ...t } }))
}
