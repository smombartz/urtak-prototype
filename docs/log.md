# Change log

## 2026-10-27 - README: what Urtak was and how it worked

**Session:** `f51df3f7-78eb-4a00-888f-50845a3e25cd`

**What Changed:**
- Replaced the placeholder README with: Urtak's history and final numbers, how it worked for readers (card stream, Yes/No/Don't Care, result on the same card, ask your own) and publishers (setup, embedding, moderation, cross-tab analysis), question ordering, a map of this repo, and a sources list

**Why:**
- Collect what was learned from the researched links and the owner's description in one place

**Files Modified:**
- `README.md`

---

## 2026-10-27 - Scroll arrows hidden for now

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- The more-above / more-below arrow circles are hidden with a single `.u-hint { display: none; }` rule. Markup, positions and tokens are untouched, so deleting the rule brings them back

**Why:**
- Requested: hide the arrows for the time being

**Files Modified:**
- `prototype/widget.css`

---

## 2026-10-27 - Info tab stays after closing; softer answer crossfade

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- Live widget: closing the open info drawer no longer makes the "i" tab vanish. `setDrawer()` moved the new tab element out of the freshly built drawer markup during the slide-down, then copied that markup (now without the tab) into the drawer once the slide finished. It now clones the element instead of moving it
- Answer → result crossfade has room in the middle: the buttons and flag fade out on an early curve (`--urtak-live-crossfade-out`), and the answer word, pie and share row fade in 150ms later (`--urtak-live-crossfade-gap`) on a late curve (`--urtak-live-crossfade-in`). Both faces now pass through a pale, mostly white stage. Total length is unchanged

**Why:**
- Bug report: the info tab disappeared after closing the drawer
- Feedback: the crossfade should pass through a more translucent white version of each face

**Files Modified:**
- `widget/live.js`, `widget/live.css`, `prototype/tokens.css`
- `docs/reference.md`

---

## 2026-10-27 - Scroll arrow offset tweak

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- Arrow position inside the scroll-hint circles is nudged 2.7px toward each edge, mirrored: the up arrow uses `size * (0.45 + shift) - 6px`, the down arrow `size * (0.55 - shift) - 6px` (both were 0.5)

**Why:**
- Requested fine-tune of the arrow placement

**Files Modified:**
- `prototype/widget.css`

---

## 2026-10-27 - Scroll arrows tucked into the edges; white loading screen

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- The more-above / more-below circles are now 40% hidden past their edge (top for up, bottom for down), set by `--urtak-scroll-hint-hidden: 0.4`. Before, they sat fully inside the widget
- Each arrow is moved 20% of the circle away from that edge (`--urtak-scroll-hint-arrow-shift: 0.2`), so it is off the circle's centre and lands in the middle of the visible part
- The down circle is now positioned from the bottom edge instead of a fixed `top: 245px`
- Loading screen background is white (`--urtak-loading-bg`: `--gray-60` → `--gray-0`)

**Why:**
- Feedback: arrows closer to the edges, loading screen without the grey

**Files Modified:**
- `prototype/tokens.css`, `prototype/widget.css`

---

## 2026-10-27 - Scroll arrows in front of the cards

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- The more-above / more-below arrow circles (`.u-hint`) now sit above the card stream (`--u-z-hint` 0 → 2) instead of behind it, and are `pointer-events: none` so clicks still reach the cards underneath
- The Urtak logo, which shared `--u-z-hint`, keeps its place behind the stream via a new `--u-z-logo: 0`

**Why:**
- Feedback: the arrows should show in front of all the cards, not behind

**Files Modified:**
- `prototype/widget.css`

---

## 2026-10-27 - Rounded cards and buttons; pie corners reverted

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- Reverted the rounded pie-wedge corners from the previous entry (`--urtak-pie-corner` removed); wedges are back to the plain path with a round stroke join
- Cards, notice bars and the "Ask your own" prompt bar get a 4px radius (new `--radius-4`, `--urtak-card-radius`)
- Buttons go from 1px to 3px (`--urtak-button-radius`), now shared by the answer buttons, the drawer form buttons and the lightbox Go button

**Why:**
- Feedback: the rounding was meant for the buttons and cards, not the pie

**Files Modified:**
- `prototype/widget.js`, `prototype/widget.css`, `prototype/tokens.css`
- `docs/reference.md`

---

