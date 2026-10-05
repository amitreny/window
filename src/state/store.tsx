import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACTIVITIES, type ActivityId, type Limits } from '../lib/activities'
import type { Place } from '../lib/openMeteo'

const STORAGE_KEY = 'window.state.v1'
const MAX_SAVED = 6

interface State {
  place: Place | null
  saved: Place[]
  activity: ActivityId
  /** Only what the user changed; anything missing falls back to the activity's defaults. */
  limits: Partial<Record<ActivityId, Limits>>
}

interface Store extends State {
  selectPlace: (place: Place) => void
  removePlace: (id: string) => void
  setActivity: (activity: ActivityId) => void
  /** Pass null to go back to the activity's defaults. */
  setLimits: (activity: ActivityId, limits: Limits | null) => void
  limitsFor: (activity: ActivityId) => Limits
}

const initial: State = { place: null, saved: [], activity: 'run', limits: {} }

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initial, ...JSON.parse(raw) } : initial
  } catch {
    return initial
  }
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private mode or a full quota: the app still works, it just won't remember.
    }
  }, [state])

  const selectPlace = useCallback((place: Place) => {
    setState((s) => ({
      ...s,
      place,
      saved: s.saved.some((p) => p.id === place.id) ? s.saved : [place, ...s.saved].slice(0, MAX_SAVED),
    }))
  }, [])

  const removePlace = useCallback((id: string) => {
    setState((s) => ({ ...s, saved: s.saved.filter((p) => p.id !== id) }))
  }, [])

  const setActivity = useCallback((activity: ActivityId) => setState((s) => ({ ...s, activity })), [])

  const setLimits = useCallback((activity: ActivityId, limits: Limits | null) => {
    setState((s) => {
      const next = { ...s.limits }
      if (limits) next[activity] = limits
      else delete next[activity]
      return { ...s, limits: next }
    })
  }, [])

  const limitsFor = useCallback(
    (activity: ActivityId): Limits => ({ ...ACTIVITIES[activity].defaults, ...state.limits[activity] }),
    [state.limits],
  )

  const store = useMemo(
    () => ({ ...state, selectPlace, removePlace, setActivity, setLimits, limitsFor }),
    [state, selectPlace, removePlace, setActivity, setLimits, limitsFor],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
