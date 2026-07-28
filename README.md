# BarTally — premium bar inventory PWA

Standalone daily-count inventory app for a single bar. Staff log sales in
2 taps; the owner runs a guided daily count where the app computes
`expected = last count + deliveries − sales − waste` and reveals per-item
variance — so losses have nowhere to hide. French-first, installable on any
phone, works offline.

**Live:** https://rastaaashu.github.io/bartally/

## Run locally
```
node build.mjs          # assembles src/ → index.html + docs/ + artifact.html
node tests/engine.test.mjs   # stock-math test suite
npx http-server docs    # or open docs/index.html
```

## Architecture
- `src/` — modules concatenated by `build.mjs` into ONE self-contained
  `index.html` (fonts, art, CSS, JS all inline; zero external requests).
- `docs/` — GitHub Pages root (index + PWA manifest, service worker, icons).
- Data: versioned localStorage, append-only entry logs, soft voids, audit
  trail, business-day cutoff (06:00 default — a 1:30 AM sale belongs to the
  previous evening).
- Roles: owner (PIN, everything) / employees (log sales only).
- Item visuals: parametric SVG bottle/dish art per item, owner camera photos
  supported in-app.

## Documents
- `PLAN.md` — architecture + milestones
- `DECISIONS.md` — every judgment call and why
- `CLIENT-MESSAGE.md` — ready-to-send French client message
- `NEXT-STEPS.md` — Phase 2 (Supabase live sync) + Phase 3 (native apps)
- `requirements.md` — original product brief
