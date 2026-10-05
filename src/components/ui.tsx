import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { Tier } from '../lib/scoring'

export function Icon({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  )
}

export const CARD = 'rounded-[20px] bg-surface-container-lowest shadow-card'

/** Colour classes for each score tier, so bars, badges and pills stay in step. */
export const TIER: Record<Tier, { label: string; bar: string; solid: string; soft: string; text: string; ring: string }> = {
  great: { label: 'Great', bar: 'bg-primary', solid: 'bg-primary text-on-primary', soft: 'bg-primary/10 text-primary', text: 'text-primary', ring: 'text-primary' },
  okay: {
    label: 'Okay',
    bar: 'bg-secondary-container',
    solid: 'bg-secondary-container text-on-secondary-container',
    soft: 'bg-secondary-container/20 text-secondary',
    text: 'text-secondary',
    ring: 'text-secondary-container',
  },
  poor: { label: 'Poor', bar: 'bg-tertiary', solid: 'bg-tertiary text-on-tertiary', soft: 'bg-tertiary/10 text-tertiary', text: 'text-tertiary', ring: 'text-tertiary' },
}

// Fixed bars share the page's centred mobile column on wide screens.
const FIXED = 'fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-surface/80 backdrop-blur-xl'

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M7 27V14a9 9 0 0 1 18 0v13M4 27h24M16 5v22M7 16h18" />
    </svg>
  )
}

function BrandHeader() {
  return (
    <header className={`${FIXED} top-0 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]`}>
      <div className="h-16 px-gutter flex items-center gap-space-xs">
        <Logo />
        <span className="text-headline-sm font-bold tracking-tight text-on-surface">Window</span>
      </div>
    </header>
  )
}

function BackHeader({ title, backTo, action }: { title: string; backTo: string; action?: ReactNode }) {
  return (
    <header className={`${FIXED} top-0 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]`}>
      <div className="h-16 px-gutter flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Link
            to={backTo}
            aria-label="Back"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Icon name="arrow_back" className="text-[24px]" />
          </Link>
          <h1 className="text-headline-sm font-bold tracking-tight text-on-surface">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  )
}

const TABS = [
  { to: '/', icon: 'wb_sunny', label: 'Windows' },
  { to: '/search', icon: 'bookmark', label: 'Places' },
  { to: '/tune', icon: 'tune', label: 'Limits' },
]

function BottomNav() {
  return (
    <nav className={`${FIXED} bottom-0 pb-safe shadow-[0_-1px_12px_rgba(0,0,0,0.03)]`}>
      <div className="flex justify-around items-center h-16 px-gutter">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1 ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <Icon name={tab.icon} className="text-[22px]" />
            <span className="text-label-md uppercase tracking-wider">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

interface ScreenProps {
  children: ReactNode
  /** Sub-screens get a back arrow and a title instead of the brand header and tab bar. */
  back?: { title: string; to: string; action?: ReactNode }
}

export function Screen({ children, back }: ScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[480px] min-h-[100dvh] flex flex-col">
      {back ? <BackHeader title={back.title} backTo={back.to} action={back.action} /> : <BrandHeader />}
      <main className={`flex-1 flex flex-col w-full pt-16 ${back ? 'pb-safe' : 'pb-28'}`}>{children}</main>
      {!back && <BottomNav />}
    </div>
  )
}

export function Attribution() {
  return (
    <p className="py-space-md text-center text-body-sm text-on-surface-variant/80">
      Weather data by{' '}
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold text-on-surface-variant hover:underline">
        Open-Meteo.com
      </a>
    </p>
  )
}
