# Fitness Tracker

A mobile-friendly daily fitness insights tracker: log your weight and push-ups,
take weekly waist and arm progress photos, and see the trends.

## Features

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
- All data stays on the device (localStorage; photos in IndexedDB). Export/Import
  in Settings includes photos; the API key is never exported.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint     # run oxlint
```

Pushes to `main` deploy to GitHub Pages at
`https://stycrml-sys.github.io/Myles-Monitor-/`.
