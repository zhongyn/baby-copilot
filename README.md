# Baby Copilot

A small offline-friendly PWA for tracking baby feeding, diapers, and sleep.

## Features
- Quick-tap log: breast (L/R/both with optional duration), pumped, formula, pee, poo, pee+poo, sleep
- Volumes stored in millilitres internally; display in **ml** or **oz** (Settings)
- Sleep entered as start + end times
- History grouped by day, filter by type, edit & delete
- Daily summary cards + 7/30-day charts (milk by kind, diaper counts, sleep hours)
- Multiple baby profiles
- Installable PWA (works offline after first load)
- All data stored locally in your browser (`localStorage`)

## Run
```
npm install
npm run dev
```

## Build
```
npm run build
npm run preview
```

## Notes
- First run auto-creates "Baby 1" so you can log immediately.
- Data lives in `localStorage` under `babycopilot:v1:snapshot`. Clearing browser storage resets the app.
- PWA icons in `public/` are simple placeholders; replace `icon-192.png` / `icon-512.png` for production.
