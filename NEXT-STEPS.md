# NEXT-STEPS — what YOU need to provide, and what happens then

## Nothing needed for today
The webapp is live on GitHub Pages and fully usable. Data lives on each
phone (with one-tap JSON backup/restore in Réglages → Données). Send the
client the message in `CLIENT-MESSAGE.md`.

## Honest limitations of the web version (fixed by Phase 2)
- Each phone has its OWN data — a sale logged on the barman's phone does not
  appear on the owner's phone. Fine for a single-owner-phone workflow or the
  demo; the shared live system needs the backend below.
- Employee restrictions are enforced in the app, not by a server.
- Push notifications only fire while the app is open.

## Phase 2 — shared backend + live sync (≈30 min once you have the account)
1. Create a free account at https://supabase.com (sign in with your GitHub).
2. Create a project, then tell Claude Code: "Wire BarTally to my Supabase —
   here are the URL and anon key from Project Settings → API."
   Claude Code then: writes the migrations (schema is already designed in
   requirements.md §3), enables RLS so employee restrictions are enforced
   server-side, and switches the app's data layer from localStorage to
   Supabase with realtime sync. Same app, now multi-device.

## Phase 3 — native apps (after client approval / first 50%)
Accounts you must create (Claude Code cannot do these for you):
1. **Expo/EAS** (free): https://expo.dev → then run `npm i -g eas-cli && eas login`
   in a terminal. → Claude Code builds the Expo app reusing this design +
   data model, and produces a direct-install **Android APK link** (no store
   needed — owner taps link, allows install, done).
2. **Apple Developer** ($99/yr, enrollment can take 1–2 days):
   https://developer.apple.com → TestFlight/ad-hoc installs for iPhones,
   then App Store submission.
3. **Google Play Console** ($25 one-time): https://play.google.com/console
   → internal testing immediately; note: NEW personal accounts must run a
   14-day/12-tester closed test before public production listing — the APK
   direct-install link sidesteps this entirely for the bar's own phones.

## Repo
- Source: https://github.com/rastaaashu/kalinka (public; app contains no
  client data — all data stays on-device)
- Live site: https://rastaaashu.github.io/kalinka/
- Custom domain (optional, looks even more pro): buy a domain, point it in
  repo Settings → Pages → Custom domain.
