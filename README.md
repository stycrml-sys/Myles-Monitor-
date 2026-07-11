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

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint      # run oxlint
```

Data lives entirely in `localStorage` on the device it's used on — export a
backup from the in-app Settings sheet periodically.
