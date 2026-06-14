'use client'

import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import Link from 'next/link'
import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'

// ─── Card ─────────────────────────────────────────────────
export function GlassCard({
  className,
  padded = true,
  strong = false,
  hover = false,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
  strong?: boolean
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        strong ? 'glass-strong' : 'glass',
        'rounded-2xl',
        padded && 'p-5 sm:p-6',
        hover && 'transition hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <header className="flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

// ─── Button ───────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'
type BtnSize = 'sm' | 'md' | 'lg' | 'icon'

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium ring-brand transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'

const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-accent text-accent-fg hover:bg-accent-hover shadow-sm',
  secondary: 'bg-surface border border-border text-tx hover:bg-surface-alt',
  ghost:     'text-muted hover:text-tx hover:bg-surface-alt',
  danger:    'bg-danger text-white hover:opacity-90',
  glass:     'glass text-tx hover:bg-surface-alt',
}

const btnSizes: Record<BtnSize, string> = {
  sm:   'h-8 px-3 text-xs',
  md:   'h-10 px-4 text-sm',
  lg:   'h-12 px-5 text-sm',
  icon: 'h-9 w-9',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  href?: string
  icon?: string
  iconRight?: string
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon,
  iconRight,
  loading,
  className,
  children,
  ...rest
}: ButtonProps) {
  const content = (
    <>
      {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {!loading && icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16} />}
    </>
  )

  const cls = cn(btnBase, btnVariants[variant], btnSizes[size], className)

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    )
  }
  return (
    <button className={cls} disabled={loading || rest.disabled} {...rest}>
      {content}
    </button>
  )
}

// ─── Stat ─────────────────────────────────────────────────
export function Stat({
  label,
  value,
  delta,
  hint,
  icon,
  accent,
  className,
}: {
  label: string
  value: React.ReactNode
  delta?: { value: number; label?: string }
  hint?: string
  icon?: string
  accent?: 'up' | 'down' | 'neutral'
  className?: string
}) {
  const deltaColor = delta && delta.value >= 0 ? 'text-money-up' : 'text-money-down'
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wide">
        {icon && <Icon name={icon} size={14} />}
        <span>{label}</span>
      </div>
      <div className={cn(
        'text-3xl font-semibold tabular tracking-tight pop-in',
        accent === 'up' && 'text-money-up',
        accent === 'down' && 'text-money-down',
      )}>
        {value}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {delta && (
          <span className={cn('inline-flex items-center gap-1 font-medium', deltaColor)}>
            <Icon name={delta.value >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={12} />
            {Math.abs(delta.value).toFixed(1)}%
            {delta.label && <span className="text-muted font-normal ml-0.5">{delta.label}</span>}
          </span>
        )}
        {hint && <span className="text-subtle">{hint}</span>}
      </div>
    </div>
  )
}

// ─── Chip / Badge ─────────────────────────────────────────
type ChipTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info'

const chipTone: Record<ChipTone, string> = {
  neutral: 'bg-surface-alt text-muted border-border',
  accent:  'bg-accent-soft text-accent border-accent-soft',
  success: 'bg-success-soft text-success border-transparent',
  danger:  'bg-danger-soft text-danger border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  info:    'bg-info-soft text-info border-transparent',
}

export function Chip({
  tone = 'neutral',
  icon,
  children,
  className,
  dot,
}: {
  tone?: ChipTone
  icon?: string
  dot?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        chipTone[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────
export function Avatar({
  name,
  src,
  size = 32,
  className,
}: { name?: string; src?: string | null; size?: number; className?: string }) {
  const initials = (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ''}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-semibold shrink-0',
        className,
      )}
    >
      {initials || '?'}
    </div>
  )
}

// ─── Inputs ───────────────────────────────────────────────
export function Field({
  label,
  hint,
  error,
  children,
}: { label?: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="block text-xs font-medium text-muted uppercase tracking-wide">{label}</span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-subtle">{hint}</span>}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-tx placeholder:text-subtle ring-brand transition focus:border-transparent focus:ring-4'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(inputBase, 'pr-10', className)}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md grid place-items-center text-muted hover:text-tx hover:bg-surface-alt transition"
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={15} />
      </button>
    </div>
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(inputBase, 'appearance-none pr-9 cursor-pointer', props.className)}
      >
        {props.children}
      </select>
      <Icon name="chevron-down" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────
export function EmptyState({
  icon = 'sparkles',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3">
        <Icon name={icon} size={22} />
      </div>
      <p className="text-sm font-semibold text-tx">{title}</p>
      {description && <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg', className)} />
}

// ─── Logo ─────────────────────────────────────────────────
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-sm"
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 17c4-6 8-6 12-2s5 4 6 0" />
        <path d="M4 7h4M14 12h4M10 17h2" />
      </svg>
    </span>
  )
}
