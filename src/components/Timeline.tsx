import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { SunEvent } from '../lib/openMeteo'
import { tierOf, type Plan } from '../lib/scoring'
import { HOUR, dayLabel, formatTime, hourOfDay, shortHour, time24, toLocalIso } from '../lib/time'
import { Icon, TIER } from './ui'

const MAX_BAR = 84
const STUB = 14

/** Bar height in px for a 0–100 score; skipped hours get a short stub. */
export const barHeight = (score: number | null) => (score == null ? STUB : STUB + Math.round((score / 100) * (MAX_BAR - STUB)))

export function barColor(score: number | null): string {
  return score == null ? 'bg-surface-container-high' : TIER[tierOf(score)].bar
}

/** The scrollable 48-hour strip: one bar per hour, tap a bar for its breakdown. */
export function Timeline({ plan, sunEvents }: { plan: Plan; sunEvents: SunEvent[] }) {
  const { hours, best, now } = plan
  const scroller = useRef<HTMLDivElement>(null)
  const highlighted = useRef<HTMLDivElement>(null)

  // Only about a day fits on a phone, so bring the recommended window into view.
  useEffect(() => {
    const strip = scroller.current
    const mark = highlighted.current
    if (!strip) return
    const visible = mark && mark.offsetLeft + mark.offsetWidth <= strip.clientWidth
    strip.scrollTo({ left: !mark || visible ? 0 : mark.offsetLeft - 48 })
  }, [plan])

  if (hours.length === 0) return null

  const first = hours[0].hour.time
  const slot = 100 / hours.length
  /** Horizontal position of a time, as a percentage of the strip. */
  const at = (time: number) => `${((time - first) / HOUR) * slot}%`

  const highlight = best ?? (plan.peakIndex === -1 ? null : { start: hours[plan.peakIndex].hour.time, hours: 1 })
  const highlightTone = best ? 'bg-primary/10' : 'bg-secondary-container/15 border border-secondary-container/40'
  const midnights = hours.filter((h, i) => i > 0 && hourOfDay(h.hour.time) === 0)
  const suns = sunEvents.filter((e) => e.time > first && e.time < first + hours.length * HOUR)

  return (
    <div ref={scroller} className="relative overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
      <div className="flex items-end gap-[3px] min-w-[720px] h-32 relative">
        {highlight && (
          <div
            ref={highlighted}
            className={`absolute bottom-[18px] h-[92px] rounded-lg pointer-events-none ${highlightTone}`}
            style={{ left: at(highlight.start), width: `${highlight.hours * slot}%` }}
          />
        )}

        {midnights.map(({ hour }) => (
          <div
            key={hour.time}
            className="absolute top-3 bottom-[18px] w-px bg-surface-container-highest flex flex-col items-center pointer-events-none"
            style={{ left: at(hour.time) }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant bg-surface-container-lowest px-1 rounded -translate-y-2">
              {dayLabel(hour.time, now)}
            </span>
          </div>
        ))}

        {suns.map((event) => (
          <div
            key={event.time}
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: at(event.time) }}
          >
            <Icon name={event.kind === 'sunrise' ? 'wb_sunny' : 'wb_twilight'} className="text-[14px] text-secondary-container" />
            <span className="text-[10px] leading-3 text-on-surface-variant tracking-tighter">{time24(event.time)}</span>
          </div>
        ))}

        {hours.map(({ hour, score }, i) => {
          const isPeak = i === (best?.peakIndex ?? plan.peakIndex)
          return (
            <Link
              key={hour.time}
              to={`/hour/${toLocalIso(hour.time)}`}
              aria-label={`${dayLabel(hour.time, now)} ${formatTime(hour.time)}, ${score == null ? 'not scored' : `score ${score}`}`}
              className="group flex-1 h-full flex flex-col items-center justify-end gap-1.5 z-10"
            >
              <div
                className={`w-full rounded-t-sm transition-opacity group-hover:opacity-70 ${barColor(score)}`}
                style={{ height: barHeight(score) }}
              />
              <span className={`h-3 text-[10px] leading-3 ${isPeak ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                {hourOfDay(hour.time) % 3 === 0 || isPeak ? shortHour(hour.time) : ''}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
