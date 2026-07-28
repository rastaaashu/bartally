MASTER BUILD BRIEF v2 — Bar Inventory & Daily Count App (white-label, working name "BarTally")
You are building a COMPLETE, PRODUCTION-READY product in this session — not an MVP, not a prototype. A paying client will receive this and it must look and feel like software from a million-dollar company. Read this entire brief before writing any code.
---
0. How you must operate
Plan first. Ultrathink the full architecture and execution plan before touching code. Write it to `PLAN.md` with a milestone checklist, keep a live todo list, and tick items as you complete them.
Use everything available to you. Extended thinking for architecture and tricky decisions; subagents to parallelize independent tracks (e.g., database schema + RLS while another agent scaffolds UI, another sources imagery); any installed skills — especially design/frontend skills when building screens.
Work milestone by milestone (§9). After each milestone: run typecheck, lint, and tests; boot the app and click through the flows; fix everything before moving on. `git init` if needed and commit per milestone with clear messages.
Never stop to ask questions. If information is missing, make the best production-grade decision, record it in `DECISIONS.md`, and continue. The only legitimate blockers are missing third-party credentials — handle those per §10 (build against placeholders + write exact setup docs) and keep going.
North star: coherent brand, flawless states, fast, zero jank. No lorem ipsum, no unstyled screens, no dead ends, no "TODO" left in code. Every screen has loading, empty, and error states. French is the default language.
The Simplicity Law (resolve every design tension with this): the employee side must never exceed 2 taps to log a sale. ALL power features live on the owner side. Any feature that adds friction for staff gets cut or moved — richness for the owner, radical simplicity for staff.
1. Product summary
A standalone inventory tracking app for a single bar (the client will supply the bar's name + logo later — make branding configurable in Settings; ship with a tasteful neutral default).
The one job this app must do perfectly: the owner physically counts stock every day and wants the app's expected numbers to reconcile against his physical count so he can spot losses. The app is deliberately NOT connected to any POS/till system — it is an independent source of truth.
Users:
Owner (admin): full control. Runs daily counts, logs restocks and waste, edits/voids anything (audit-logged), manages items and employees, sees insights, receives notifications.
Employees: can log what they sold, and that is ALL. They cannot edit or delete anything — not even their own entries. Enforced server-side, not just hidden buttons.
Core loop:
First-run wizard: owner sets opening stock for every item (catalog pre-seeded from §5).
During service, staff log sales in a fast 2-tap flow.
Owner logs deliveries/restocks when stock arrives, and breakage/waste when bottles break.
Next day, owner runs a Daily Count: for each item the app shows `expected = last counted + restocks − sales − waste`; owner enters the actual counted number; the app computes per-item and total variance, then closes the business day and stores the report.
Low-stock alerts and variance alerts reach the owner by push notification.
Business-day rule (important): bar nights run past midnight. All timestamps map to a `business_date` using a configurable day-cutoff hour (default 06:00). A sale at 01:30 belongs to the previous evening's business day.
1.1 Client's explicit requirements — NON-NEGOTIABLE checklist
Every line below came directly from the client. The final self-review (§8) must verify each one is demonstrably true:
Track inventory daily: start count − sold = tomorrow's expected → core loop + variance engine
Handles a LOT of items → virtualized lists, categories, instant search
Low inventory → push notification → §6
NOT linked to the shop/till system → fully standalone
Owner re-counts daily and "just wants the numbers to match" → Daily Count + variance report is the heart of the app
Employee login AND owner login → roles + RLS
Employees can add what they sold → Log Sale screen
ONLY the owner can edit anything → RLS + audit log + soft voids
Must look like an expensive, premium product → §7 design language
"Even with pics" → HD imagery pipeline (§5.1) + in-app camera photos
Mobile app on App Store AND Google Play → EAS + SUBMIT.md
Simple → the Simplicity Law (§0)
2. Locked tech stack
No substitutions unless something is genuinely unavailable in this environment — record any substitution and why in `DECISIONS.md`.
App: Expo (latest stable SDK) + TypeScript strict, `expo-router` for navigation.
UI: NativeWind (Tailwind for RN) + a custom component kit; `react-native-reanimated` for micro-animations; `expo-haptics`; `expo-image` (caching); FlashList (or equivalent virtualization) for all grids/lists.
Data: TanStack Query with AsyncStorage persistence + a durable offline mutation queue for sale entries (bars have bad wifi — a logged sale must never be lost; queue, retry, sync, show a "pending" state). Supabase Realtime so the owner's dashboard updates live as staff log sales.
Backend: Supabase — Postgres with Row Level Security, Supabase Auth, Storage (item photos), Edge Functions + scheduled function (cron) for notifications.
Device features: `expo-camera` for item photos AND barcode scanning; `expo-local-authentication` for owner Face ID / fingerprint unlock (with PIN/password fallback).
Push: Expo Notifications; store Expo push tokens per user/device.
Charts: hand-built with `react-native-svg` (sparklines, bars, trend lines) — clean and dependency-light; no heavyweight chart library.
Exports: CSV + Excel (.xlsx via SheetJS) + branded PDF (`expo-print`) shared through the native share sheet.
i18n: i18next. French default, English toggle. Zero hardcoded strings. Structure keys so Arabic could be added later (do not build RTL now).
Builds: EAS — `eas.json` with development/preview/production profiles; the `preview` profile MUST produce a direct-install Android APK (`"android": {"buildType": "apk"}`) and an iOS internal-distribution (ad hoc) build, since the app will first be delivered to the bar by link, not through the stores. Configure `expo-updates` (EAS Update) on the preview channel so JS fixes can be pushed over the air to already-installed APKs. `app.json` fully configured (name, slug, placeholder bundle IDs like `com.CLIENT.bartally`, icons, splash, adaptive icon, camera/notification permission strings in FR+EN).
Tests: unit tests for ALL stock math (expected/variance/business-date mapping), SQL tests for RLS policies, a light component test for the sale-logging flow.
3. Data model (Postgres, via Supabase migrations)
Create real migration files. Tables (adjust details as needed, but keep these semantics):
`profiles` — id (auth uid), display_name, role `'owner' | 'employee'`, active, created_at.
`categories` — id, name_fr, name_en, sort, accent_color, icon.
`items` — id, category_id, name, unit (`bouteille` / `canette` / `portion` / free text), allow_decimal bool (spirits are counted in partial bottles, e.g. 3.5), low_stock_threshold, photo_url, barcode (nullable — owner attaches by scanning), pinned bool (favorites row), active, sort.
`item_costs` — item_id, unit_cost numeric, currency_label. SEPARATE table, owner-only RLS, entirely optional: if the owner enters costs, reports can show loss in money; if not, everything works purely in units. Employees can never read this table.
`sales_entries` — id, item_id, qty numeric, business_date, created_by, created_at, voided_at/voided_by (owner-only soft void; NEVER hard delete).
`restocks` — same shape as sales_entries, owner-only.
`waste_entries` — same shape + reason text (e.g. "casse — 2 bouteilles tombées"), owner-only. Waste is tracked separately so the variance report shows TRUE unexplained loss, not breakage.
`daily_counts` — id, business_date unique, status open/closed, closed_at, closed_by.
`count_lines` — count_id, item_id, expected numeric, counted numeric, variance numeric (generated), note text (owner can annotate a discrepancy).
`audit_log` — actor, action, entity, entity_id, before/after jsonb, at. Populated by triggers on every owner mutation and void.
`push_tokens` — user_id, token, platform, updated_at.
`app_settings` — single row: bar_name, logo_url, day_cutoff_hour, variance_alert_threshold, low_stock_digest_time, count_reminder_time, biometric_enabled.
Expected-stock formula — implement ONCE as a SQL view/function and mirror it in a pure TS function, both covered by the same test cases:
```
expected(item, business_date) =
  counted qty at the most recent CLOSED count on/before that date
  + Σ restocks since that count
  − Σ non-voided sales since that count
  − Σ waste since that count
```
RLS matrix (enforced in the database — this is the security model):
employee: SELECT on items/categories/settings and read expected stock; INSERT into sales_entries with `created_by = auth.uid()` only; NO update/delete anywhere; no access to audit_log, item_costs, waste_entries.
owner: full CRUD on everything; every mutation audit-logged.
Write RLS tests that prove an employee session cannot update/delete/void anything, cannot insert as another user, and cannot read costs.
4. Screens & UX spec
Login — fast user-picker + PIN for employees (speed at the bar matters), email + password for the owner, optional Face ID / fingerprint for the owner after first login. Owner creates employee accounts in Settings (name + 4–6 digit PIN). Employees must be real Supabase auth users provisioned via an owner-only Edge Function; document the exact secure approach in `DECISIONS.md` (PINs never stored in plaintext).
Owner dashboard — today at a glance, updating LIVE via Realtime as staff log sales: sales logged today with a subtle live-pulse feed, low-stock items, last count's variance summary (green if clean, red if not), 7-day sales sparkline, quick actions: Log sale · New count · Restock · Waste.
Inventory — category chips + instant search; item cards with photo, unit, current expected qty, low-stock badge; pinned items float to top. Owner taps an item → edit sheet: name, category, unit, decimal toggle, threshold, pin, photo (camera or gallery → Supabase Storage), and "scan barcode to attach" so future scans jump straight to this item.
Log sale (both roles — the most-used screen; optimize ruthlessly) — favorites row + recents row on top, then photo grid by category, instant search, and a barcode-scan button that jumps straight to the item. Tap item → quantity stepper (default 1, long-press to accelerate) → confirm. Two taps for the common case. Haptic feedback, undo-toast for a few seconds, then immutable for employees (owner can void later from Reports). Fully functional offline via the mutation queue with visible "pending sync" state.
Restock & Waste (owner) — same fast pattern as Log sale; waste requires a short reason.
Daily count (owner) — guided category-by-category walkthrough with progress ring; each line shows expected + numeric input for counted (decimal pad where allowed); barcode scan jumps to any item mid-count; review screen with per-item variance colored red/green, optional note per discrepancy, and day totals; confirm → closes the business day with a calm, satisfying "day closed" moment. Reopening a closed day requires owner override and is audit-logged.
Reports & Insights (owner) —
Days: calendar/list of closed days → full day report (per-item expected/counted/variance with notes, who logged which sales, restocks, waste). Owner can void individual sale entries from here.
Insights: 7/30-day sales trends (total + per item), top sellers, shrinkage trend (cumulative unexplained variance over time — the theft-detection view), estimated days-until-stockout per item from rolling sales velocity, and a suggested reorder list. If unit costs were entered, show loss value in money (owner-only).
Exports: any day report or date range as CSV, Excel (.xlsx), or a beautifully branded PDF via the share sheet.
Settings — bar name + logo, language FR/EN, day cutoff hour, employee management (add/deactivate/reset PIN), notification preferences, variance alert threshold, biometric toggle, optional item costs entry, and "Exporter toutes les données" (full JSON backup).
5. Seed catalog
Create a migration/seed script with these categories and items exactly (client-supplied list, lightly normalized — the owner can rename/merge/add items in-app later). Also seed a demo owner + 2 demo employees + 3 days of realistic history (sales spread across items, one restock, one waste entry, two closed counts including one small variance) so demos, insights charts, and screenshots look real.
Bières & Softs (unit: bouteille unless noted; threshold 24): Spécial · Heineken · Spécial Gold · Casablanca · Budweiser · Smirnoff Ice · Red Bull (canette) · Soda (canette)
Vins Rouges (bouteille; threshold 6): Ithaque · Eclipse · Volubilia · Médaillon · Sahari · Terre Rouge · Terroir Rouge · Ferrande
Vins Blancs (bouteille; threshold 6): Odyssée · Médaillon Blanc · Terroir Blanc
Vins Rosés (bouteille; threshold 6): Médaillon Rosé · Terroir Rosé
Demi-bouteilles 37,5cl (threshold 6): 1/2 Médaillon · 1/2 Eclipse · 1/2 Volubilia · 1/2 Sahari · 1/2 Terroir Rouge · 1/2 Médaillon Blanc · 1/2 Terroir Blanc · 1/2 Médaillon Rosé · 1/2 Terroir Rosé
Champagne (bouteille; threshold 3): Champagne
Spiritueux (bouteille; allow_decimal = true; threshold 2): Black Label · Red Label · Absolut · Jack Daniel's · Belvedere · Gordon's · Ricard · Agavita · Jägermeister · Cognac · Martini Blanc
Cuisine (portion; threshold 10): Fromage · Viande Hachée · Foie · Cervelle · Pizza V/H
5.1 Imagery pipeline — HD pictures, done right
The app must look photo-rich and expensive from first launch, WITHOUT creating copyright problems for the client:
Download HD photography ONLY from libraries that are free for commercial use (Unsplash, Pexels). Fetch at build time into bundled assets: one atmospheric hero per category + a set of generic item-type photos (green beer bottle, brown beer bottle, energy drink can, soda can, red/white/rosé wine bottles, half bottle, champagne, whisky, vodka, gin, anise apéritif, herbal liqueur, cognac, vermouth, cheese board, minced-meat dish, plated liver dish, pizza). Map every seeded item to its closest generic photo.
Do NOT scrape official brand marketing shots (Heineken, Jack Daniel's, etc.) — those are copyrighted commercial assets and expose the client to risk. Generic license-free bottle photography reads just as premium.
Apply ONE unified visual treatment to every card image (consistent crop, dark gradient overlay, subtle duotone) so mixed photo sources look like a single designed system — and so the owner's own camera shots blend in seamlessly when he replaces them.
If the network is unavailable at build time, generate elegant SVG bottle/category illustrations in the app's palette as fallback so nothing ever ships empty.
Also design and generate the app's logo mark and icon (§7) — never a default Expo icon.
6. Notifications (owner only)
Low stock: when an item's expected qty crosses ≤ its threshold → immediate push (debounced: max one per item per business day) + a daily digest at the configured time (default 18:00) listing all currently-low items.
Variance alert: on closing a count, if any item's |variance| ≥ the configured threshold (default 2 units) or the day has any nonzero variance → push with a short summary ("3 écarts détectés — Heineken −4…").
Count reminder: if no count has been closed for the previous business day by the configured time (default 11:00) → gentle reminder.
Implement with a scheduled Edge Function (cron) plus trigger-driven checks; all notification copy in FR + EN.
7. Design language — this is where the money shows
Build a real visual identity, not a styled template:
Identity: design a simple, classy logo mark (monogram / abstract bottle) used on login, splash, PDF reports, and app icon. Bar name from Settings appears alongside it everywhere.
Palette: ink `#0A0A0E` background, elevated surfaces `#14141B`, hairline borders `rgba(255,255,255,0.08)`, amber→gold gradient accent (`#F5A623` family), success `#34D399`, danger `#F87171`, plus one accent per category.
Type: Space Grotesk for display/numbers + Inter for UI (via expo-google-fonts). Tabular numerals for EVERY quantity — numbers are the product.
System: 8pt spacing grid, 20px radii, glassy cards with soft depth, lucide icons, skeleton loaders, custom empty-state illustrations in-palette.
Motion & feel: reanimated springs everywhere it helps and nowhere it doesn't; haptics map (light = sale logged, success = day closed, warning = variance found); signature moments = the live dashboard pulse, the count progress ring, and a calm, confident variance-reveal on the review screen.
Performance is part of design: virtualized lists stay at 60fps with 60+ items, images cached with expo-image, zero layout shift.
Staff use this one-handed in a dark, busy bar: big touch targets (≥48dp), high contrast, forgiving hit areas. It must demo beautifully in screenshots. If a frontend-design skill is installed, use it.
8. Definition of done — self-review every line before declaring finished
`tsc --noEmit` clean · lint clean · all tests green.
Click through EVERY flow yourself on a simulator or the web target (drive it with Playwright if needed) — compiling is not done, working is done.
Every line of the client checklist (§1.1) demonstrably true.
Full happy path on seed data: employee PIN login → logs sales (incl. via favorites and search) → owner logs in (biometric or password) → restock → waste entry → runs and closes a count with a note → variance report → Insights render with real charts → exports CSV + XLSX + branded PDF.
RLS proven by tests: an employee session cannot update, delete, or void anything, cannot insert as another user, cannot read costs/waste/audit.
Offline: sales logged in airplane mode sync correctly on reconnect, no duplicates.
Barcode scanning works on device and degrades gracefully where no camera exists (web demo).
Every string in FR + EN, French default; no hardcoded copy anywhere.
Every screen has loading / empty / error states; zero console errors or warnings on the happy path; lists smooth with the full 50+ item catalog.
Docs written: `README.md` (run it in 5 minutes), `SETUP.md` (§10), `SUBMIT.md` (store checklist), `HANDOVER.md` (owner's guide, French first, with screenshots, PLUS a "Phase 2 ideas" roadmap section — see §11), `DECISIONS.md` (every judgment call you made).
9. Milestones — commit + verify after each
M1 — Demo & screenshots (do this FIRST and fast): complete UI for all screens running on seeded local demo data (backend mocked behind the data layer is fine at this stage), full design language from §7, imagery pipeline from §5.1, French strings. Then run the app (Expo web target is acceptable for capture) and save 10–12 polished screenshots to `./screenshots/`: login, employee log-sale flow, owner dashboard, inventory, count walkthrough, variance review, insights, day report, exports, settings. ALSO generate `./client-preview.pdf` — a one-page, branded, French preview sheet embedding the 6 best screenshots, suitable to send straight to the client. These go out the same day.
M1.5 — Same-day installable demo, no stores: immediately after M1, produce builds the bar can install TODAY by link:
Build with `EXPO_PUBLIC_DEMO_MODE=true` so the app runs fully standalone on bundled seed data — zero backend, zero credentials required.
Android: `eas build -p android --profile preview` → direct-install APK with a shareable link/QR (recipient just allows "install from browser" when prompted — normal for link-delivered apps).
Web: export the web build and deploy to a public URL (EAS Hosting / Vercel / Netlify) with a PWA manifest + icons so iPhone users can "Add to Home Screen" and get an app-like, full-screen, icon-on-homescreen experience today.
Write `DEMO.md` in FR + EN with copy-paste install instructions for the owner and staff: Android (tap link → allow → install), iPhone today (link → Partager → "Sur l'écran d'accueil"), and the exact steps for real iOS builds once an Apple Developer account exists (`eas device:create` device-registration link → ad hoc build installs over the air; or TestFlight).
End the run by printing all shareable links/QR codes clearly.
M2 — Real backend: Supabase migrations, RLS + tests, auth including employee PIN provisioning and owner biometrics, storage, Realtime wiring, notification tokens; wire the entire app end-to-end and put the mock layer behind a single switch (`EXPO_PUBLIC_DEMO_MODE`).
M3 — The hard parts: daily count flow, variance engine (SQL + TS, shared test cases), waste tracking, reports + insights (trends, top sellers, shrinkage, days-to-stockout, reorder suggestions), CSV/XLSX/PDF exports, barcode scanning, offline queue, audit log, push notifications with the scheduled function.
M4 — Store-ready: finalize the §7 logo/app icon (generate real assets — never a placeholder), splash, adaptive icons, FR+EN store listing copy drafts, a `PRIVACY.md` privacy policy (plus instructions for hosting it at a public URL, e.g. GitHub Pages), finalized `app.json` + `eas.json`, and `SUBMIT.md` with exact step-by-step instructions for: TestFlight internal testing, Google Play internal testing, and full production submission on both stores.
10. Credentials & environment
Never invent real secrets. Use `.env` with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, etc.; commit only `.env.example`.
If real credentials ARE present in `.env`: link the project, push migrations, run the seed, deploy Edge Functions, and verify the app live against them.
The M1.5 demo builds must require NO credentials at all — `EXPO_PUBLIC_DEMO_MODE=true` runs entirely on bundled seed data, so there is always something installable to show.
If NOT: everything must still run fully in demo mode, and `SETUP.md` must contain the exact commands (`supabase link`, `supabase db push`, storage bucket creation, function deploy + cron schedule, EAS login/configure/build) so a human can go live in under 30 minutes.
11. Out of scope — do NOT build
Money/pricing/POS features beyond the optional owner-only unit costs, tabs or billing, multi-bar/multi-tenant administration, a web dashboard, analytics beyond the Insights specified, Arabic/RTL (structure i18n for it, don't build it). Depth over breadth: this feature set, completely finished.
Instead, write a "Phase 2 ideas" section in `HANDOVER.md` the developer can sell later: AI shelf-count via camera, multi-bar support, supplier order sending, Arabic UI, web owner dashboard.
12. Begin
Restate this brief back in your own words in `PLAN.md` (so any drift from the spec is caught immediately), produce the milestone checklist, then execute M1 → M4 without waiting for approval between milestones. Finish with the full §8 self-review — including §1.1 line by line — fix anything that fails it, and end with a summary of what was built, where the screenshots and `client-preview.pdf` are, and exactly what human steps remain (accounts, credentials, store submission).