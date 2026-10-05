import { ACTIVITIES, ACTIVITY_ORDER, METRICS, type ActivityDef, type ActivityId, type Limits, type MetricId } from './activities'
import type { Forecast, HourData } from './openMeteo'
import { HOUR, floorHour, hourOfDay, nowLocal } from './time'

export type Tier = 'great' | 'okay' | 'poor'
export const GREAT = 80
export const OKAY = 50

export const tierOf = (score: number): Tier => (score >= GREAT ? 'great' : score >= OKAY ? 'okay' : 'poor')

export interface FactorResult {
  metric: MetricId
  quality: number
  weight: number
  effect: 'helps' | 'hurts' | 'neutral'
}

export type Exclusion = 'dark' | 'daylight' | 'hours'

export interface ScoredHour {
  hour: HourData
  /** 0–100, or null when the hour is skipped outright (see `excluded`). */
  score: number | null
  excluded?: Exclusion
  factors: FactorResult[]
}

export interface Window {
  start: number
  /** Exclusive. */
  end: number
  hours: number
  peak: number
  /** Index into the plan's hours. */
  peakIndex: number
}

export interface Plan {
  /** Wall-clock time at the place when the plan was built. */
  now: number
  /** The next 48 hours, starting with the current one. */
  hours: ScoredHour[]
  /** Runs of "great" hours: the recommended one first, then the rest in time order. */
  windows: Window[]
  best: Window | null
  /** The single highest-scoring hour, or -1 if every hour is skipped. */
  peakIndex: number
}

function exclusion(hour: HourData, activity: ActivityDef, limits: Limits): Exclusion | undefined {
  if (activity.nightOnly) return hour.isDay ? 'daylight' : undefined
  if (limits.daylightOnly && !hour.isDay) return 'dark'
  const h = hourOfDay(hour.time)
  if (h < limits.earliest || h >= limits.latest) return 'hours'
  return undefined
}

export function scoreHour(hour: HourData, activity: ActivityDef, limits: Limits): ScoredHour {
  const factors: FactorResult[] = []
  let weighted = 0
  let totalWeight = 0
  let floor = 1

  for (const { metric, weight, quality } of activity.factors) {
    const q = quality(hour, limits)
    if (q == null) continue
    factors.push({
      metric,
      quality: q,
      weight,
      effect: weight === 0 ? 'neutral' : q >= 0.75 ? 'helps' : q <= 0.5 ? 'hurts' : 'neutral',
    })
    if (weight === 0) continue
    weighted += q * weight
    totalWeight += weight
    // Factors that matter (weight 2+) can sink the hour on their own; lighter ones only partly.
    floor = Math.min(floor, 1 - (1 - q) * Math.min(1, weight / 2))
  }

  const excluded = exclusion(hour, activity, limits)
  if (excluded || totalWeight === 0) return { hour, score: null, excluded, factors }

  // An average alone would let five perfect readings hide a downpour, so the
  // worst factor is blended in.
  const score = Math.round(100 * (0.55 * (weighted / totalWeight) + 0.45 * floor))
  return { hour, score, factors }
}

export function findWindows(hours: ScoredHour[], threshold = GREAT): Window[] {
  const windows: Window[] = []
  let current: Window | null = null
  hours.forEach(({ hour, score }, i) => {
    if (score == null || score < threshold) {
      current = null
      return
    }
    if (!current) {
      current = { start: hour.time, end: hour.time + HOUR, hours: 1, peak: score, peakIndex: i }
      windows.push(current)
      return
    }
    current.end = hour.time + HOUR
    current.hours += 1
    if (score > current.peak) {
      current.peak = score
      current.peakIndex = i
    }
  })
  return windows
}

/** Peaks this close count as a tie, so a marginally better window a day away doesn't beat one today. */
const TIE = 5

/** The soonest window whose peak is within a tie of the highest. Expects windows in time order. */
export function pickBest(windows: Window[]): Window | null {
  const top = Math.max(...windows.map((w) => w.peak))
  return windows.find((w) => w.peak >= top - TIE) ?? null
}

export function buildPlan(forecast: Forecast, activity: ActivityDef, limits: Limits, now = Date.now()): Plan {
  const local = nowLocal(forecast.utcOffsetSeconds, now)
  const from = forecast.hours.findIndex((h) => h.time >= floorHour(local))
  const upcoming = from === -1 ? [] : forecast.hours.slice(from, from + 48)
  const hours = upcoming.map((h) => scoreHour(h, activity, limits))
  const found = findWindows(hours)
  const best = pickBest(found)
  const windows = best ? [best, ...found.filter((w) => w !== best)] : []

  let peakIndex = -1
  hours.forEach((h, i) => {
    if (h.score != null && (peakIndex === -1 || h.score > hours[peakIndex].score!)) peakIndex = i
  })

  return { now: local, hours, windows, best, peakIndex }
}

/** "wind 7 km/h", "UV index 7.2" */
function reading(id: MetricId, hour: HourData): string {
  const { label, value, unit } = METRICS[id]
  const name = label.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())
  return `${name} ${value(hour)}${unit ? ` ${unit}` : ''}`
}

/** The one-line explanation under a score, e.g. "Feels like 24°, light breeze, UV low, air clean". */
export function summarize(scored: ScoredHour, count = 4): string {
  const good = scored.score != null && scored.score >= GREAT
  const relevant = scored.factors.filter((f) => f.weight > 0)
  const hurting = relevant.filter((f) => f.effect === 'hurts')
  const chosen = good
    ? relevant.filter((f) => f.effect === 'helps').sort((a, b) => b.weight - a.weight)
    : (hurting.length ? hurting : relevant.filter((f) => f.effect === 'neutral')).sort(
        (a, b) => (1 - b.quality) * b.weight - (1 - a.quality) * a.weight,
      )
  // Problems are stated as plain readings ("wind 7 km/h"): a phrase like "calm" would
  // contradict itself when the user's own limit is what makes it a problem.
  const text = chosen
    .slice(0, good ? count : 3)
    .map((f) => (good ? METRICS[f.metric].phrase(scored.hour) : reading(f.metric, scored.hour)))
    .join(', ')
  if (!text) return ''
  return good ? text[0].toUpperCase() + text.slice(1) : `Held back by ${text}`
}

/** Each other activity's best hour, strongest first. Used to suggest alternatives. */
export function alternatives(
  forecast: Forecast,
  current: ActivityId,
  limitsFor: (id: ActivityId) => Limits,
  now = Date.now(),
): { id: ActivityId; score: number }[] {
  return ACTIVITY_ORDER.filter((id) => id !== current)
    .map((id) => {
      const plan = buildPlan(forecast, ACTIVITIES[id], limitsFor(id), now)
      return { id, score: plan.peakIndex === -1 ? 0 : plan.hours[plan.peakIndex].score! }
    })
    .filter((a) => a.score >= GREAT)
    .sort((a, b) => b.score - a.score)
}
