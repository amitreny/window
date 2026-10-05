import { Link } from 'react-router-dom'
import { FirstLaunch, HomeSkeleton, LoadError } from '../components/HomeStates'
import { Timeline } from '../components/Timeline'
import { Attribution, CARD, Icon, Screen, TIER } from '../components/ui'
import { usePlan } from '../hooks/useForecast'
import { ACTIVITIES, ACTIVITY_ORDER, METRICS, type ActivityDef } from '../lib/activities'
import { placeTitle, type Forecast, type HourData } from '../lib/openMeteo'
import { GREAT, alternatives, summarize, tierOf, type Plan, type Window } from '../lib/scoring'
import { clockParts, dayLabel, formatDuration, formatTime, hourOfDay, toLocalIso } from '../lib/time'
import { useStore } from '../state/store'

export default function Home() {
  const { place, activity } = useStore()
  const { status, forecast, plan, retry } = usePlan(place)
  const def = ACTIVITIES[activity]

  if (!place) {
    return (
      <Screen>
        <FirstLaunch />
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col w-full px-gutter space-y-space-md">
        <div className="flex items-center justify-between pt-space-xs">
          <Link to="/search" className="group flex items-center gap-1.5 min-w-0 transition-transform active:scale-95">
            <span className="text-headline-sm text-on-surface truncate">{placeTitle(place)}</span>
            <Icon name="expand_more" className="text-[18px] text-on-surface-variant transition-transform group-hover:translate-y-0.5" />
          </Link>
          <Link
            to="/tune"
            aria-label={`Adjust limits for ${def.label}`}
            className="w-10 h-10 shrink-0 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-sm"
          >
            <Icon name="tune" className="text-[20px]" />
          </Link>
        </div>

        <ActivityChips />

        {status === 'error' && <LoadError onRetry={retry} />}
        {status === 'loading' && <HomeSkeleton />}
        {forecast && plan && <Dashboard plan={plan} forecast={forecast} def={def} />}

        {status !== 'error' && <Attribution />}
      </div>
    </Screen>
  )
}

function ActivityChips() {
  const { activity, setActivity } = useStore()
  return (
    <div className="overflow-x-auto no-scrollbar -mx-gutter px-gutter">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {ACTIVITY_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === activity}
            onClick={() => setActivity(id)}
            className={`rounded-full px-4 py-2 text-label-lg shadow-sm transition-all active:scale-95 ${
              id === activity
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {ACTIVITIES[id].label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Dashboard({ plan, forecast, def }: { plan: Plan; forecast: Forecast; def: ActivityDef }) {
  const { limitsFor } = useStore()
  const others = plan.windows.slice(1, 4)
  const current = plan.hours[0]?.hour

  return (
    <>
      {plan.best ? <BestWindow plan={plan} best={plan.best} def={def} /> : <NoGreatWindow plan={plan} def={def} />}

      <div className={`${CARD} p-space-md space-y-3`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-sm text-on-surface font-bold">Next 48 hours</h2>
            <p className="text-body-sm text-on-surface-variant">Tap an hour for its breakdown</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">{GREAT}+ great</span>
          </div>
        </div>
        <Timeline plan={plan} sunEvents={forecast.sunEvents} />
      </div>

      {current && <RightNow hour={current} def={def} fetchedAt={forecast.fetchedAt} />}

      {others.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-headline-sm text-on-surface font-bold">Other good windows</h2>
          <div className="rounded-[16px] bg-surface-container-lowest shadow-card overflow-hidden divide-y divide-surface-container">
            {others.map((w) => (
              <WindowRow key={w.start} window={w} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {!plan.best && <Alternatives options={alternatives(forecast, def.id, limitsFor)} />}
    </>
  )
}

function BestWindow({ plan, best, def }: { plan: Plan; best: Window; def: ActivityDef }) {
  const peak = plan.hours[best.peakIndex]
  const underway = best.start <= plan.now
  const clock = clockParts(best.start)

  return (
    <Link to={`/hour/${toLocalIso(peak.hour.time)}`} className={`${CARD} block p-space-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-primary">
          <Icon name={def.nightOnly ? 'dark_mode' : 'schedule'} className="text-[16px]" />
          <span className="text-label-md uppercase tracking-wider">Best window for {def.noun}</span>
        </div>
        <span className="bg-primary/10 text-primary text-label-md uppercase tracking-wider px-2 py-0.5 rounded-full">Great</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="text-display-hero-mobile text-on-surface">
            {underway ? (
              'Now'
            ) : (
              <>
                {clock.time} <span className="text-headline-md font-semibold text-on-surface-variant">{clock.period}</span>
              </>
            )}
          </div>
          <p className="text-body-md font-semibold text-on-surface-variant mt-1">
            {underway
              ? `Until ${formatTime(best.end)}`
              : `${dayLabel(best.start, plan.now)}, ${formatDuration(best.hours)}`}
          </p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="text-numeral-score-mobile leading-none">{best.peak}</span>
          </div>
          <span className="text-label-md text-on-surface-variant mt-1 uppercase tracking-wider">Peak score</span>
        </div>
      </div>

      <div className="mt-4 bg-surface-container-low/70 rounded-xl px-3 py-2 flex items-center gap-2">
        <Icon name="check_circle" className="text-primary text-[18px] shrink-0" />
        <p className="text-body-sm text-on-surface-variant leading-tight">{summarize(peak)}</p>
      </div>
    </Link>
  )
}

function NoGreatWindow({ plan, def }: { plan: Plan; def: ActivityDef }) {
  const peak = plan.peakIndex === -1 ? null : plan.hours[plan.peakIndex]

  return (
    <div className={`${CARD} p-space-md`}>
      <div className="flex items-center gap-1.5 text-secondary mb-3">
        <Icon name="info" className="text-[16px]" />
        <span className="text-label-md uppercase tracking-wider">No great window for {def.noun}</span>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-headline-lg-mobile text-on-surface leading-snug">No great window in the next 48 hours</h2>
          {peak && (
            <p className="text-body-md text-on-surface-variant font-medium mt-1">
              Best available:{' '}
              <Link to={`/hour/${toLocalIso(peak.hour.time)}`} className="text-on-surface font-semibold underline underline-offset-2">
                {dayLabel(peak.hour.time, plan.now)} {formatTime(peak.hour.time)}
              </Link>
            </p>
          )}
          <Link to="/tune" className="mt-3 inline-flex items-center gap-1 text-label-lg text-primary hover:underline">
            Adjust my limits
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
        {peak && (
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${TIER[tierOf(peak.score!)].solid}`}>
              <span className="text-numeral-score-mobile leading-none">{peak.score}</span>
            </div>
            <span className="text-label-md text-on-surface-variant mt-1 uppercase tracking-wider">Peak score</span>
          </div>
        )}
      </div>

      {peak && summarize(peak) && (
        <div className="mt-4 bg-surface-container-low/80 rounded-xl px-3 py-2.5 flex items-start gap-2.5 border border-surface-container-high">
          <Icon name="warning" className="text-secondary-container text-[18px] shrink-0 mt-0.5" />
          <p className="text-body-sm text-on-surface-variant leading-relaxed">{summarize(peak)}</p>
        </div>
      )}
    </div>
  )
}

function RightNow({ hour, def, fetchedAt }: { hour: HourData; def: ActivityDef; fetchedAt: number }) {
  const minutes = Math.floor((Date.now() - fetchedAt) / 60_000)
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-label-md uppercase tracking-wider text-on-surface-variant">Right now</h2>
        <span className="text-label-md text-on-surface-variant">{minutes < 1 ? 'Updated just now' : `Updated ${minutes}m ago`}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {def.tiles.map((id) => {
          const metric = METRICS[id]
          return (
            <div key={id} className="rounded-[16px] bg-surface-container-lowest p-3 flex flex-col items-center text-center shadow-card">
              <Icon name={metric.icon} className="text-[18px] text-on-surface-variant mb-1" />
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{metric.short}</span>
              <span className="text-headline-sm text-on-surface font-bold mt-0.5 whitespace-nowrap">
                {metric.value(hour)}
                {metric.unit && <span className="text-[11px] font-normal text-on-surface-variant"> {metric.unit}</span>}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function timeOfDayIcon(time: number, isDay: boolean): string {
  if (!isDay) return 'nights_stay'
  const h = hourOfDay(time)
  return h < 9 || h >= 17 ? 'wb_twilight' : 'wb_sunny'
}

function WindowRow({ window: w, plan }: { window: Window; plan: Plan }) {
  const peak = plan.hours[w.peakIndex]
  return (
    <Link
      to={`/hour/${toLocalIso(peak.hour.time)}`}
      className="p-space-md flex items-center justify-between gap-3 hover:bg-surface-container-low/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
          <Icon name={timeOfDayIcon(w.start, peak.hour.isDay)} className="text-[20px]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-headline-sm text-on-surface whitespace-nowrap">
              {dayLabel(w.start, plan.now)} {formatTime(w.start)}
            </span>
            <span className="text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full whitespace-nowrap">
              {formatDuration(w.hours)}
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant truncate">{summarize(peak, 2)}</p>
        </div>
      </div>
      <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
        <span className="text-headline-sm text-primary font-bold">{w.peak}</span>
      </div>
    </Link>
  )
}

function Alternatives({ options }: { options: ReturnType<typeof alternatives> }) {
  const { setActivity } = useStore()
  const shown = options.slice(0, 3)
  if (shown.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-headline-sm text-on-surface font-bold">Other activities look better</h2>
      <div className={`${CARD} p-space-md flex flex-wrap items-center gap-2`}>
        {shown.map(({ id, score }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActivity(id)}
            className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container-high px-3.5 py-2 rounded-full transition-colors"
          >
            <Icon name={ACTIVITIES[id].icon} className="text-[18px] text-primary" />
            <span className="text-label-lg text-on-surface">{ACTIVITIES[id].label}</span>
            <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">Score {score}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
