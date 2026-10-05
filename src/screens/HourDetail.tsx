import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CARD, Icon, Screen, TIER } from '../components/ui'
import { usePlan } from '../hooks/useForecast'
import { ACTIVITIES, METRICS } from '../lib/activities'
import { downloadReminder } from '../lib/ics'
import { placeTitle } from '../lib/openMeteo'
import { tierOf, type Exclusion, type FactorResult, type Plan, type ScoredHour } from '../lib/scoring'
import { HOUR, dayLabel, formatHour, formatTime, hourOfDay, toLocalIso } from '../lib/time'
import { useStore } from '../state/store'

const REMIND_LEAD_MIN = 15

const SKIPPED: Record<Exclusion, string> = {
  dark: 'After dark. This activity is set to daylight only.',
  daylight: 'The sun is still up.',
  hours: 'Outside the hours you allow for this activity.',
}

export default function HourDetail() {
  const { time } = useParams()
  const { place, activity } = useStore()
  const { status, plan } = usePlan(place)
  const def = ACTIVITIES[activity]

  if (!place || status === 'error') return <Navigate to="/" replace />
  if (!plan) return <Screen back={{ title: 'Loading…', to: '/' }}>{null}</Screen>

  const index = plan.hours.findIndex((h) => toLocalIso(h.hour.time) === time)
  if (index === -1) return <Navigate to="/" replace />

  const scored = plan.hours[index]
  const { hour, score } = scored
  const tier = score == null ? null : TIER[tierOf(score)]
  const inWindow = plan.windows.find((w) => hour.time >= w.start && hour.time < w.end)
  const nextWindow = plan.windows.find((w) => w !== inWindow && w.start > hour.time)
  const title = `${dayLabel(hour.time, plan.now)}, ${formatTime(hour.time)}`

  return (
    <Screen back={{ title, to: '/', action: <ShareButton title={`${def.label} in ${place.name}: ${title}`} /> }}>
      <div className="flex flex-col w-full px-gutter pb-8 space-y-space-md">
        <p className="pt-2 flex items-center gap-1.5 text-label-md uppercase tracking-wider text-primary font-bold">
          <Icon name={def.icon} className="text-[16px]" />
          {def.label} · {placeTitle(place)}
        </p>

        <section className={`${CARD} p-space-md flex flex-col items-center text-center`}>
          <ScoreRing score={score} />
          {tier ? (
            <>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 ${tier.soft}`}>
                <span className="text-label-md uppercase tracking-wider font-bold">{tier.label}</span>
              </div>
              <p className="text-body-md text-on-surface font-semibold">
                {tier.label} hour for {def.noun}
              </p>
              {inWindow && (
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Part of the {formatTime(inWindow.start)} – {formatTime(inWindow.end)} window
                </p>
              )}
            </>
          ) : (
            <p className="text-body-md text-on-surface-variant max-w-[280px]">{SKIPPED[scored.excluded ?? 'hours']}</p>
          )}

          <div className="w-full grid grid-cols-3 gap-2 mt-4 bg-surface-container-low rounded-xl p-2.5">
            <Stat label="Temp" value={`${Math.round(hour.temp)}°C`} />
            <Stat label="Wind" value={`${Math.round(hour.wind)} km/h`} />
            <Stat label="Rain" value={`${Math.round(hour.rainChance)}%`} />
          </div>
        </section>

        <section className="space-y-space-xs">
          <div className="px-1">
            <h2 className="text-headline-sm font-bold text-on-surface">What’s driving this</h2>
            <p className="text-body-sm text-on-surface-variant">Scored against your limits for {def.noun}</p>
          </div>
          <div className={`${CARD} p-space-md space-y-3.5`}>
            {scored.factors.map((factor) => (
              <FactorRow key={factor.metric} factor={factor} scored={scored} />
            ))}
          </div>
        </section>

        <Surrounding plan={plan} index={index} />

        <div className="pt-2 space-y-3">
          {score != null && hour.time - REMIND_LEAD_MIN * 60_000 > plan.now && (
            <button
              type="button"
              onClick={() =>
                downloadReminder(
                  `${def.label} window (score ${score})`,
                  `Window: ${tier?.label} hour for ${def.noun} in ${place.name}.`,
                  hour.time,
                  inWindow?.end ?? hour.time + HOUR,
                  REMIND_LEAD_MIN,
                )
              }
              className="w-full bg-primary-container text-white rounded-xl py-3.5 px-space-md flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-transform shadow-sm"
            >
              <Icon name="notifications_active" className="text-[20px]" />
              <span className="text-label-lg font-bold">Remind me at {formatTime(hour.time - REMIND_LEAD_MIN * 60_000)}</span>
            </button>
          )}
          {nextWindow && (
            <div className="flex justify-center">
              <Link
                to={`/hour/${toLocalIso(plan.hours[nextWindow.peakIndex].hour.time)}`}
                className="inline-flex items-center gap-1 text-primary py-1.5 px-3 rounded-full"
              >
                <span className="text-label-lg font-bold">See next best window</span>
                <Icon name="chevron_right" className="text-[18px]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </Screen>
  )
}

function ScoreRing({ score }: { score: number | null }) {
  const r = 68
  const circumference = 2 * Math.PI * r
  return (
    <div className="relative w-44 h-44 my-2 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
        <circle className="text-surface-container" cx="80" cy="80" r={r} fill="none" stroke="currentColor" strokeWidth="8" />
        {score != null && (
          <circle
            className={TIER[tierOf(score)].ring}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score / 100)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-numeral-score-mobile text-on-surface">{score ?? '–'}</span>
        <span className="text-label-md uppercase tracking-widest text-on-surface-variant mt-1">
          {score == null ? 'Not scored' : 'Score / 100'}
        </span>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-label-md text-on-surface-variant uppercase">{label}</span>
      <span className="text-headline-sm text-on-surface font-bold mt-0.5">{value}</span>
    </div>
  )
}

const EFFECT = {
  helps: { tag: 'Helps', pill: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  hurts: { tag: 'Hurts', pill: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', bar: 'bg-tertiary-container' },
  neutral: { tag: 'Fair', pill: 'bg-surface-container text-on-surface-variant', bar: 'bg-secondary-container' },
}

function FactorRow({ factor, scored }: { factor: FactorResult; scored: ScoredHour }) {
  const metric = METRICS[factor.metric]
  const effect = EFFECT[factor.effect]
  const note = metric.note?.(scored.hour)
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant">
        <Icon name={metric.icon} className="text-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-body-sm font-semibold text-on-surface">{metric.label}</span>
          <span className="text-label-lg font-bold text-on-surface">
            {metric.value(scored.hour)}
            {metric.unit && ` ${metric.unit}`}
            {note && <span className="text-body-sm text-on-surface-variant font-normal"> {note}</span>}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${effect.bar}`} style={{ width: `${Math.max(4, factor.quality * 100)}%` }} />
        </div>
      </div>
      {/* Context-only readings (weight 0) don't move the score, so they get no verdict. */}
      <span
        className={`w-14 text-center text-label-md uppercase tracking-wider py-1 rounded-full font-bold shrink-0 ${
          factor.weight === 0 ? 'invisible' : effect.pill
        }`}
      >
        {effect.tag}
      </span>
    </div>
  )
}

/** Score trend from two hours before to three hours after the selected hour. */
function Surrounding({ plan, index }: { plan: Plan; index: number }) {
  const from = Math.max(0, Math.min(index - 2, plan.hours.length - 6))
  const hours = plan.hours.slice(from, from + 6)
  if (hours.length < 2) return null

  const x = (i: number) => 16 + (i * 288) / (hours.length - 1)
  const y = (score: number | null) => 70 - ((score ?? 0) / 100) * 60
  const line = hours.map((h, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(h.score)}`).join(' ')
  const last = hours[hours.length - 1].hour.time

  return (
    <section className="space-y-space-xs">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-headline-sm font-bold text-on-surface">Surrounding hours</h2>
        <span className="text-label-md text-on-surface-variant">
          {formatHour(hourOfDay(hours[0].hour.time))} – {formatHour(hourOfDay(last))}
        </span>
      </div>
      <div className={`${CARD} p-space-md`}>
        <div className="relative h-24">
          <svg className="w-full h-full overflow-visible text-primary" preserveAspectRatio="none" viewBox="0 0 320 80" aria-hidden="true">
            <path d={`${line} L ${x(hours.length - 1)},80 L ${x(0)},80 Z`} fill="currentColor" opacity="0.08" />
            <path d={line} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* An HTML dot, because the stretched SVG would squash a circle. */}
          <span
            className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/20"
            style={{ left: `${(x(index - from) / 320) * 100}%`, top: `${(y(plan.hours[index].score) / 80) * 100}%` }}
          />
        </div>
        <div className="grid text-center pt-2" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
          {hours.map((h, i) => {
            const selected = from + i === index
            return (
              <Link key={h.hour.time} to={`/hour/${toLocalIso(h.hour.time)}`} replace className="flex flex-col items-center">
                <span className={`text-label-md ${selected ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                  {formatHour(hourOfDay(h.hour.time))}
                </span>
                <span className={`text-body-sm mt-0.5 ${selected ? 'font-extrabold text-primary' : 'font-semibold text-on-surface'}`}>
                  {h.score ?? '–'}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The share sheet was dismissed, or the clipboard is blocked. Nothing to recover.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? 'Link copied' : 'Share this hour'}
      className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-sm"
    >
      <Icon name={copied ? 'check' : 'share'} className="text-[20px]" />
    </button>
  )
}
