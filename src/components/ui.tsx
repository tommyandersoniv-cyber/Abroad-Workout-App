import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useStore } from '../store/useStore'

export function Card({ className = '', children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-line bg-card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function PillButton({
  variant = 'solid', className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' }) {
  const base = 'rounded-2xl px-5 py-4 text-[17px] font-medium transition active:scale-[0.98] disabled:opacity-40'
  const look = variant === 'solid' ? 'bg-ink text-on-ink' : 'border border-line text-ink bg-card'
  return <button className={`${base} ${look} ${className}`} {...rest} />
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="text-muted text-[15px] py-2 -ml-1 flex items-center gap-1">
      <span aria-hidden>←</span> {label}
    </button>
  )
}

/** Full-screen overlay used for sessions, settings and the reflection flow. */
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-bg overflow-y-auto">
      <div className="mx-auto max-w-md px-4 pt-safe pb-safe min-h-full">{children}</div>
    </div>
  )
}

type IconName = 'moon' | 'sun' | 'gear' | 'image' | 'check' | 'left' | 'right' | 'undo' | 'x' | 'play'

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className, 'aria-hidden': true,
  }
  switch (name) {
    case 'moon': return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    case 'gear': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
    case 'image': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-4.5-4.5L8 19" /><path d="M16 3.5v5M13.5 6h5" /></svg>
    case 'check': return <svg {...p} strokeWidth={2.4}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
    case 'left': return <svg {...p}><path d="m15 18-6-6 6-6" /></svg>
    case 'right': return <svg {...p}><path d="m9 18 6-6-6-6" /></svg>
    case 'undo': return <svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
    case 'x': return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
    case 'play': return <svg {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" /></svg>
  }
}

/** Round status mark used on habit rows. */
export function StatusMark({ status }: { status: 'done' | 'partial' | 'none' }) {
  if (status === 'done')
    return (
      <span className="grid place-items-center size-7 rounded-full bg-accent text-on-ink shrink-0">
        <Icon name="check" size={16} />
      </span>
    )
  if (status === 'partial')
    return <span className="size-7 rounded-full border-2 border-accent shrink-0" style={{ background: 'linear-gradient(90deg, var(--accent) 50%, transparent 50%)' }} />
  return <span className="size-7 rounded-full border-2 border-line shrink-0" />
}

/** Moon/sun button that flips light and dark mode. */
export function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme)
  const update = useStore((s) => s.updateSettings)
  const dark = theme === 'dark'
  return (
    <button aria-label="Toggle dark mode" className="p-2" onClick={() => update({ theme: dark ? 'light' : 'dark' })}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}
