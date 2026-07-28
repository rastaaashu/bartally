# DECISIONS — every judgment call, and why

1. **Webapp-first, native later.** User instruction (2026-07-28): client needs
   the full live product today; native app follows after approval. The brief's
   Expo stack needs EAS + Apple/Play accounts that don't exist yet. The webapp
   implements 100% of the product logic and design language; the native phase
   reuses the same data model and screens spec.
2. **GitHub Pages as live host.** Only authenticated deploy target available
   (gh CLI logged in as `rastaaashu`, repo scope). Public repo — the app itself
   contains no client data; all data lives on-device. Custom domain can be
   added later in repo settings.
3. **No Supabase yet → local-first data.** No supabase CLI/account present and
   account creation is an interactive browser flow only the user can do.
   Data: localStorage per device, versioned, with one-tap full JSON
   backup/restore for moving between phones. Live multi-device sync +
   server-enforced RLS + real push land in Phase 2 (SETUP steps in
   NEXT-STEPS.md). The client can run the bar TODAY on the owner's phone.
4. **Role security is client-side today.** Without a server there is no true
   RLS. Employees get no edit/delete UI, the data layer is append-only with
   soft voids + audit log, and owner areas sit behind a hashed PIN
   (SHA-256 + salt via WebCrypto). Honest limitation, fixed by Phase 2
   Supabase. Stated plainly in NEXT-STEPS.md.
5. **[Superseded by v2, user request 2026-07-28] Imagery now: REAL product
   photography** curated from licensed sources only — Open Food Facts
   (CC-BY-SA), Wikimedia Commons, Openverse commercial-license search — 26
   items covered, every image hand-reviewed, per-image credits in
   PHOTO-CREDITS.md. Items with no acceptable licensed photo (hyper-local
   Moroccan wines, demi-bouteilles) keep the crafted vector art; the owner
   can replace any visual with an in-app camera photo. Brand marketing
   packshots from brand sites remain off-limits (copyright). Visual identity
   also rebuilt at user's request: bottle-glass green + brass + cream photo
   tiles, Fraunces/Instrument Sans — replacing the ink+gold+glass look.
   Original v1 decision: crafted vector product art + photographic atmosphere, one
   treatment.** Programmatic stock-photo scraping (Openverse/Commons) yields
   inconsistent quality that reads cheap, and official brand shots are
   copyrighted. Instead: hand-built glass-and-gradient bottle/dish art per
   item type in the app palette (consistent, crisp, zero legal risk), category
   heroes with atmospheric treatment, and the owner can photograph any item
   in-app (camera/gallery → compressed, stored locally) — photos drop into the
   same dark-gradient card treatment. This matches §5.1's sanctioned fallback
   and looks MORE designed than mixed stock photos.
6. **Exports: CSV (Excel-ready) + branded print/PDF + full JSON. No .xlsx.**
   SheetJS is ~1 MB minified — unacceptable in a single-file app. CSV ships
   with `sep=;` + BOM so French Excel opens it perfectly. Branded PDF via a
   print-styled report (browser "Save as PDF"). XLSX returns in the native
   phase.
7. **Notifications: in-app alert center + Web Notifications when granted.**
   True push-when-closed needs a backend (Phase 2). Low-stock and variance
   alerts fire in-app instantly and via the Notifications API where available.
8. **Barcode scanning: BarcodeDetector API + camera** (Android Chrome ≈ the
   bar's likely hardware), manual code entry fallback everywhere else,
   feature-detected so nothing breaks on iOS Safari.
9. **Biometrics: not in webapp.** Web has no Face ID unlock equivalent worth
   shipping; owner PIN covers it. Returns with expo-local-authentication in
   the native phase.
10. **Employee PINs optional by default.** Brief wants PIN login for staff;
    Simplicity Law wins at the bar: default is a fast user-picker; owner can
    require per-employee PINs with one toggle in Settings (PINs hashed).
11. **Catalog seeded exactly from client's list** (§5 = user's mid-run
    message), including Moroccan wines. Spelling normalized ("Jack Daniel's",
    "Jägermeister", "Cognac", "Belvedere"). Owner can rename/add/merge in-app.
12. **Currency label default "MAD"** (client in Morocco), configurable; used
    only for optional owner-only cost/loss values. No pricing/POS features
    (§11 out of scope).
13. **Adversarial QA round (5 reviewer agents, 26 findings, all 4 high + 11 med
    + 11 low fixed).** Notables: per-line count timestamps so sales logged
    mid-count are never swallowed (engine-tested); owner-only guards added to
    setOwnerPin/setSettings/importJSON/resetAll/setCountNote; sheet history
    handling no longer closes stacked sheets (barcode→sale flow); forgot-PIN
    wipe now gated behind backup download + typing the bar name; FR plural
    rules (0/1,5 → singular); wizard-skipped items auto-deactivate instead of
    flooding low-stock; service worker is network-first for the shell so
    deploys reach phones on next open; CSV formula-injection + photo/tint
    sanitization hardened.
14. **Demo data is opt-in at first run** ("Explorer avec des données de
    démonstration"), so the client's real install starts clean via the
    opening-stock wizard, while demos/screenshots stay rich. Demo mode is
    clearable in one tap from Settings.
