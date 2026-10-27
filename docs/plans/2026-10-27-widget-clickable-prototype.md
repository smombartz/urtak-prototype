# Urtak widget: clickable prototype from 1201-MagicWidgets.psd

## Goal
Build a simple HTML/CSS/JS clickable prototype of the Urtak widget, using the 39 Layer Comps in
`1201-MagicWidgets.psd` as its states.

## Findings
- The PSD (1200×400) holds two widgets side by side: **Widget Norrow 300** (x 100–400) and
  **Widget Wide 500** (x 600–1100). Every Layer Comp captures visibility only.
- The narrow 300px widget is complete across all comps. The wide one is unfinished in most comps
  (empty cards), so the prototype uses the narrow widget.
- "Happy Ending Refresh" only differs in the wide widget ("3 New Questions! Click to Load"); in the
  narrow widget it's identical to "Happy Ending".
- "Third Q Count A–H" are progress-counter explorations (bar, dotted strip, "3/12", "3 of 12",
  "9 left", "9 questions") in the widget's top-left.

## Approach
1. ✅ Export each Layer Comp from Photoshop (scripted "apply comp → Save for Web" PNG, document closed
   unsaved). Retina 2x export was skipped: Photoshop's scratch disk is full.
2. ✅ Crop the narrow widget (310×310 at canvas x 95, y 25) from each comp into `prototype/states/`.
3. ✅ Image-based prototype in `prototype/`:
   - `index.html`: stage + sidebar listing every comp, grouped (Flow, Asking, Info & account,
     Overlays & errors, Empty Urtak, Skins & variants).
   - `app.js`: state table (image + hotspots in widget pixel coordinates + targets), history/back,
     a logged-in flag so asking routes to "Ask Submitted" or "Ask CARD LoggedOut", hover swap for the
     Ask tab, mouse-wheel scroll state, auto-advance from Loading.
   - `style.css`: layout, zoom (1×/2×), crossfade, hotspot hints (clicking a dead area flashes the
     hotspots; `H` toggles them).
4. ✅ Log entry and reference notes.

## Flow
Loading → First Q → Second Q → Ask Promt → Happy Ending. Ask tab / "Ask your own" → Ask CARD →
(Yes/No) Ask Submitted when logged in, else Ask CARD LoggedOut → Log In / Sign Up overlay → Ask
Pending. Info tab → Info Mini → Info (Info / FAQ / About tabs, Log In / Sign Up). Share icons →
FB / Tweet overlays. Session and security errors → Reload/Open → Loading.

## Changes
- Happy Ending: dropped the Cancel hotspot (it sent you back to an earlier question).
- Ask CARD LoggedOut: Yes/No show a "Log in or sign up to submit" toast instead of doing nothing.
- Happy Ending Refresh and the Third Q Count variants are reachable from the sidebar only.
