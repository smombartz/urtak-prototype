# Urtak Revival — reference

Architecture, integrations, and decisions worth remembering.

## Source design: `1201-MagicWidgets.psd`

- 1200×400 canvas with two widgets: **Widget Norrow 300** (x 100–400, y 39–331) and **Widget Wide 500**
  (x 600–1100). The 39 Layer Comps store layer visibility only.
- The narrow widget is complete in every comp. The wide one is unfinished in most comps (empty card
  areas), so the prototype is built from the narrow one.
- "Happy Ending Refresh" differs only in the wide widget (a "3 New Questions! Click to Load" bar).
- "Third Q Count A–H" are progress-counter options: A grey bar, B thin bar, C "3/12", D "3 of 12",
  E "9 left", F "9 questions", G dotted strip, H tick strip.

## Comp images (`design/comps/`)

- One PNG per Layer Comp, cropped to 310×310 from canvas x 95, y 25 (narrow widget plus margin).
  Exported from Photoshop by script (apply comp → Save for Web PNG, close without saving), cropped
  with ImageMagick. Reference only: the prototype doesn't use them, except the shell's "Compare with
  comp" view, which crops them to the same 300×292 frame (`object-position: -5px -14px`).
- A 2x export failed: Photoshop's scratch disk was full (about 10 GB free at the time).

## Widget prototype in code (`prototype/`)

Static, no build step: open `prototype/index.html` directly or serve the folder. Fonts load from
Google Fonts (Droid Sans is still served there); everything else is local.

- `tokens.css`: primitive tokens (palette, type, space, radius, opacity, motion) and semantic
  `--urtak-*` tokens. `widget.css` only reads `--urtak-*` tokens and a few scale tokens (font, line,
  radius, duration); the only literal colours left there are mask alphas.
- Themes override tokens only: `data-urtak-theme="blue" | "orange" | "wood" | "sponsored"`. Wood and
  sponsored stand in for photos with gradients; a real sponsor image would go in `--urtak-stream-bg`.
- `widget.js`: `Urtak.render(root, view)` draws a whole state from a view object (`stream` of cards,
  `tab`, `drawer`, `overlay`, `loading`, `theme`, `counter`, `scroll`). Card item types: `question`,
  `ask`, `result` (pie / numbers / pending), `notice` (positive, warning, neutral, pending; pointer up
  or down), `prompt`. Interactive elements carry `data-action` + `data-value`.
- `app.js`: `STATES` (one per comp), `ACTIONS`, history. Drawer and overlay states are layers drawn
  over the last card state (`base`); an overlay opened from the open drawer keeps the drawer under it.
  Reader input carries through: answers show in result cards, the typed question shows in the
  submitted/pending card, the tweet counter counts down.
- `index.html` holds the icon sprite: the PSD's vector shapes converted to SVG paths with psd-tools
  (`fill-rule: evenodd` where the shape subtracts), plus a hand-drawn hourglass.
- Pies are two masked circles: the majority colour fills the circle and the minority slice
  (`conic-gradient` mask, counter-clockwise from 12 o'clock) is nudged 2px left, as in the comps.
- Real scrolling: the wheel moves the stream; up/down hints and the scrollbar follow.

### How values were taken from the PSD

- psd-tools on the main document and every embedded smart object (the cards are smart objects).
- Text layers → font, size, leading, colour. Shapes → fill, stroke, gradients, effects.
- Photoshop gradient angle → CSS: `90° − angle` (PS 90° = `to top`). PS drop shadow "size" is used
  as the CSS blur; 120° at 1px ≈ `0 1px`.
- Layout comes from layer bounds: the widget content box starts at canvas (100, 40); smart object
  bounds include their shadow (≈5px), so card = bounds + 5px.

### Known gaps

- The comps were checked against the code by reading values, not pixel diffing; small offsets
  (1–3px) are likely, especially in Happy Ending (its ask card sits 8px higher in the PSD).
- The Twitter button glyph in the forms was a PDF smart object; the "t" from the result-card icon is
  used instead.
- The wide 500px widget isn't built.
