# P4 screen contract — compose from established patterns ONLY

You are recomposing ONE screen module of BarTally to the ENGINEERING-GRADE
directive. No new visual decisions: every pattern you need already exists.

## Read in this order (mandatory)
1. `New folder/bar-app-engineering-grade.md` — the law (§2 no drawn art, §4 de-boxing, §5 typographic-first, §7 rubric).
2. `New folder/reference.html` — ground truth tokens + three frames.
3. `src/01-tokens.css` + `src/02-components.css` — the implemented tokens/kit. USE THESE CLASSES.
4. `src/22-screen-dashboard.js`, `src/21-screen-sell.js`, `src/24-screen-count.js` — CANON examples of every pattern (topbar/back, h1, micro SectionLabels, .stats/.sum columns, .tilerow/.tile+UI.art, .igrid/.icard, .feed rows, .thead/.trow tables, .grouprow, .bottomstack, sheets, numpad, toasts).
5. YOUR assigned file — keep 100% of its logic (Store calls, i18n keys, guards, params, sheets' behavior); replace its look.

## Hard rules
- Vanilla JS, IIFE, one file, `node --check` before returning. No literal closing-script tag.
- NO boxes: sections = `.sec` micro labels + hairline groups (`.card` class now renders as hairline block — fine to keep). Stats/summaries = `.stats`/`.sum` columns. Lists = `.row` / `.trow` with hairlines. Max ONE containment level.
- NO drawn SVG art of any kind. Item visuals = `UI.art(item)` inside `.tile tXX` / `.icard__art` / `.row__art` (monogram system handles everything). No emoji. No shadows.
- Text over icons: buttons are text-only; back links are `‹ Retour`-style `.back` buttons; tab bar is global (don't render one). Icons allowed ONLY: scan, camera, search, chevrons, x, check (via UI.icon).
- Every quantity: `.tnum`/`.num` (Space Grotesk tabular). Variance always signed (−4 / +1 / ±0). Sentence case, no exclamation marks, no greetings.
- Screen skeleton: `topbar` (back or logo left, `.micro` context right) → `.h1` → content → `.bottomstack` for primary actions. Pushed screens (yours) have NO tab bar and MUST have a back button: navigate to `params.from || 'dashboard'` (keep existing from-param logic where present).
- Brass ≤ 3 places per screen (primary button + one accent max — category colors don't count).
- All strings via t()/I18N.extend (fr+en), keep existing keys working; reference French tone: "Vente", "Écarts", "Comptage", plain sentence case.
- `UI.esc()` every dynamic string. Owner guards stay exactly as they are.
- Screen-scoped CSS via one `<style>` appended to head, everything under `[data-screen=YOURID]`, values on the 4pt grid, radius only 10/12/22.

## Final check
Run the §7 rubric mentally against your markup; then `node --check src/<file>`. Reply one line per change group.
