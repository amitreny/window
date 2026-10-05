import { useEffect, useMemo, useState } from 'react'
import { ACTIVITIES } from '../lib/activities'
import { fetchForecast, type Forecast, type Place } from '../lib/openMeteo'
import { buildPlan, type Plan } from '../lib/scoring'
import { useStore } from '../state/store'

const TTL = 10 * 60_000

interface Entry {
  at: number
  promise: Promise<Forecast>
  data?: Forecast
}

// Shared across screens so moving between them doesn't refetch.
const cache = new Map<string, Entry>()

function load(place: Place): Entry {
  const hit = cache.get(place.id)
  if (hit && Date.now() - hit.at < TTL) return hit
  const entry: Entry = { at: Date.now(), promise: fetchForecast(place) }
  entry.promise.then(
    (data) => (entry.data = data),
    () => cache.get(place.id) === entry && cache.delete(place.id),
  )
  cache.set(place.id, entry)
  return entry
}

export type ForecastState =
  | { status: 'idle' | 'loading' | 'error'; forecast?: undefined }
  | { status: 'ready'; forecast: Forecast }

export function useForecast(place: Place | null): ForecastState & { retry: () => void } {
  const [state, setState] = useState<ForecastState>(() => {
    const cached = place && cache.get(place.id)?.data
    return cached ? { status: 'ready', forecast: cached } : { status: place ? 'loading' : 'idle' }
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!place) {
      setState({ status: 'idle' })
      return
    }
    const entry = load(place)
    if (entry.data) {
      setState({ status: 'ready', forecast: entry.data })
      return
    }
    let live = true
    setState({ status: 'loading' })
    entry.promise.then(
      (forecast) => live && setState({ status: 'ready', forecast }),
      () => live && setState({ status: 'error' }),
    )
    return () => {
      live = false
    }
    // Keyed on the id: a re-created Place object for the same spot shouldn't refetch.
  }, [place?.id, attempt])

  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

/** The forecast for a place, scored for the activity that is currently selected. */
export function usePlan(place: Place | null): ForecastState & { retry: () => void; plan: Plan | null } {
  const { activity, limitsFor } = useStore()
  const result = useForecast(place)
  const plan = useMemo(
    () => (result.forecast ? buildPlan(result.forecast, ACTIVITIES[activity], limitsFor(activity)) : null),
    [result.forecast, activity, limitsFor],
  )
  return { ...result, plan }
}
