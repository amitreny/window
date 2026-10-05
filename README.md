# Window

Window tells you the best time in the next 48 hours to do something outside. Pick a place and an activity (run, beach, bike, stargazing or drying laundry) and it scores every hour from 0 to 100 using the forecast, then recommends the best stretch and shows why.

It is a mobile-first web app with no backend. All data comes straight from [Open-Meteo](https://open-meteo.com/) in the browser, and no API key is needed.

## Run it

You need Node 20.19 or newer (or 22.12 or newer).

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Run the unit tests for scoring and time handling |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Screens

- **Windows** (`/`): the recommended window, a 48-hour timeline with one bar per hour, current conditions, and other good windows. Tap any bar for its breakdown.
- **Hour detail** (`/hour/:time`): the hour's score, each factor marked as helping or hurting, the surrounding hours, and a reminder you can add to your calendar.
- **Places** (`/search`): city search, "use my current location", and saved places with each one's best time.
- **Limits** (`/tune`): per-activity sliders for temperature, wind, rain, UV and air quality, with a live preview of how the recommendation changes.

The selected place, saved places, activity and limits are kept in the browser's `localStorage`.

## How scoring works

Each activity lists the readings it cares about and a weight for each. Every reading is turned into a quality between 0 (rules the hour out) and 1 (ideal), measured against your limits for that activity.

- **Score:** 55% weighted average of the qualities plus 45% the worst one. The second part stops five perfect readings from hiding a downpour.
- **Tiers:** 80 and above is great, 50 to 79 is okay, below 50 is poor.
- **Skipped hours:** hours after dark for daylight-only activities, daytime for stargazing, and anything outside your earliest and latest hours get no score at all.
- **Windows:** a window is a run of consecutive great hours. The recommendation is the soonest window whose peak is within 5 points of the highest, so a slightly better window tomorrow does not beat a good one today.

To change how an activity is judged, edit its entry in `src/lib/activities.ts`. The formula itself is in `src/lib/scoring.ts`.

## Project layout

```
src/
  lib/
    openMeteo.ts    Fetches and joins forecast, air quality, sea state; city search
    activities.ts   Activity definitions, default limits, how each reading is displayed
    scoring.ts      Hour scores, windows, the recommendation, one-line summaries
    time.ts         Wall-clock time helpers (see "Time zones" below)
    ics.ts          Calendar reminder download
    geolocate.ts    Browser location as a place
  state/store.tsx   Selected place, saved places, activity and limits
  hooks/            Forecast loading with a 10-minute cache
  components/       Timeline, shared layout and Home's loading, error and first-launch states
  screens/          One file per screen
design/stitch/      The original Google Stitch export: HTML, screenshots and DESIGN.md
```

Built with React, TypeScript, Vite and Tailwind CSS 3. Colour and type tokens in `tailwind.config.js` come from `design/stitch/DESIGN.md`. Stargazing switches the app to a dark navy palette by swapping CSS variables.

## Data and attribution

Three Open-Meteo endpoints are called per place: weather forecast, air quality, and marine (wave height and sea temperature). Weather is required. If air quality or marine data is missing for a place, those readings are left out of the score.

Open-Meteo's free tier is for non-commercial use, limited to 10,000 calls a day, and its data is licensed CC-BY 4.0. The app credits Open-Meteo at the bottom of the Windows screen; keep that credit if you change the layout. Commercial use needs a paid Open-Meteo plan.

## Time zones

All times shown are local to the selected place, not to the viewer. Open-Meteo returns wall-clock strings such as `2026-10-06T14:00`; `src/lib/time.ts` parses them as if they were UTC and only reads them back with UTC accessors. Use those helpers instead of `Date` methods like `getHours()`, which would shift times into the viewer's zone.

## Known limitations

- Windows start and end on the hour, because the forecast is hourly.
- "Use my current location" shows coordinates instead of a city name, since Open-Meteo has no reverse geocoding.
- Saved places can be removed but not reordered.
- The reminder is a downloaded calendar file, not a push notification.
- Fonts and icons load from Google Fonts, so the first visit needs a connection even before any forecast is fetched.