## 2026-10-27 - Rounder pie corners; centred plus

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- Pie wedges now have properly rounded corners: the tip and both rim corners are cut back by `--urtak-pie-corner` (1.5px) and joined with a curve, instead of relying on the stroke's round join (about 0.5px). Narrow slivers round less so they keep their shape
- The "+" in the green circle (prompt bar and notices) is drawn as two 8×2px CSS bars centred on the 16px circle, as in the comps, instead of a "+" text glyph that sat off-centre. New tokens `--urtak-plus-size`, `--urtak-plus-bar`, `--urtak-plus-stroke`; the span is now empty and `aria-hidden`

**Why:**
- Feedback: corners slightly more rounded; the plus wasn't centred in its circle

**Files Modified:**
- `prototype/widget.js`, `prototype/widget.css`, `prototype/tokens.css`
- `docs/reference.md`

---

## 2026-10-27 - Even pie gaps and full wedge outlines

**Session:** `10448441-16fc-4778-a4e8-d0af9ca6a524`

**What Changed:**
- Pies are now inline SVG paths instead of two `conic-gradient`-masked circles. Each colour is its own wedge, pulled back from the divider by half the gap so the white gap is the same 2px along both edges at every share
- Each wedge has its 1px dark outline on every side. The straight edges were unoutlined before because the mask cut the inset box-shadow off
- A non-zero share is drawn at least 10° wide so a 1% sliver doesn't disappear into the gap
- Tokens: `--urtak-pie-yes` / `--urtak-pie-no` gradients become `-top` / `-bottom` stop colours; `--urtak-pie-explode` is replaced by `--urtak-pie-gap`, `--urtak-pie-stroke-width` and `--urtak-pie-min-angle`
- Live widget: `--u-slice` still animates in CSS, and the new `followPie()` redraws the paths each frame from the animated value (`drawPie` is exported from `widget.js`)

**Why:**
- Feedback: the gap between Yes and No was uneven (the 2px horizontal nudge only opened a gap on edges near vertical), and the dark border was missing on the straight edges between the slices

**Files Modified:**
- `prototype/widget.js`, `prototype/widget.css`, `prototype/tokens.css`
- `widget/live.js`, `widget/live.css`
- `docs/reference.md`

---

## 2026-10-27 - Pie details only after the slide; thinner scrollbar

**Session:** `9c0aca76-365b-4c8b-bbaa-c43cdcd33a08`

**What Changed:**
- Live widget: the vote details (Yes/No/Votes/Care) shown on pie hover stay hidden while cards crossfade or slide; `live.js` keeps an `is-moving` class on the widget from the click until the new card has landed (also during folds), and `live.css` hides `.u-numbers` while it's set
- Scrollbar is 25% of its former width (track 13px → 3.25px, thumb 9px → 2.25px) via new tokens `--urtak-scrollbar-scale`, `--urtak-scrollbar-track-width`, `--urtak-scrollbar-inset`; applies to both the live widget and the prototype

**Why:**
- Feedback: don't show vote details while the card is moving; scrollbar too wide

**Files Modified:**
- `widget/live.js`, `widget/live.css`
- `prototype/tokens.css`, `prototype/widget.css`

---

## 2026-10-27 - Live widget: 1.5× size, slower slide, crossfade results

**Session:** `9c0aca76-365b-4c8b-bbaa-c43cdcd33a08`

**What Changed:**
- Removed the 1×/2× zoom switch; the widget now always shows at 1.5× (1.2× under 700px, 1× under 420px)
- Slide after answering is slower and softer: 1100ms with a soft-start ease, starting 260ms into the crossfade; returning to the top glides at the same pace
- Buttons → result is now a simple crossfade (600ms) instead of the spinning, sweeping pie; the button you pressed fades out 100ms after the others
- New tokens: `--urtak-live-crossfade`, `--urtak-live-pressed-delay`, `--urtak-live-slide-delay`, `--urtak-live-slide-ease`; removed unused `--urtak-live-spring`

**Why:**
- Feedback: slide was too fast and abrupt; the result transition should be a smooth crossfade; fixed 1.5× size

**Files Modified:**
- `widget/index.html`, `widget/page.css`, `widget/live.css`, `widget/live.js`
- `prototype/tokens.css`
- `docs/reference.md`, `docs/plans/2026-10-27-live-widget.md`

---

## 2026-10-27 - Live interactive Urtak widget

**Session:** `9c0aca76-365b-4c8b-bbaa-c43cdcd33a08`

