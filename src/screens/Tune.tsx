import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { barColor } from '../components/Timeline'
import { CARD, Icon, Screen } from '../components/ui'
import { useForecast } from '../hooks/useForecast'
import { ACTIVITIES, type Limits } from '../lib/activities'
import { buildPlan, summarize, type Plan } from '../lib/scoring'
import { dayLabel, formatHour, formatTime } from '../lib/time'
import { useStore } from '../state/store'

const THUMB = 28

/** Where a thumb's centre sits for a 0–1 fraction. Native thumbs stop half a thumb short of each end. */
const thumbAt = (fraction: number) => `calc(${fraction * 100}% + ${(0.5 - fraction) * THUMB}px)`

export default function Tune() {
  const { place, activity, limitsFor, setLimits } = useStore()
  const { forecast } = useForecast(place)
  const navigate = useNavigate()
  const def = ACTIVITIES[activity]
  const [draft, setDraft] = useState<Limits>(() => limitsFor(activity))
  const set = (patch: Partial<Limits>) => setDraft((d) => ({ ...d, ...patch }))
  const has = (control: (typeof def.controls)[number]) => def.controls.includes(control)

  const preview = useMemo(() => (forecast ? buildPlan(forecast, def, draft) : null), [forecast, def, draft])

  function save() {
    setLimits(activity, draft)
    navigate('/')
  }

  const reset = (
    <button
      type="button"
      onClick={() => setDraft(def.defaults)}
      className="min-w-[44px] min-h-[44px] px-space-xs text-label-lg text-primary hover:text-primary-container transition-colors"
    >
      Reset
    </button>
  )

  return (
    <Screen back={{ title: def.label, to: '/', action: reset }}>
      <p className="px-gutter pt-space-xs pb-space-sm text-body-sm text-on-surface-variant/80">Hours outside your limits score lower.</p>

      <div className="px-gutter space-y-space-md pb-32">
        {has('temp') && (
          <Setting icon="device_thermostat" label="Comfortable temperature" value={`${draft.tempMin}° — ${draft.tempMax}°`} hint="Feels-like range">
            <Slider
              min={-10}
              max={45}
              low={draft.tempMin}
              high={draft.tempMax}
              onChange={(tempMin, tempMax) => set({ tempMin, tempMax })}
              label="Temperature"
              suffix="°C"
            />
          </Setting>
        )}
        {has('wind') && (
          <Setting icon="air" label="Max wind" value={draft.maxWind} unit="km/h" hint={draft.maxWind < 12 ? 'Light air only' : draft.maxWind < 30 ? 'Up to a moderate breeze' : 'Strong wind is fine'}>
            <Slider min={5} max={60} step={5} high={draft.maxWind} onChange={(_, maxWind) => set({ maxWind })} label="Max wind" suffix=" km/h" />
          </Setting>
        )}
        {has('rain') && (
          <Setting icon="rainy" label="Max rain chance" value={draft.maxRain} unit="%" hint={draft.maxRain <= 10 ? 'Dry hours only' : draft.maxRain <= 40 ? 'A slight risk is fine' : "Rain doesn't stop me"}>
            <Slider min={0} max={100} step={5} high={draft.maxRain} onChange={(_, maxRain) => set({ maxRain })} label="Max rain chance" suffix="%" />
          </Setting>
        )}
        {has('uv') && (
          <Setting icon="wb_sunny" label="Max UV index" value={draft.maxUv} hint={draft.maxUv < 3 ? 'Low' : draft.maxUv < 6 ? 'Moderate' : draft.maxUv < 8 ? 'High' : 'Very high'}>
            <Slider min={1} max={11} high={draft.maxUv} onChange={(_, maxUv) => set({ maxUv })} label="Max UV index" />
          </Setting>
        )}
        {has('aqi') && (
          <Setting icon="eco" label="Max air quality index" value={draft.maxAqi} unit="AQI" hint={draft.maxAqi <= 50 ? 'Good air only' : draft.maxAqi <= 100 ? 'Up to moderate' : 'Unhealthy air tolerated'}>
            <Slider min={25} max={200} step={25} high={draft.maxAqi} onChange={(_, maxAqi) => set({ maxAqi })} label="Max air quality index" />
          </Setting>
        )}

        {has('daylight') && (
          <div className={`${CARD} p-space-md flex items-center justify-between`}>
            <div className="flex items-start gap-3 pr-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="light_mode" className="text-[22px] text-primary" />
              </div>
              <div>
                <h2 className="text-headline-sm text-on-surface">Daylight only</h2>
                <p className="text-body-sm text-on-surface-variant">Skip hours after dark</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.daylightOnly}
              aria-label="Daylight only"
              onClick={() => set({ daylightOnly: !draft.daylightOnly })}
              className={`w-14 h-8 shrink-0 rounded-full p-1 flex items-center transition-colors ${
                draft.daylightOnly ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'
              }`}
            >
              <span className="w-6 h-6 bg-surface-container-lowest rounded-full shadow-md" />
            </button>
          </div>
        )}

        {has('hours') && (
          <div className={`${CARD} p-space-md`}>
            <div className="flex items-center gap-2 mb-space-sm">
              <Icon name="schedule" className="text-[20px] text-primary" />
              <span className="text-label-lg tracking-wide uppercase text-on-surface-variant">Earliest and latest</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <HourSelect label="Earliest start" value={draft.earliest} from={0} to={draft.latest - 1} onChange={(earliest) => set({ earliest })} />
              <HourSelect label="Latest finish" value={draft.latest} from={draft.earliest + 1} to={24} onChange={(latest) => set({ latest })} />
            </div>
          </div>
        )}

        {preview && <Preview plan={preview} noun={def.noun} />}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-surface/90 backdrop-blur-xl px-gutter pt-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="pb-3">
          <button
            type="button"
            onClick={save}
            className="w-full bg-primary-container hover:bg-primary text-white py-4 px-6 rounded-2xl text-label-lg tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            Save
            <Icon name="check" className="text-[20px]" />
          </button>
        </div>
      </div>
    </Screen>
  )
}

