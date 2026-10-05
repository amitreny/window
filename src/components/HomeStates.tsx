import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { currentPlace } from '../lib/geolocate'
import { placeId, placeTitle, type Place } from '../lib/openMeteo'
import { useStore } from '../state/store'
import { Attribution, CARD, Icon } from './ui'

const place = (name: string, country: string, countryCode: string, latitude: number, longitude: number): Place => ({
  id: placeId(latitude, longitude),
  name,
  country,
  countryCode,
  latitude,
  longitude,
})

const QUICK_START = [
  { icon: 'beach_access', place: place('Tel Aviv', 'Israel', 'IL', 32.0809, 34.7806) },
  { icon: 'directions_bike', place: place('London', 'United Kingdom', 'GB', 51.5085, -0.1257) },
  { icon: 'landscape', place: place('Chamonix', 'France', 'FR', 45.9237, 6.8694) },
]

/** Button that asks the browser for a position and makes it the active place. */
export function UseMyLocation({ className, children, onLocated }: { className: string; children: ReactNode; onLocated?: () => void }) {
  const { selectPlace } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function locate() {
    setBusy(true)
    setError(null)
    try {
      selectPlace(await currentPlace())
      onLocated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't get your location.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={locate} disabled={busy} className={className}>
        {children}
      </button>
      {error && (
        <p role="alert" className="mt-2 px-1 text-body-sm text-tertiary">
          {error}
        </p>
      )}
    </div>
  )
}

export function FirstLaunch() {
  const { selectPlace } = useStore()
  return (
    <div className="flex flex-col w-full px-gutter space-y-6 pt-4">
      <div className="pt-2">
        <h1 className="text-[28px] leading-[1.2] font-extrabold tracking-[-0.03em] text-on-surface">Where are you heading outside?</h1>
        <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
          Window finds the best time in the next 48 hours to run, ride, swim, stargaze or dry the laundry.
        </p>
      </div>

      <Link to="/search" className={`${CARD} flex items-center gap-3 px-5 py-4 border border-surface-container-high/60`}>
        <Icon name="search" className="text-[22px] text-on-surface-variant" />
        <span className="text-body-md text-on-surface-variant/70">Search a city</span>
      </Link>

      <UseMyLocation className="w-full flex items-center gap-3 p-4 rounded-[20px] bg-primary text-on-primary shadow-sm hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60">
        <span className="w-10 h-10 rounded-full bg-on-primary/15 flex items-center justify-center shrink-0">
          <Icon name="my_location" className="text-[20px]" />
        </span>
        <span className="text-left text-[16px] font-bold leading-snug">Use my current location</span>
      </UseMyLocation>

      <div className="space-y-3 pt-2">
        <h2 className="px-1 text-label-md uppercase tracking-wider text-on-surface-variant">Or start with</h2>
        <div className="space-y-2.5">
          {QUICK_START.map(({ icon, place }) => (
            <button
              key={place.id}
              type="button"
              onClick={() => selectPlace(place)}
              className="w-full text-left rounded-[18px] bg-surface-container-lowest p-3.5 shadow-card border border-surface-container-high/40 flex items-center justify-between hover:bg-surface-container-low/60 active:scale-[0.99] transition-all"
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                  <Icon name={icon} className="text-[20px]" />
                </span>
                <span className="text-[15px] font-bold text-on-surface">{placeTitle(place)}</span>
              </span>
              <Icon name="chevron_right" className="text-[18px] text-outline-variant" />
            </button>
          ))}
        </div>
      </div>

      <Attribution />
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading forecast" className="space-y-space-md">
      <div className={`${CARD} p-space-md`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 w-40 rounded-md skeleton" />
          <div className="h-5 w-16 rounded-full skeleton" />
        </div>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-12 w-44 rounded-xl skeleton" />
            <div className="h-4 w-32 rounded-md skeleton" />
          </div>
          <div className="w-16 h-16 rounded-full skeleton" />
        </div>
        <div className="mt-4 h-10 rounded-xl skeleton" />
      </div>

      <div className={`${CARD} p-space-md space-y-4`}>
        <div className="h-5 w-32 rounded-md skeleton" />
        <div className="flex items-end gap-[3px] h-24 overflow-hidden">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 rounded-t-sm skeleton" style={{ height: 24 + ((i * 37) % 56) }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[88px] rounded-[16px] skeleton" />
        ))}
      </div>
    </div>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 max-w-sm mx-auto">
      <div className="w-28 h-28 mb-8 rounded-full bg-surface-container-low/60 flex items-center justify-center">
        <svg className="w-20 h-20 text-primary-container" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M19 44H46a10 10 0 0 0 3-19.5 12 12 0 0 0-22.5-4.8A10 10 0 0 0 19 44z" />
          <line x1="12" x2="52" y1="52" y2="12" strokeWidth="2.25" />
        </svg>
      </div>
      <h2 className="text-[24px] font-bold text-on-surface tracking-tight leading-tight mb-2.5">Couldn't load the forecast</h2>
      <p className="text-body-md text-on-surface-variant leading-relaxed mb-8 max-w-xs">
        {navigator.onLine ? "Open-Meteo didn't answer. It may be busy, so try again in a moment." : "You're offline. Reconnect and try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="w-full py-3.5 px-6 rounded-full bg-primary-container text-white text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
      >
        <Icon name="refresh" className="text-[20px]" />
        Try again
      </button>
      <p className="text-[12px] text-on-surface-variant/80 mt-4">Showing nothing rather than old data</p>
    </div>
  )
}
