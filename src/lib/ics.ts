import { toLocalIso } from './time'

// Times are written without a timezone ("floating"), so the event lands at the same
// wall-clock time the forecast showed for the place.
const stamp = (ms: number) => toLocalIso(ms).replace(/[-:]/g, '') + '00'

/** Download a calendar event with an alert `leadMinutes` before it starts. */
export function downloadReminder(title: string, description: string, start: number, end: number, leadMinutes = 15) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Window//EN',
    'BEGIN:VEVENT',
    `UID:${start}-${Date.now()}@window`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    `TRIGGER:-PT${leadMinutes}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'window-reminder.ics'
  link.click()
  URL.revokeObjectURL(url)
}
