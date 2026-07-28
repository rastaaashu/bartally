# ENGINEERING-GRADE DIRECTIVE — v3

**Status of prior documents:** the token system (§A) and ban list of DESIGN-RESCUE.md remain LAW. Its §B (ItemGlyph drawn silhouettes) and its all-at-once process are REVOKED — they produced amateur output. This document replaces them. Business logic, database, and flows are untouched: this is a visual refactor executed with an engineering process.

**Why the last pass failed (understand this before coding):** (1) model-drawn vector illustrations — bottles, plates — always look childish; (2) box-heavy layouts read as templates. Million-dollar engineering products (Linear, Stripe, Mercury) contain ZERO illustration. Their entire aesthetic is typography, tabular numerals, hairlines, whitespace, and one rationed accent. That is now this product's aesthetic, permanently.

---

## 1. The Reference Law

`reference/reference.html` is ground truth. Before writing any code: open it in a browser AND read its source. Its CSS tokens ARE `tokens.ts`. Its three screens define the exact look of Dashboard, Log Sale (+ sale sheet), and Count Review. Extract precise values from it — spacing, sizes, weights, letter-spacing, colors, component anatomy. **Whenever any prose instruction conflicts with the reference, the reference wins.** Every other screen in the app must look like a fourth frame of that same file.

## 2. Absolute prohibition on drawn art

You may not author freeform SVG paths, curves, illustrations, mascots, or scenes — no bottles, no glasses, no plates, ever. The complete permitted visual vocabulary:

1. Typography (Space Grotesk + Inter, per tokens)
2. Hairlines, rectangles, lines, circles, dots
3. The tally logo mark — exactly as constructed in reference.html (4 upright strokes + 1 brass diagonal), never redrawn freehand
4. Lucide icons, unmodified, only where words genuinely can't do the job (scan, camera, share, chevron)
5. Catalog photography generated per PHOTO-SPEC.md, plus owner camera photos — both inside the standard tile treatment

Nothing else exists. If you feel the urge to illustrate something, the answer is a monogram tile. Delete the entire ItemGlyph silhouette system and every drawn asset from the repo now.

## 3. Monogram tile system — the only item visual

Match the anatomy in reference.html exactly:

- Square tile: `surface` background, 1px `hairline` border, radius 12.
- Category tick: 3×14px, radius 2, top-left at 8,8, in the category accent.
- Monogram: Space Grotesk 700, letter-spacing +6%, colored in the category accent (this is the identity system — HEI, CAS, SPÉ, MÉD, VOL, ODY, CHM, J.D, B.L, R.B, PIZ…).
- Optional quantity: bottom-right, Space Grotesk 600 11px, `textFaint`, tabular.
- Sizes: 64 (dashboard/pinned), 56 (rows), 40 (sheets), grid tiles fill their cell at aspect 1:1 with 17px monograms.
- Monogram derivation: 2–4 significant characters; dot style for two-word brands (J.D, B.L, R.L, S.I); demi-bouteilles get a small "½" prefix above the monogram; accents kept (MÉD, SPÉ). Generate once, store on the item, never improvise per-screen.
- Photos (from PHOTO-SPEC.md generation or the owner's camera) are the PRIMARY tile visual: cover-cropped inside the same tile, bottom scrim `rgba(10,11,15,0) → rgba(10,11,15,.85)`, same hairline, category tick kept. The monogram tile is the automatic fallback wherever an image is missing — never a blank tile.

## 4. De-boxing rules

- Maximum ONE level of containment. No cards inside cards.
- Stats are COLUMNS separated by hairline dividers (see reference frames 1 and 3) — never boxed widgets.
- Feeds and tables are ROWS with 1px bottom hairlines — never stacked cards.
- Structure comes from SectionLabels (11px, 600, caps, +7% tracking, `textFaint`) and whitespace, not from containers.
- Radius: 10 controls, 12 tiles, 22 sheets. Nothing else. No shadows anywhere except one soft ambient under sheets/modals.
- Density benchmark: a Linear settings page. If a screen has more boxes than a Linear settings page, remove boxes.

## 5. Typographic-first interface

Words over icons. Tab bar is text-only (see reference). Buttons are text-only. Every number in the app is Space Grotesk 600 tabular — a single Inter digit displaying a quantity is a defect. Variance always carries an explicit sign: −4, +1, ±0. Copy: sentence case, plain verbs, no exclamation marks, no greetings, zero emoji anywhere including notifications and PDFs.

## 6. Build protocol — one screen at a time, human gates

**P0 — Purge & foundations.** Delete every photo asset and every drawn SVG. Implement `tokens.ts` copied from reference.html's `:root`. Load fonts on native AND web; prove it with a screenshot of Space Grotesk tabular numerals rendering in the web build. Fix before proceeding — system-font fallback alone recreates the amateur look.

**P1 — Dashboard only.** Rebuild it to pixel-match reference frame 01. Screenshot it. Open your own screenshot and run the §7 rubric on it. Iterate until every check passes. Then STOP and present the screenshot to the developer for approval. Do not touch another screen until approved.

**P2 — Log Sale + sale sheet.** Match frame 02. Same loop: build → screenshot → self-critique → fix → present → gate.

**P3 — Count review.** Match frame 03. Same loop and gate.

**P4 — Everything else.** All remaining screens (login, inventory, count walkthrough, reports, insights, settings) are composed strictly from the patterns established in P1–P3 — no new visual decisions. Then: full-app screenshot pass with the rubric, regenerate the 10–12 final screenshots, rebuild `client-preview.pdf` in the new identity (white background print version: same type system, hairline tables, tally mark header), and rebuild the demo APK + web deploy so what is installed matches what is shown.

## 7. Self-critique rubric — run on every screenshot before showing anyone

Look at the image and answer honestly:

1. Are the fonts ACTUALLY loaded — Space Grotesk numerals, tabular alignment?
2. Any freeform drawn art anywhere?  → must be NO
3. Any emoji anywhere?  → must be NO
4. Any shadow outside a sheet/modal?  → must be NO
5. Any color not in tokens.ts?  → must be NO
6. All spacing on the 4pt grid, 20px gutters?
7. More than one level of nested containers?  → must be NO
8. Brass in more than 3 places on screen?  → must be NO
9. Every monogram tile identical in anatomy to the reference?
10. Left edges aligned to one grid line?
11. Would this screen need an excuse in a Linear design review?  → must be NO

Any failure → fix and re-shoot. A screen that fails the rubric is never presented, committed, or shipped.

## 8. Skills

If a frontend-design skill is installed in this environment, invoke it during P1–P3. Record every visual judgment call in `DECISIONS.md`.

Begin with P0 now.
