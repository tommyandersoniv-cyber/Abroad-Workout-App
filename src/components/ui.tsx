// Shared retro UI primitives.
import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  title,
  accent,
  dataTour,
}: {
  children: ReactNode
  className?: string
  title?: string
  accent?: 'you' | 'rival' | 'gold' | 'save'
  dataTour?: string
}) {
  const accentColor =
    accent === 'you'
      ? 'text-you'
      : accent === 'rival'
        ? 'text-rival'
        : accent === 'gold'
          ? 'text-gold'
          : accent === 'save'
            ? 'text-save'
            : 'text-dim'
  return (
    <section className={`panel relative p-3 ${className}`} data-tour={dataTour}>
      {title && (
        <h2 className={`font-pixel text-[9px] mb-2 ${accentColor}`}>{title}</h2>
      )}
      {children}
    </section>
  )
}

export function PixelButton({
  children,
  onClick,
  variant = 'default',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'you' | 'rival' | 'gold' | 'save'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const v =
    variant === 'you'
      ? 'btn-you'
      : variant === 'rival'
        ? 'btn-rival'
        : variant === 'gold'
          ? 'btn-gold'
          : variant === 'save'
            ? 'btn-save'
            : ''
  return (
    <button type={type} className={`btn ${v} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

/** A cumulative XP bar with a label, value and animated fill. */
export function XPBar({
  label,
  value,
  max,
  color,
  align = 'left',
}: {
  label: string
  value: number
  max: number
  color: 'me' | 'ymmot' | 'tommy'
  align?: 'left' | 'right'
}) {
  const pct = max <= 0 ? 0 : Math.max(2, Math.min(100, (value / max) * 100))
  const fill =
    color === 'me' ? 'var(--color-you)' : color === 'ymmot' ? 'var(--color-ymmot)' : 'var(--color-tommy)'
  const text = color === 'me' ? 'text-you' : color === 'ymmot' ? 'text-ymmot' : 'text-tommy'
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className={`font-pixel text-[8px] ${text}`}>{label}</span>
        <span className="font-pixel text-[10px]">{Math.round(value).toLocaleString()}</span>
      </div>
      <div className="hud h-4 mt-1 p-[2px]">
        <div
          className="bar-fill h-full"
          style={{
            width: `${pct}%`,
            background: fill,
            marginLeft: align === 'right' ? 'auto' : undefined,
          }}
        />
      </div>
    </div>
  )
}

export function Stat({ label, value, color = 'text-ink-text' }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="text-center">
      <div className={`font-pixel text-[14px] ${color}`}>{value}</div>
      <div className="font-term text-dim text-sm uppercase tracking-wide">{label}</div>
    </div>
  )
}
