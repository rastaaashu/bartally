# PLAN — BarTally, delivered webapp-first

## Brief restated (drift check)
Client (bar owner, Morocco, French-speaking) needs a standalone daily inventory
app for one bar. Core loop: opening stock → staff log sales in ≤2 taps → owner
logs restocks + waste → owner runs a Daily Count where the app shows
`expected = last closed count + restocks − sales − waste`, owner types the real
count, app shows per-item variance so theft/loss is visible. Not connected to
any POS. Two roles: owner (everything) and employees (log sales only, can never
edit or delete anything). Must look like a million-dollar product: ink+gold
identity, Space Grotesk numerals, imagery on every item card, animation,
French default with EN toggle. Handles the full 50-item catalog (§5) with
search/categories. Low-stock + variance alerts. Reports, insights (trends, top
sellers, shrinkage-over-time, days-to-stockout, reorder list), CSV/PDF exports,
optional owner-only unit costs, JSON backup. Simplicity Law: staff side stays
2 taps; every power feature lives owner-side.

## Delivery strategy (user's instruction, 2026-07-28)
User needs the FULL LIVE product TODAY, as a webapp, deployed on their GitHub.
Native iOS/Android app follows after client approval (50% now / 50% at app
go-live). So:

- **Today:** complete production webapp (PWA — installable full-screen with icon
  on Android AND iPhone via "Add to Home Screen"), deployed to GitHub Pages,
  data local-first per device with full JSON backup/restore. Zero third-party
  accounts needed. This is the thing the client uses now.
- **Phase 2 (needs user's accounts):** Supabase backend (live multi-device
  sync, server-enforced roles, push notifications) + Expo native builds (APK
  direct-install, TestFlight/ad-hoc iOS, then stores). NEXT-STEPS.md lists the
  exact accounts and the exact commands.

## Architecture (webapp)
- Single-page app, ONE self-contained `index.html` (all CSS/JS/fonts/art
  inline) assembled from `src/` modules by `build.mjs`. Same file serves
  GitHub Pages and the Claude artifact preview. PWA extras (manifest, sw.js,
  icons) ship alongside on Pages.
- Data: localStorage (versioned schema, migrations), append-only entry tables,
  soft voids, audit log. Business-date mapping with configurable 06:00 cutoff.
- Expected-stock engine implemented once in pure JS + self-tests that run in CI
  (node) against fixture cases.
- Roles client-side: owner PIN (hashed, crypto.subtle), employee picker (+
  optional PIN). UI + data layer both enforce employee append-only.
- Charts hand-built SVG per dataviz method; palette validated.
- i18n dict FR (default) + EN, zero hardcoded strings in screens.

## Milestones
- [x] M0 plan + decisions
- [ ] M1 core: tokens, i18n, store+engine+seed, UI kit, fonts, palette validation
- [ ] M2 screens via parallel agents (login/wizard, sell, dashboard, inventory,
      count, restock/waste, reports, insights, settings)
- [ ] M3 assemble + boot + click-through + fix
- [ ] M4 QA swarm (math, French, UX, code, §1.1 checklist) + fixes
- [ ] M5 PWA shell + icons + logo
- [ ] M6 deploy GitHub Pages live + artifact preview
- [ ] M7 screenshots + French client message + README + NEXT-STEPS
