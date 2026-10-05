// Open-Meteo returns wall-clock strings in the place's own timezone ("2026-10-06T14:00").
// They are parsed as if they were UTC and only ever read back with getUTC*, so every time
// in the app is the place's local time and the viewer's timezone never leaks in.

export const HOUR = 3_600_000
export const DAY = 24 * HOUR

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function parseLocal(iso: string): number {
  return Date.parse(`${iso.slice(0, 16)}:00Z`)
}

export function toLocalIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16)
}

/** The current wall-clock time at a place, given its UTC offset. */
export function nowLocal(utcOffsetSeconds: number, now = Date.now()): number {
  return now + utcOffsetSeconds * 1000
}

export function floorHour(ms: number): number {
  return Math.floor(ms / HOUR) * HOUR
}

export function hourOfDay(ms: number): number {
  return new Date(ms).getUTCHours()
}

export function clockParts(ms: number): { time: string; period: 'AM' | 'PM' } {
  const d = new Date(ms)
  const h = d.getUTCHours()
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return { time: `${h % 12 || 12}:${m}`, period: h < 12 ? 'AM' : 'PM' }
}

/** "6:40 PM" */
export function formatTime(ms: number): string {
  const { time, period } = clockParts(ms)
  return `${time} ${period}`
}

/** "6 PM" */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`
}

/** "6p" */
export function shortHour(ms: number): string {
  const h = hourOfDay(ms)
  return `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`
}

/** "18:19" */
export function time24(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16)
}

/** "Today", "Tomorrow", or a weekday for anything further out. */
export function dayLabel(ms: number, now: number): string {
  const days = Math.floor(ms / DAY) - Math.floor(now / DAY)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return WEEKDAYS[new Date(ms).getUTCDay()]
}

export function formatDuration(hours: number): string {
  return `${hours} h`
}
