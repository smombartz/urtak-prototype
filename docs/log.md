# Change log

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