**What Changed:**
- New `widget/` folder: a working Urtak widget in one view. Answering turns the card's buttons into its result (answer word, sweeping pie, share row) while the stream slides down and the next question drops in
- Ask-your-own flow in place (ask card slides in, log-in notice, login lightbox, pending → approved or published straight away), flagging, Happy Ending + "New Questions" refresh, info drawer, share lightboxes, live vote ticks, progress counter, scrolling
- Exported the prototype's component builders (`Urtak.parts`) from `prototype/widget.js` so the live engine reuses them
- Added `--urtak-live-*` motion tokens to `prototype/tokens.css`

**Why:**
- Requested: a working interactive prototype with sliding cards and transitions, based on how Urtak actually worked (researched from the linked articles)

**Files Modified:**
- `widget/index.html`, `widget/live.js`, `widget/live.css`, `widget/page.css` (new)
- `prototype/widget.js` (exports only)
- `prototype/tokens.css` (motion tokens)
- `docs/plans/2026-10-27-live-widget.md`, `docs/reference.md`, `PROJECT.md`

---

## 2026-10-27 - Git repository set up

**Session:** `09c81c02-fc2b-46cc-a0b3-544aedafbcd7`

**What Changed:**
- Initialised git on branch `main` and made the initial commit
- Added `.gitignore` for macOS, Dropbox and DashCode local files, plus `*.psd`
- Noted in `PROJECT.md` that the PSD is kept outside the repo

**Why:**
- Put the project under version control; the 23 MB PSD stays out of git

**Files Modified:**
- `.gitignore` (new)
- `PROJECT.md`
- `docs/log.md`

---

## 2026-10-27 - Widget rebuilt in HTML/CSS with design tokens

**Session:** `9c0aca76-365b-4c8b-bbaa-c43cdcd33a08`

**What Changed:**
- Replaced the image-based prototype with the widget drawn in code: `tokens.css` (palette, type, spacing, shadows, gradients, themes), `widget.css`, `widget.js` (renders a state from a view object), `app.js` (39 states, actions, history), `shell.css`
- Pulled every value from the PSD and its smart objects with psd-tools: fonts (Droid Sans), colours, gradients, strokes, shadows, layer bounds; converted the PSD's vector shapes to an inline SVG icon sprite
- Pies are CSS conic-gradient masks; scrolling is real; themes (blue, wood, sponsored) only swap tokens
- Moved the comp PNGs from `prototype/states/` to `design/comps/`; the shell can show the comp beside the coded widget for comparison
- Removed `prototype/style.css` (replaced by `shell.css`)

**Why:**
- Requested: recreate the widget in code with CSS tokens instead of image files

**Files Modified:**
- `prototype/tokens.css` (new)
- `prototype/widget.css` (new)
- `prototype/widget.js` (new)
- `prototype/shell.css` (new)
- `prototype/app.js`
- `prototype/index.html`
- `prototype/style.css` (removed)
- `design/comps/*.png` (moved from `prototype/states/`)
- `docs/reference.md`, `docs/plans/2026-10-27-widget-in-code.md`, `PROJECT.md`

---

## 2026-10-27 - Clickable prototype of the Urtak widget

**Session:** `9c0aca76-365b-4c8b-bbaa-c43cdcd33a08`

**What Changed:**
- Exported all 39 Layer Comps from `1201-MagicWidgets.psd` via a Photoshop script and cropped the narrow 300px widget from each into `prototype/states/`
- Built a static HTML/CSS/JS clickable prototype: a sidebar listing every comp, hotspots on each state that move between comps, a logged-in flag for the ask flow, Ask tab hover, mouse-wheel scroll, crossfades, 1×/2× zoom, a hotspot toggle and keyboard shortcuts
- Documented the PSD structure and prototype internals in `docs/reference.md`, filled in `PROJECT.md`, saved the plan

**Why:**
- Requested: a clickable prototype of the Urtak widget based on the PSD's Layer Comps

**Files Modified:**
- `prototype/index.html`
- `prototype/style.css`
- `prototype/app.js`
- `prototype/states/*.png` (39 images)
- `docs/reference.md`
- `docs/plans/2026-10-27-widget-clickable-prototype.md`
- `PROJECT.md`

---

## 2026-10-27 - Added DashCode starter files

**What Changed:**
- Created the DashCode starter files this folder was missing

**Why:**
- Existing folder added to DashCode

**Files Modified:**
- `CLAUDE.md`
- `PROJECT.md`
- `README.md`
- `docs/reference.md`
- `docs/log.md`
- `docs/plans/`

---
