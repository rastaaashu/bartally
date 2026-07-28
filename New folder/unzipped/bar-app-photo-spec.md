# PHOTO-SPEC — Uniform Luxury Catalog Photography

**Status:** this supersedes the photo prohibition in ENGINEERING-GRADE.md (§2 item 5 and §3 last bullet). Generated catalog photography per this spec is now the PRIMARY item visual across the app. Monogram tiles remain only as the automatic fallback for any item whose image is missing. Everything else in ENGINEERING-GRADE.md (tokens, layout, de-boxing, gates, rubric) remains law.

**The uniformity principle:** every image is produced from ONE master style recipe — same virtual studio, same backdrop, same light, same camera, same framing — with only the subject changing. Uniformity comes from the locked recipe, never from luck.

---

## 1. Non-negotiable generation rules

1. **NO text, NO logos, NO brand labels in any image.** Generated label text comes out mangled and instantly destroys the luxury feel, and real brand marks create legal risk for the client. Label areas are plain, dark, unbranded. The item's name is displayed by the UI beneath the tile — that is how identification works.
2. One subject per image. Never two bottles, never a spread, never hands, never people.
3. Bottles: full bottle visible, standing upright, cap/cork intact, sharp.
4. Food: directly overhead top-down, one dish, dark ceramic plate, elegant minimal garnish.
5. Square 1:1, 1024×1024 minimum (2048 if the provider supports it).
6. All ~38 images generated with the SAME provider and model in one batch session. Never mix providers within the catalog.

## 2. Master style recipe

**BASE (append verbatim to every prompt):**
"Professional luxury product photograph, high-end commercial catalog style. Single subject, centered, occupying about 70% of frame height. Seamless matte charcoal-black studio backdrop, subtle darker vignette at edges. Soft diffused key light from the upper left, gentle warm golden rim light from behind right, soft natural reflection on the dark polished surface below. 85mm lens look, f/8, tack sharp. Moody, warm, premium after-hours bar ambiance, colors graded toward deep charcoal and amber. Square 1:1 composition. No text, no letters, no logos, no labels with writing, no watermark, no people, no hands, no extra props, no clutter."

**BOTTLE add-on:** "A single [SUBJECT] standing upright, label area plain dark and completely unbranded, cap intact, glass catching the rim light."

**CAN add-on:** "A single [SUBJECT], brushed matte metal, completely unbranded, standing upright."

**FOOD add-on:** "Directly overhead top-down shot of [SUBJECT] on a dark ceramic plate set on black slate, restaurant fine-dining plating, minimal fresh garnish, subtle steam."

## 3. Per-item subject list — generate exactly these

Filenames: `assets/items/<slug>.png`. Half-bottles (demi) are NOT generated — they reuse the parent wine's image and the UI overlays a small "½" chip (Space Grotesk 600) top-right of the tile.

**Bières & Softs**
- special — amber golden lager in a green glass longneck bottle
- special-gold — golden strong lager in an amber-gold tinted longneck bottle
- heineken — pale lager in an emerald green longneck bottle
- casablanca — amber lager in a brown glass longneck bottle
- budweiser — light lager in a brown longneck bottle with a subtle red-brown tone
- smirnoff-ice — citrus alcopop in a clear glass bottle, pale frosted liquid
- red-bull — slim tall energy drink can, cool silver-blue metal
- soda — classic soda can, dark matte metal

**Vins Rouges** (all: "dark green bordeaux-shape wine bottle of deep red wine, plain dark unbranded label area" — identical by design; the name below the tile differentiates)
- ithaque · eclipse · volubilia · medaillon · sahari · terre-rouge · terroir-rouge · ferrande

**Vins Blancs** ("pale green bordeaux-shape bottle of golden white wine, plain dark unbranded label area")
- odyssee · medaillon-blanc · terroir-blanc

**Vins Rosés** ("clear glass bottle of pale pink rosé wine, plain dark unbranded label area")
- medaillon-rose · terroir-rose

**Champagne**
- champagne — champagne bottle in dark green glass with gold foil neck, unbranded

**Spiritueux**
- black-label — square-shouldered blended scotch whisky bottle, deep amber liquid, black cap
- red-label — square-shouldered blended scotch whisky bottle, amber liquid, dark red cap
- absolut — clear cylindrical premium vodka bottle, silver cap
- jack-daniels — square dark glass Tennessee-style whiskey bottle, black cap
- belvedere — tall frosted-white premium vodka bottle
- gordons — green glass London dry gin bottle
- ricard — tall bottle of golden-yellow anise pastis
- agavita — clear tequila-style bottle, pale gold liquid, silver cap
- jagermeister — squat dark green herbal liqueur bottle
- cognac — elegant curved cognac bottle, deep amber liquid, wood-tone cap
- martini-blanc — tall vermouth bottle, pale golden liquid

**Cuisine** (FOOD add-on)
- fromage — artisan cheese selection with figs and walnuts on a dark slate board
- viande-hachee — grilled kefta minced-meat patties with charred tomato and herbs
- foie — pan-seared liver with caramelized onions and parsley
- cervelle — traditional cervelle m'chermla simmered in spiced tomato sauce in a dark tagine dish, cilantro garnish
- pizza — rustic wood-fired pizza, whole, bubbling cheese and fresh basil

## 4. Production pipeline (Claude Code builds and runs this)

1. `scripts/generate-images.mjs` — reads the list above, composes BASE + add-on + subject, calls the image API selected by `IMAGE_PROVIDER` env (`gemini` with its current image model, or `openai` with its current image model — check the provider docs for the exact model string), 1024×1024+, saves PNG per slug, retries on failure, respects rate limits. Key comes from `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env` — never hardcoded.
2. `scripts/post-process.mjs` (sharp) — normalize every image identically: center 1:1 crop, blacks matched toward #0A0B0F, saturation −8, identical subtle vignette, export `1024.webp` + `512.webp`.
3. `scripts/contact-sheet.mjs` — generate `contact-sheet.html`: every image in a grid at tile size with its name, on the app background.
4. **Uniformity QA (mandatory):** screenshot the contact sheet and inspect it yourself. Reject and regenerate any image that breaks the set: different backdrop tone, light not from upper-left, subject scale off ~70%, any visible text or mangled label, tilted subject, bright background. Max 3 regeneration passes per item; if an item still fails, it ships with the monogram fallback rather than a bad photo — one bad photo hurts more than one missing photo.
5. Wire into the app: photo fills the tile (cover), bottom scrim `rgba(10,11,15,0) → rgba(10,11,15,.85)`, 1px hairline border, 3px category tick top-left, item name below the tile as before. Demi items reuse parent image + "½" chip. Update seed `photo_url`s, regenerate screenshots + `client-preview.pdf` + demo APK + web deploy.

**No API key available?** The spec still works manually: paste BASE + add-on + subject into any image generator (Gemini, ChatGPT, Midjourney…), one item at a time, in ONE sitting with the SAME tool, save under the exact slugs, then run steps 2–5. The recipe, not the tool, is what makes the set uniform.

## 5. Owner photos later

The in-app camera capture remains: an owner's real photo replaces the generated one inside the identical tile treatment. Add a capture overlay guide (center the bottle, dark background hint) so even his snapshots join the family.
