# Myles' Monitor

A mobile-friendly web app for tracking a newborn's feeding, toileting and sleep, and
spotting patterns over time.

## Features

- **Feed tracking** — one-tap start/stop timer per breast (switch sides mid-feed),
  or log manually. Records duration and extent per side, plus comments.
- **Toileting tracking** — quick wee/poo logging with colour and consistency for
  poos (with a note when a colour is worth mentioning to a doctor).
- **Sleep tracking** — start/stop timer, sleep quality, interruptions with notes,
  and comments.
- **Trends** — hour / day / week / month views with charts and summary stats
  (feed count & gaps, sleep totals, diaper counts).
- All data is stored locally in the browser (no account, no server). Back it up
  or move it to another device from Settings → Export/Import.

## Fitness tracker (`/fitness/`)

A second, separate app in the same build — a daily fitness insights tracker at
`/Myles-Monitor-/fitness/`.

- **Today** — log your daily weight and push-ups (tap +5/+10/… per set, or a
  custom count). Back-fill any past day with the date picker.
- **Photos** — one waist and one arms photo per week. Compare any week against an
  earlier one side by side or with a before/after slider. With a Claude API key
  (Settings), "Analyse changes" writes notes on visible differences and flags
  lighting/pose inconsistencies.
- **Trends** — weight chart (daily weigh-ins + 7-day average + goal line),
  average push-ups per day by week, a week-by-week table, and automatic insights:
  weekly weight change, 4-week rate and ETA to goal, suspicious day-to-day
  swings, too-fast loss, push-up streaks, records and week-over-week change.
- Data stays on the device (localStorage; photos in IndexedDB). Export/Import in
  Settings includes photos; the API key is never exported.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint      # run oxlint
```

Data lives entirely in `localStorage` on the device it's used on — export a
backup from the in-app Settings sheet periodically.
