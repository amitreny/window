import type { HourData } from './openMeteo'

export type ActivityId = 'run' | 'beach' | 'bike' | 'stargazing' | 'laundry'
export type MetricId =
  | 'feelsLike'
  | 'rain'
  | 'wind'
  | 'uv'
  | 'aqi'
  | 'humidity'
  | 'cloud'
  | 'visibility'
  | 'seaTemp'
  | 'waves'

/** What the user can tune per activity. Hours outside these score lower or are skipped. */
export interface Limits {
  tempMin: number
  tempMax: number
  maxWind: number
  maxRain: number
  maxUv: number
  maxAqi: number
  daylightOnly: boolean
  /** Hour of day, 0–23. */
  earliest: number
  /** Hour of day, 1–24. */
  latest: number
}

export type LimitControl = 'temp' | 'wind' | 'rain' | 'uv' | 'aqi' | 'daylight' | 'hours'

/** How good one reading is for an activity: 1 is ideal, 0 rules the hour out, null means no data. */
type Quality = (hour: HourData, limits: Limits) => number | null

export interface Factor {
  metric: MetricId
  /** Relative importance. 0 means shown for context but not scored. */
  weight: number
  quality: Quality
}

export interface ActivityDef {
  id: ActivityId
  label: string
  /** Reads after "Best window for …". */
  noun: string
  icon: string
  nightOnly?: boolean
  defaults: Limits
  controls: LimitControl[]
  factors: Factor[]
  /** The four "Right now" tiles on Home. */
  tiles: MetricId[]
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** 1 inside [lo, hi], falling to 0 once `falloff` beyond either edge. */
export function inRange(value: number, lo: number, hi: number, falloff: number): number {
  if (value < lo) return clamp01(1 - (lo - value) / falloff)
  if (value > hi) return clamp01(1 - (value - hi) / falloff)
  return 1
}

/** 1 up to half the limit, 0.6 at the limit, 0 at twice the limit. */
export function under(value: number, limit: number): number {
  const l = Math.max(limit, 0.001)
  if (value <= l / 2) return 1
  if (value <= l) return 1 - ((value - l / 2) / (l / 2)) * 0.4
  return clamp01(0.6 - ((value - l) / l) * 0.6)
}

// A steady wind with strong gusts feels windier than its average speed.
const effectiveWind = (h: HourData) => Math.max(h.wind, h.gusts * 0.6)

const feelsLike: Quality = (h, l) => inRange(h.feelsLike, l.tempMin, l.tempMax, 8)
const rain: Quality = (h, l) => under(h.rainChance, l.maxRain)
const wind: Quality = (h, l) => under(effectiveWind(h), l.maxWind)
const uv: Quality = (h, l) => under(h.uv, l.maxUv)
const aqi: Quality = (h, l) => (h.aqi == null ? null : under(h.aqi, l.maxAqi))
const mugginess: Quality = (h) => inRange(h.humidity, 0, 60, 50)
const clearSky: Quality = (h) => inRange(h.cloud, 0, 10, 60)

const DAY_HOURS = { daylightOnly: true, earliest: 6, latest: 21 }
const ANY_HOUR = { daylightOnly: false, earliest: 0, latest: 24 }

export const ACTIVITIES: Record<ActivityId, ActivityDef> = {
  run: {
    id: 'run',
    label: 'Run',
    noun: 'a run',
    icon: 'directions_run',
    defaults: { tempMin: 12, tempMax: 26, maxWind: 25, maxRain: 20, maxUv: 6, maxAqi: 100, ...DAY_HOURS },
    controls: ['temp', 'wind', 'rain', 'uv', 'aqi', 'daylight', 'hours'],
    factors: [
      { metric: 'feelsLike', weight: 3, quality: feelsLike },
      { metric: 'rain', weight: 3, quality: rain },
      { metric: 'wind', weight: 2, quality: wind },
      { metric: 'uv', weight: 1.5, quality: uv },
      { metric: 'aqi', weight: 2, quality: aqi },
      { metric: 'humidity', weight: 1, quality: mugginess },
      { metric: 'cloud', weight: 0, quality: clearSky },
    ],
    tiles: ['feelsLike', 'wind', 'uv', 'aqi'],
  },
  beach: {
    id: 'beach',
    label: 'Beach',
    noun: 'the beach',
    icon: 'beach_access',
    defaults: { tempMin: 24, tempMax: 33, maxWind: 20, maxRain: 10, maxUv: 8, maxAqi: 100, ...DAY_HOURS, earliest: 7, latest: 20 },
    controls: ['temp', 'wind', 'rain', 'uv', 'daylight', 'hours'],
    factors: [
      { metric: 'feelsLike', weight: 3, quality: feelsLike },
      { metric: 'rain', weight: 3, quality: rain },
      { metric: 'seaTemp', weight: 2, quality: (h) => (h.seaTemp == null ? null : inRange(h.seaTemp, 24, 30, 7)) },
      { metric: 'waves', weight: 2, quality: (h) => (h.waveHeight == null ? null : under(h.waveHeight, 1)) },
      { metric: 'wind', weight: 2, quality: wind },
      { metric: 'uv', weight: 1.5, quality: uv },
    ],
    tiles: ['seaTemp', 'waves', 'uv', 'wind'],
  },
  bike: {
    id: 'bike',
    label: 'Bike',
    noun: 'a bike ride',
    icon: 'directions_bike',
    defaults: { tempMin: 10, tempMax: 28, maxWind: 20, maxRain: 15, maxUv: 7, maxAqi: 100, ...DAY_HOURS },
    controls: ['temp', 'wind', 'rain', 'uv', 'aqi', 'daylight', 'hours'],
    factors: [
      { metric: 'feelsLike', weight: 3, quality: feelsLike },
      { metric: 'rain', weight: 3.5, quality: rain },
      { metric: 'wind', weight: 3, quality: wind },
      { metric: 'uv', weight: 1, quality: uv },
      { metric: 'aqi', weight: 1.5, quality: aqi },
      { metric: 'humidity', weight: 0.5, quality: mugginess },
    ],
    tiles: ['feelsLike', 'wind', 'uv', 'aqi'],
  },
  stargazing: {
    id: 'stargazing',
    label: 'Stargazing',
    noun: 'stargazing',
    icon: 'auto_awesome',
    nightOnly: true,
    defaults: { tempMin: 8, tempMax: 28, maxWind: 25, maxRain: 10, maxUv: 11, maxAqi: 150, ...ANY_HOUR },
    controls: ['temp', 'wind', 'rain'],
    factors: [
      { metric: 'cloud', weight: 5, quality: clearSky },
      { metric: 'visibility', weight: 2, quality: (h) => inRange(h.visibility, 30, Infinity, 25) },
      { metric: 'rain', weight: 2, quality: rain },
      { metric: 'humidity', weight: 1.5, quality: (h) => inRange(h.humidity, 0, 65, 35) },
      { metric: 'wind', weight: 1, quality: wind },
      { metric: 'feelsLike', weight: 1, quality: feelsLike },
    ],
    tiles: ['cloud', 'visibility', 'humidity', 'wind'],
  },
  laundry: {
    id: 'laundry',
    label: 'Laundry',
    noun: 'drying laundry',
    icon: 'local_laundry_service',
    defaults: { tempMin: 16, tempMax: 38, maxWind: 40, maxRain: 10, maxUv: 11, maxAqi: 150, ...DAY_HOURS, earliest: 7, latest: 19 },
    controls: ['temp', 'rain', 'daylight', 'hours'],
    factors: [
      { metric: 'rain', weight: 5, quality: rain },
      { metric: 'humidity', weight: 3, quality: (h) => inRange(h.humidity, 0, 50, 40) },
      { metric: 'feelsLike', weight: 2, quality: feelsLike },
      // A breeze dries clothes; dead calm is slow and a gale takes them off the line.
      { metric: 'wind', weight: 1.5, quality: (h) => inRange(h.wind, 8, 28, 20) },
      { metric: 'cloud', weight: 1.5, quality: (h) => 1 - (h.cloud / 100) * 0.7 },
    ],
    tiles: ['rain', 'humidity', 'wind', 'cloud'],
  },
}

export const ACTIVITY_ORDER: ActivityId[] = ['run', 'beach', 'bike', 'stargazing', 'laundry']

// ── How each reading is shown ────────────────────────────────────────────────

export interface Metric {
  label: string
  /** Fits a Home tile. */
  short: string
  icon: string
  unit?: string
  value: (h: HourData) => string
  /** A short qualifier next to the value, e.g. "Low" for UV. */
  note?: (h: HourData) => string
  /** A lowercase fragment for the one-line summary, e.g. "light breeze". */
  phrase: (h: HourData) => string
}

const pick = <T>(value: number, steps: [number, T][], otherwise: T): T =>
  steps.find(([max]) => value < max)?.[1] ?? otherwise

const uvBand = (h: HourData) => pick(h.uv, [[3, 'Low'], [6, 'Moderate'], [8, 'High']], 'Very high')
const aqiBand = (h: HourData) => pick(h.aqi ?? 0, [[51, 'Good'], [101, 'Moderate']], 'Unhealthy')
const missing = '–'

export const METRICS: Record<MetricId, Metric> = {
  feelsLike: {
    label: 'Feels like',
    short: 'Feels',
    icon: 'thermostat',
    value: (h) => `${Math.round(h.feelsLike)}°`,
    phrase: (h) => `feels like ${Math.round(h.feelsLike)}°`,
  },
  rain: {
    label: 'Rain chance',
    short: 'Rain',
    icon: 'rainy',
    value: (h) => `${Math.round(h.rainChance)}%`,
    phrase: (h) => (h.rainChance < 10 ? 'dry' : `${Math.round(h.rainChance)}% rain chance`),
  },
  wind: {
    label: 'Wind',
    short: 'Wind',
    icon: 'air',
    unit: 'km/h',
    value: (h) => `${Math.round(h.wind)}`,
    note: (h) => `gusts ${Math.round(h.gusts)}`,
    phrase: (h) => pick(effectiveWind(h), [[8, 'calm'], [20, 'light breeze'], [32, 'breezy']], 'strong wind'),
  },
  uv: {
    label: 'UV index',
    short: 'UV',
    icon: 'light_mode',
    value: (h) => h.uv.toFixed(1),
    note: uvBand,
    phrase: (h) => `UV ${uvBand(h).toLowerCase()}`,
  },
  aqi: {
    label: 'Air quality',
    short: 'AQI',
    icon: 'eco',
    value: (h) => (h.aqi == null ? missing : `${Math.round(h.aqi)}`),
    note: (h) => (h.aqi == null ? '' : aqiBand(h)),
    phrase: (h) => pick(h.aqi ?? 0, [[51, 'air clean'], [101, 'air moderate']], 'air poor'),
  },
  humidity: {
    label: 'Humidity',
    short: 'Humidity',
    icon: 'humidity_percentage',
    value: (h) => `${Math.round(h.humidity)}%`,
    phrase: (h) => pick(h.humidity, [[45, 'dry air'], [75, 'comfortable humidity']], 'humid'),
  },
  cloud: {
    label: 'Cloud cover',
    short: 'Clouds',
    icon: 'cloud',
    value: (h) => `${Math.round(h.cloud)}%`,
    phrase: (h) => pick(h.cloud, [[20, 'clear sky'], [60, 'partly cloudy']], 'overcast'),
  },
  visibility: {
    label: 'Visibility',
    short: 'Visibility',
    icon: 'visibility',
    unit: 'km',
    value: (h) => `${Math.round(h.visibility)}`,
    phrase: (h) => pick(h.visibility, [[10, 'hazy'], [25, 'fair visibility']], 'long visibility'),
  },
  seaTemp: {
    label: 'Sea temperature',
    short: 'Sea temp',
    icon: 'water',
    value: (h) => (h.seaTemp == null ? missing : `${h.seaTemp.toFixed(1)}°`),
    phrase: (h) => `sea ${Math.round(h.seaTemp ?? 0)}°`,
  },
  waves: {
    label: 'Waves',
    short: 'Waves',
    icon: 'waves',
    unit: 'm',
    value: (h) => (h.waveHeight == null ? missing : h.waveHeight.toFixed(1)),
    phrase: (h) => pick(h.waveHeight ?? 0, [[0.5, 'small waves'], [1.25, 'moderate waves']], 'rough sea'),
  },
}
