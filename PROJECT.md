# Urtak Revival

Project-specific context and rules for Claude. `CLAUDE.md` imports this file and holds the general
rules shared by every project; where the two disagree, this file wins.

## Overview

Reviving the Urtak yes/no polling widget, starting from the 2012 design file
`1201-MagicWidgets.psd`.

**Key Features:**
- The narrow (300px) widget rebuilt in HTML/CSS/SVG, driven by design tokens taken from the PSD
- Clickable prototype covering all 39 Layer Comps

---

## Project Rules

Conventions that apply only to this project.

---

## Current Project State

### File Inventory

- `1201-MagicWidgets.psd`: source design (39 Layer Comps), kept outside the repo (`*.psd` is git-ignored)
- `prototype/`: the widget in code. `tokens.css` (design tokens), `widget.css`, `widget.js` (renderer), `app.js` (states + shell logic), `shell.css`, `index.html` (icon sprite)
- `design/comps/`: PNG of each Layer Comp, for reference and side-by-side comparison
- `docs/reference.md`: PSD structure and how the prototype works

### Active Features
