# Urtak widget rebuilt in HTML/CSS with design tokens

Follows `2026-10-27-widget-clickable-prototype.md`. The user asked for the widget to be recreated in
code instead of comp images, with CSS tokens as the final source of truth.

## Goal
Same states and flow as the image prototype, but every pixel drawn by HTML/CSS/SVG. No raster files
used by the page.

## Source of values
Pulled straight from the PSD with psd-tools (main document + every embedded smart object):
text layers (font, size, leading, colour), shape fills, gradients (PS angle → CSS: `90° - angle`),
strokes, drop/inner shadows, layer opacity, and layer bounds for layout. Icons are the PSD's own
vector shapes converted to SVG paths (`fill-rule: evenodd`).

## Files (`prototype/`)
- `tokens.css`: primitive tokens (palette, type, space, radius, shadow, gradient, motion) and
  semantic/component tokens (`--urtak-*`). Themes (Custom01 blue, Custom02 wood, Sponsored) only
  swap tokens.
- `widget.css`: the widget, written against tokens only (no raw colours).
- `widget.js`: renders a state's "view" (stream of cards, tabs, drawer, overlay, loading) to HTML.
- `app.js`: state table (one per Layer Comp), actions and transitions, prototype shell.
- `shell.css`: the prototype chrome (sidebar, controls), separate from the widget.
- `index.html`: shell, widget mount, inline SVG icon sprite.

## Components
Frame (300×290, 1px top/bottom rules, curled inset shadow) · Ask/Close tab · Info drawer (closed,
mini, expanded: Info / FAQ / About / Log In / Sign Up) · Question card (Yes / No / Don't Care, flag)
· Ask card (lined textarea, Show Username / Remove, Yes / No / Cancel) · Result card (pie via
conic-gradient, numbers view, pending, social icons, byline) · Notice bars (green, yellow, grey,
pending; pointer up/down) · Ask prompt bar · Lightboxes (Login, Sign Up, Facebook share, Tweet,
Session expired, Security) · Loading (CSS-animated bars + logotype) · Scroll (real scrolling,
up/down hints, scrollbar) · Progress counter options A–H.

## Steps
1. ✅ Extract tokens, layout and icon paths from the PSD.
2. ✅ Write `tokens.css`, `widget.css`, `widget.js`, `app.js`, `index.html`, `shell.css`.
3. ✅ Move the comp PNGs out of the prototype into `design/comps/` (reference only).
4. ✅ Check JS parses, every state renders, every action resolves; update docs and log.

## Not reproducible as tokens
The Sponsored (Coca-Cola photo) and Custom02 (wood texture) backgrounds are photos. They become a
`--urtak-stream-bg` token: wood is approximated with CSS gradients, and sponsored uses a gradient
stand-in where a sponsor's image URL would go.

## Changes
- Added a "Compare with comp" view in the shell (comp PNG beside the coded widget) so fidelity can be
  checked by eye; the widget itself still uses no images.
- Drawer and overlay states became layers over the previous card state instead of fixed screens.
- Reader input carries through (answers, typed question, tweet counter), since it's real code now.
- Logic checked with jsdom: all 39 states render, 489 actions fire without errors, full ask/login
  flow verified. Visual check is left to the user.
