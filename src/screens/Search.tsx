import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UseMyLocation } from '../components/HomeStates'
import { CARD, Icon, Screen, TIER } from '../components/ui'
import { usePlan } from '../hooks/useForecast'
import { ACTIVITIES } from '../lib/activities'
import { flagEmoji, placeRegion, searchPlaces, type Place } from '../lib/openMeteo'
import { tierOf } from '../lib/scoring'
import { dayLabel, formatTime } from '../lib/time'
import { useStore } from '../state/store'

const DEBOUNCE_MS = 250
const MIN_QUERY = 2

type Results = { status: 'idle' | 'loading' | 'error' } | { status: 'done'; places: Place[] }

export default function Search() {
  const { place: active, saved, activity, selectPlace } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results>({ status: 'idle' })
  const term = query.trim()

  useEffect(() => {
    if (term.length < MIN_QUERY) {
      setResults({ status: 'idle' })
      return
    }
    const controller = new AbortController()
    setResults({ status: 'loading' })
    const timer = setTimeout(() => {
      searchPlaces(term, controller.signal).then(
        (places) => setResults({ status: 'done', places }),
        () => controller.signal.aborted || setResults({ status: 'error' }),
      )
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  // Picking a place anywhere on this screen makes it active and returns to Home.
  const pick = (place: Place) => {
    selectPlace(place)
    navigate('/')
  }

  return (
    <Screen back={{ title: 'Places', to: '/' }}>
      <div className="w-full px-gutter py-space-md flex flex-col gap-space-lg">
        <label className={`${CARD} flex items-center w-full h-14 px-space-md focus-within:shadow-[0_12px_32px_-4px_rgba(26,26,26,0.08)] transition-shadow`}>
          <Icon name="search" className="text-[22px] text-on-surface-variant mr-space-sm" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city"
            aria-label="Search a city"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent text-headline-sm font-bold text-on-surface placeholder:text-outline/60 placeholder:font-normal focus:outline-none tracking-tight"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
        </label>

        <UseMyLocation onLocated={() => navigate('/')} className={`${CARD} group w-full flex items-center justify-between p-space-md active:scale-[0.99] transition-all disabled:opacity-60`}>
          <span className="flex items-center gap-space-sm">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <Icon name="near_me" className="text-[20px]" />
            </span>
            <span className="text-label-lg font-bold text-on-surface">Use my current location</span>
          </span>
          <Icon name="arrow_forward" className="text-[18px] text-outline group-hover:translate-x-0.5 transition-transform" />
        </UseMyLocation>

        {results.status !== 'idle' && (
          <section className="flex flex-col gap-space-xs" aria-live="polite">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-label-md uppercase tracking-[0.05em] text-on-surface-variant font-bold">Search results</h2>
              {results.status === 'done' && (
                <span className="text-label-md text-outline">
                  {results.places.length} {results.places.length === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>
            {results.status === 'loading' && <div className="h-16 rounded-[20px] skeleton" />}
            {results.status === 'error' && <p className="px-1 text-body-sm text-tertiary">Search didn't respond. Check your connection and try again.</p>}
            {results.status === 'done' && results.places.length === 0 && (
              <p className="px-1 text-body-sm text-on-surface-variant">No places match “{term}”. Try a nearby city.</p>
            )}
            {results.status === 'done' && results.places.length > 0 && (
              <div className={`${CARD} overflow-hidden flex flex-col divide-y divide-surface-container`}>
                {results.places.map((p) => (
                  <ResultRow key={p.id} place={p} term={term} active={p.id === active?.id} onPick={() => pick(p)} />
                ))}
              </div>
            )}
          </section>
        )}

        {saved.length > 0 && (
          <section className="flex flex-col gap-space-sm">
            <div className="px-1">
              <h2 className="text-headline-md font-bold tracking-tight text-on-surface">Saved places</h2>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Best window for <span className="font-semibold text-primary">{ACTIVITIES[activity].noun}</span> at each
              </p>
            </div>
            {saved.map((p) => (
              <SavedCard key={p.id} place={p} active={p.id === active?.id} onPick={() => pick(p)} />
            ))}
          </section>
        )}
      </div>
    </Screen>
  )
}

function ResultRow({ place, term, active, onPick }: { place: Place; term: string; active: boolean; onPick: () => void }) {
  // Highlight the part of the name the user typed.
  const at = place.name.toLowerCase().indexOf(term.toLowerCase())
  const name =
    at === -1 ? (
      place.name
    ) : (
      <>
        {place.name.slice(0, at)}
        <span className="text-primary">{place.name.slice(at, at + term.length)}</span>
        {place.name.slice(at + term.length)}
      </>
    )

  return (
    <button type="button" onClick={onPick} className="group flex items-center justify-between px-space-md py-space-sm text-left hover:bg-surface-container-low transition-colors">
      <span className="flex items-center gap-space-sm min-w-0">
        <span aria-hidden="true" className="text-xl shrink-0">
          {flagEmoji(place.countryCode)}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-headline-sm font-bold text-on-surface tracking-tight truncate">{name}</span>
          <span className="text-body-sm text-on-surface-variant truncate">{placeRegion(place)}</span>
        </span>
      </span>
      <span className="flex items-center gap-space-xs shrink-0 pl-space-xs">
        {active && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-md font-bold uppercase tracking-wider">Active</span>}
        <Icon name="north_east" className="text-[18px] text-outline group-hover:text-on-surface transition-colors" />
      </span>
    </button>
  )
}

function SavedCard({ place, active, onPick }: { place: Place; active: boolean; onPick: () => void }) {
  const { removePlace } = useStore()
  const { status, plan } = usePlan(place)
  const best = plan?.best
  const peak = plan && plan.peakIndex !== -1 ? plan.hours[plan.peakIndex] : null
  const score = best?.peak ?? peak?.score ?? null
  const when = best?.start ?? peak?.hour.time
  const tier = score == null ? null : TIER[tierOf(score)]

  return (
    <div className={`${CARD} flex items-center gap-space-xs p-space-md`}>
      <button type="button" onClick={onPick} className="flex items-center gap-space-md min-w-0 flex-1 text-left">
        <span className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 ${tier?.soft ?? 'bg-surface-container text-on-surface-variant'} ${status === 'loading' ? 'skeleton' : ''}`}>
          {status !== 'loading' && (
            <>
              <span className="text-[1.65rem] leading-none font-extrabold">{score ?? '–'}</span>
              {tier && <span className="text-[9px] tracking-wider uppercase font-bold mt-0.5">{tier.label}</span>}
            </>
          )}
        </span>
        <span className="flex flex-col min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-headline-md font-extrabold text-on-surface tracking-tight truncate">{place.name}</span>
            {active && <Icon name="check_circle" filled className="text-[18px] text-primary shrink-0" />}
          </span>
          <span className="text-body-sm text-on-surface-variant truncate">
            {status === 'error' && "Couldn't load"}
            {status === 'loading' && 'Loading…'}
            {plan && when != null && (
              <>
                <strong className="text-on-surface font-semibold">{formatTime(when)}</strong>{' '}
                {dayLabel(when, plan.now).toLowerCase()}
              </>
            )}
            {plan && when == null && 'No hours to score'}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => removePlace(place.id)}
        aria-label={`Remove ${place.name}`}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-outline hover:text-tertiary hover:bg-surface-container-low transition-colors"
      >
        <Icon name="close" className="text-[20px]" />
      </button>
    </div>
  )
}
