import { describe, expect, it } from 'vitest'
import { ACTIVITIES, inRange, under } from './activities'
import type { Forecast, HourData } from './openMeteo'
import { buildPlan, findWindows, pickBest, scoreHour, summarize, type ScoredHour } from './scoring'
import { HOUR, clockParts, dayLabel, parseLocal, shortHour } from './time'

const run = ACTIVITIES.run
const at = (iso: string) => parseLocal(iso)

function hour(overrides: Partial<HourData> = {}): HourData {
  return {
    time: at('2026-10-06T18:00'),
    temp: 22,
    feelsLike: 22,
    rainChance: 0,
    wind: 8,
    gusts: 12,
    cloud: 20,
    uv: 1,
    humidity: 50,
    visibility: 30,
    isDay: true,
    aqi: 30,
    waveHeight: 0.3,
    seaTemp: 27,
    ...overrides,
  }
}

describe('quality curves', () => {
  it('inRange is 1 inside the range and falls off linearly outside it', () => {
    expect(inRange(20, 12, 26, 8)).toBe(1)
    expect(inRange(30, 12, 26, 8)).toBe(0.5)
    expect(inRange(8, 12, 26, 8)).toBe(0.5)
    expect(inRange(40, 12, 26, 8)).toBe(0)
  })

  it('under is 1 at half the limit, 0.6 at the limit and 0 at double', () => {
    expect(under(10, 20)).toBe(1)
    expect(under(20, 20)).toBeCloseTo(0.6)
    expect(under(40, 20)).toBe(0)
  })
})

describe('scoreHour', () => {
  it('rates a mild, dry, calm evening as great', () => {
    expect(scoreHour(hour(), run, run.defaults).score).toBeGreaterThanOrEqual(90)
  })

  it('lets heavy rain sink an otherwise perfect hour', () => {
    const rainy = scoreHour(hour({ rainChance: 80 }), run, run.defaults)
    expect(rainy.score).toBeLessThan(50)
    expect(rainy.factors.find((f) => f.metric === 'rain')?.effect).toBe('hurts')
  })

  it('skips night hours for a daylight-only activity', () => {
    const night = scoreHour(hour({ isDay: false }), run, run.defaults)
    expect(night.score).toBeNull()
    expect(night.excluded).toBe('dark')
  })

  it('skips hours outside the earliest and latest limits', () => {
    const early = scoreHour(hour({ time: at('2026-10-06T05:00') }), run, { ...run.defaults, daylightOnly: false })
    expect(early.excluded).toBe('hours')
  })

  it('only scores stargazing after dark, and clouds ruin it', () => {
    const stars = ACTIVITIES.stargazing
    expect(scoreHour(hour(), stars, stars.defaults).excluded).toBe('daylight')
    const clear = scoreHour(hour({ isDay: false, cloud: 5 }), stars, stars.defaults).score!
    const overcast = scoreHour(hour({ isDay: false, cloud: 90 }), stars, stars.defaults).score!
    expect(clear).toBeGreaterThanOrEqual(80)
    expect(overcast).toBeLessThan(50)
  })

  it('leaves out factors that have no data', () => {
    const inland = scoreHour(hour({ feelsLike: 28, seaTemp: null, waveHeight: null }), ACTIVITIES.beach, ACTIVITIES.beach.defaults)
    expect(inland.factors.map((f) => f.metric)).not.toContain('seaTemp')
    expect(inland.score).not.toBeNull()
  })

  it('respects tighter limits', () => {
    const warm = hour({ feelsLike: 26 })
    const relaxed = scoreHour(warm, run, run.defaults).score!
    const strict = scoreHour(warm, run, { ...run.defaults, tempMax: 18 }).score!
    expect(strict).toBeLessThan(relaxed)
  })
})

describe('windows', () => {
  const scored = (scores: (number | null)[]): ScoredHour[] =>
    scores.map((score, i) => ({ hour: hour({ time: at('2026-10-06T10:00') + i * HOUR }), score, factors: [] }))

  it('groups consecutive great hours in time order', () => {
    const windows = findWindows(scored([85, 82, 60, null, 90, 95, 88, 40]))
    expect(windows).toHaveLength(2)
    expect(windows[0]).toMatchObject({ start: at('2026-10-06T10:00'), end: at('2026-10-06T12:00'), hours: 2, peak: 85, peakIndex: 0 })
    expect(windows[1]).toMatchObject({ start: at('2026-10-06T14:00'), end: at('2026-10-06T17:00'), hours: 3, peak: 95, peakIndex: 5 })
  })

  it('recommends the highest-scoring window', () => {
    const best = pickBest(findWindows(scored([85, 60, 95, 96])))
    expect(best?.start).toBe(at('2026-10-06T12:00'))
  })

  it('recommends the sooner window when peaks are within a few points', () => {
    const best = pickBest(findWindows(scored([96, 60, 100])))
    expect(best?.start).toBe(at('2026-10-06T10:00'))
  })

  it('recommends nothing when no hour is great', () => {
    expect(pickBest(findWindows(scored([70, null, 79])))).toBeNull()
  })

  it('builds a 48-hour plan starting at the current local hour', () => {
    const start = at('2026-10-06T00:00')
    const forecast: Forecast = {
      hours: Array.from({ length: 72 }, (_, i) => hour({ time: start + i * HOUR, isDay: i % 24 >= 7 && i % 24 < 18 })),
      sunEvents: [],
      utcOffsetSeconds: 3 * 3600,
      fetchedAt: 0,
    }
    // 12:30 UTC is 15:30 at a UTC+3 place.
    const plan = buildPlan(forecast, run, run.defaults, Date.parse('2026-10-06T12:30:00Z'))
    expect(plan.hours).toHaveLength(48)
    expect(plan.hours[0].hour.time).toBe(at('2026-10-06T15:00'))
    expect(plan.best?.start).toBe(at('2026-10-06T15:00'))
    expect(plan.best?.end).toBe(at('2026-10-06T18:00'))
  })
})

describe('summarize', () => {
  it('lists what makes a great hour great', () => {
    expect(summarize(scoreHour(hour(), run, run.defaults))).toBe('Feels like 22°, dry, light breeze, air clean')
  })

  it('names what holds a weak hour back', () => {
    expect(summarize(scoreHour(hour({ rainChance: 80 }), run, run.defaults))).toBe('Held back by rain chance 80%')
  })
})

describe('time', () => {
  it('formats wall-clock times without the viewer timezone', () => {
    expect(clockParts(at('2026-10-06T18:40'))).toEqual({ time: '6:40', period: 'PM' })
    expect(clockParts(at('2026-10-06T00:05'))).toEqual({ time: '12:05', period: 'AM' })
    expect(shortHour(at('2026-10-06T12:00'))).toBe('12p')
  })

  it('labels days relative to now', () => {
    const now = at('2026-10-06T23:30')
    expect(dayLabel(at('2026-10-06T08:00'), now)).toBe('Today')
    expect(dayLabel(at('2026-10-07T00:00'), now)).toBe('Tomorrow')
    expect(dayLabel(at('2026-10-08T09:00'), now)).toBe('Thu')
  })
})
