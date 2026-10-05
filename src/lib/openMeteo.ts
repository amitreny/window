import { parseLocal } from './time'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

export interface Place {
  id: string
  name: string
  admin?: string
  country?: string
  countryCode?: string
  latitude: number
  longitude: number
}

export interface HourData {
  /** Wall-clock time at the place, see lib/time. */
  time: number
  temp: number
  feelsLike: number
  rainChance: number
  wind: number
  gusts: number
  cloud: number
  uv: number
  humidity: number
  /** km */
  visibility: number
  isDay: boolean
  aqi: number | null
  waveHeight: number | null
  seaTemp: number | null
}

export interface SunEvent {
  time: number
  kind: 'sunrise' | 'sunset'
}

export interface Forecast {
  hours: HourData[]
  sunEvents: SunEvent[]
  utcOffsetSeconds: number
  fetchedAt: number
}

interface HourlyResponse {
  utc_offset_seconds: number
  hourly: { time: string[] } & Record<string, (number | null)[] | string[]>
  daily?: { sunrise: string[]; sunset: string[] }
}

const WEATHER_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'wind_speed_10m',
  'wind_gusts_10m',
  'cloud_cover',
  'uv_index',
  'relative_humidity_2m',
  'visibility',
  'is_day',
]

async function getJson<T>(base: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${base}?${new URLSearchParams(params)}`, { signal })
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`)
  return res.json() as Promise<T>
}

export function placeId(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`
}

/** Index one hourly field by its timestamp so the three APIs can be joined on time. */
function byTime(res: HourlyResponse | null, field: string): Map<string, number | null> {
  const values = new Map<string, number | null>()
  if (!res) return values
  const column = res.hourly[field] as (number | null)[] | undefined
  res.hourly.time.forEach((t, i) => values.set(t, column?.[i] ?? null))
  return values
}

export async function fetchForecast(place: Place): Promise<Forecast> {
  const common = {
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    forecast_days: '3',
    timezone: 'auto',
  }
  // Weather is required. Air quality and sea state are extras: some places have neither,
  // so a failure there leaves those fields null instead of failing the forecast.
  const [weather, air, marine] = await Promise.all([
    getJson<HourlyResponse>(FORECAST_URL, { ...common, hourly: WEATHER_FIELDS.join(','), daily: 'sunrise,sunset' }),
    getJson<HourlyResponse>(AIR_URL, { ...common, hourly: 'us_aqi' }).catch(() => null),
    getJson<HourlyResponse>(MARINE_URL, { ...common, hourly: 'wave_height,sea_surface_temperature' }).catch(() => null),
  ])

  const aqi = byTime(air, 'us_aqi')
  const waves = byTime(marine, 'wave_height')
  const sea = byTime(marine, 'sea_surface_temperature')
  const w = weather.hourly as unknown as Record<string, (number | null)[]>

  const hours: HourData[] = []
  weather.hourly.time.forEach((t, i) => {
    const temp = w.temperature_2m[i]
    if (temp == null) return
    hours.push({
      time: parseLocal(t),
      temp,
      feelsLike: w.apparent_temperature[i] ?? temp,
      rainChance: w.precipitation_probability[i] ?? 0,
      wind: w.wind_speed_10m[i] ?? 0,
      gusts: w.wind_gusts_10m[i] ?? 0,
      cloud: w.cloud_cover[i] ?? 0,
      uv: w.uv_index[i] ?? 0,
      humidity: w.relative_humidity_2m[i] ?? 0,
      visibility: (w.visibility[i] ?? 0) / 1000,
      isDay: w.is_day[i] === 1,
      aqi: aqi.get(t) ?? null,
      waveHeight: waves.get(t) ?? null,
      seaTemp: sea.get(t) ?? null,
    })
  })

  const sunEvents: SunEvent[] = [
    ...(weather.daily?.sunrise ?? []).map((t) => ({ time: parseLocal(t), kind: 'sunrise' as const })),
    ...(weather.daily?.sunset ?? []).map((t) => ({ time: parseLocal(t), kind: 'sunset' as const })),
  ].sort((a, b) => a.time - b.time)

  return { hours, sunEvents, utcOffsetSeconds: weather.utc_offset_seconds, fetchedAt: Date.now() }
}

interface GeocodeResponse {
  results?: {
    name: string
    latitude: number
    longitude: number
    admin1?: string
    country?: string
    country_code?: string
  }[]
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const data = await getJson<GeocodeResponse>(
    GEOCODE_URL,
    { name: query, count: '6', language: 'en', format: 'json' },
    signal,
  )
  return (data.results ?? []).map((r) => ({
    id: placeId(r.latitude, r.longitude),
    name: r.name,
    admin: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}

/** "Tel Aviv, Israel" */
export function placeTitle(place: Place): string {
  return place.country ? `${place.name}, ${place.country}` : place.name
}

/** "Tel Aviv District, Israel" */
export function placeRegion(place: Place): string {
  return [place.admin, place.country].filter(Boolean).join(', ')
}

export function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}