function Setting(props: { icon: string; label: string; value: ReactNode; unit?: string; hint: string; children: ReactNode }) {
  return (
    <div className={`${CARD} p-space-md`}>
      <div className="flex items-center gap-2 mb-space-xs">
        <Icon name={props.icon} className="text-[20px] text-primary" />
        <span className="text-label-lg tracking-wide uppercase text-on-surface-variant">{props.label}</span>
      </div>
      <div className="flex items-baseline justify-between mb-space-sm">
        <div className="text-numeral-score-mobile text-on-surface">
          {props.value}
          {props.unit && <span className="text-headline-sm text-on-surface-variant tracking-normal"> {props.unit}</span>}
        </div>
        <span className="text-body-sm text-on-surface-variant">{props.hint}</span>
      </div>
      {props.children}
    </div>
  )
}

interface SliderProps {
  min: number
  max: number
  step?: number
  /** Pass `low` for a two-thumb range; leave it out for a single "up to" limit. */
  low?: number
  high: number
  onChange: (low: number, high: number) => void
  label: string
  suffix?: string
}

function Slider({ min, max, step = 1, low, high, onChange, label, suffix = '' }: SliderProps) {
  const fraction = (value: number) => (value - min) / (max - min)
  const ranged = low != null
  return (
    <>
      <div className="relative h-7 my-2">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-surface-container rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 bg-primary-container rounded-full"
            style={{ left: ranged ? thumbAt(fraction(low)) : 0, right: `calc(100% - ${thumbAt(fraction(high))})` }}
          />
        </div>
        {ranged && (
          <input
            type="range"
            className="range"
            min={min}
            max={max}
            step={step}
            value={low}
            aria-label={`${label}, lowest`}
            onChange={(e) => onChange(Math.min(Number(e.target.value), high - step), high)}
          />
        )}
        <input
          type="range"
          className="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={ranged ? `${label}, highest` : label}
          onChange={(e) => onChange(low ?? min, ranged ? Math.max(Number(e.target.value), low + step) : Number(e.target.value))}
        />
      </div>
      <div className="flex justify-between text-on-surface-variant text-label-md pt-1">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </>
  )
}

function HourSelect(props: { label: string; value: number; from: number; to: number; onChange: (hour: number) => void }) {
  const options = Array.from({ length: props.to - props.from + 1 }, (_, i) => props.from + i)
  return (
    <label className="relative bg-surface-container-low hover:bg-surface-container rounded-2xl p-3.5 flex flex-col cursor-pointer transition-colors">
      <span className="text-label-md uppercase tracking-wider text-on-surface-variant mb-1">{props.label}</span>
      <span className="flex items-center justify-between">
        <span className="text-headline-sm font-bold text-on-surface">{formatHour(props.value)}</span>
        <Icon name="expand_more" className="text-[18px] text-on-surface-variant" />
      </span>
      {/* The native picker sits invisibly over the pill, so it opens the platform's own hour list. */}
      <select
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map((hour) => (
          <option key={hour} value={hour}>
            {formatHour(hour)}
          </option>
        ))}
      </select>
    </label>
  )
}

function Preview({ plan, noun }: { plan: Plan; noun: string }) {
  const { best } = plan
  const peak = best ? plan.hours[best.peakIndex] : plan.peakIndex === -1 ? null : plan.hours[plan.peakIndex]
  return (
    <div className={`${CARD} p-space-md`} aria-live="polite">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="text-label-md tracking-wider uppercase text-primary font-bold">With these settings</span>
        <span className="text-label-md text-on-surface-variant">Next 48 hours</span>
      </div>
      <div className="flex items-center justify-between gap-3 mb-space-md">
        <div className="min-w-0">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider block">
            {best ? `Best window for ${noun}` : 'No great window'}
          </span>
          {peak ? (
            <>
              <p className="text-headline-sm font-bold text-on-surface mt-0.5">
                {formatTime(best?.start ?? peak.hour.time)}{' '}
                <span className="text-on-surface-variant font-normal text-body-md">
                  {dayLabel(best?.start ?? peak.hour.time, plan.now).toLowerCase()}
                </span>
              </p>
              <p className="text-body-sm text-on-surface-variant truncate">{summarize(peak, 3)}</p>
            </>
          ) : (
            <p className="text-body-sm text-on-surface-variant mt-0.5">These limits skip every hour.</p>
          )}
        </div>
        {peak && (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${best ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}>
            <span className="text-[1.75rem] font-extrabold leading-none">{peak.score}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-0.5 h-14 w-full" aria-hidden="true">
        {plan.hours.map(({ hour, score }) => (
          <div key={hour.time} className={`flex-1 rounded-t-sm ${barColor(score)}`} style={{ height: `${score == null ? 8 : Math.max(12, score)}%` }} />
        ))}
      </div>
    </div>
  )
}
