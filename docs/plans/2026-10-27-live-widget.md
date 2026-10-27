# Live Urtak widget: one view, sliding cards, animated results

## Context
`prototype/` recreates the 39 Layer Comps in code but only jumps from screen to screen. The user wants a
working widget in a new `widget/` folder: one view where answering a question turns its buttons
into a pie chart while the card slides down and a new unanswered card slides in at the top, with
everything else (asking, logging in, info, sharing) happening in place with transitions.
Scope chosen: everything. Location chosen: `widget/`, reusing the prototype's tokens and component CSS.

## How Urtak worked (from the links + comps)
- A stream of yes/no questions. Each card is answered **Yes / No / Don't Care**; you can't skip,
  but you can flag a question.
- Questions arrive in random order, weighted so the "most cared about" ones (fewest Don't Care)
  come first.
- On answering, the result shows **on the same card**: buttons → pie chart, your answer appended
  to the question ("… NO"), share icons + byline appear. Numbers (Yes %, No %, Votes, Care %) are
  available on the result (comps show both pie and numbers views → numbers on hover/tap).
- Answered cards stay in the stream below; scroll back through them.
- Readers can **ask their own** yes/no question (they answer it themselves). Requires login;
  publisher either moderates (pending approval) or publishes immediately. Your question can be
  removed by you.
- When all questions are answered: "Awesome! You've answered all the questions…" + ask card
  (Happy Ending); later "3 New Questions! Click to Load" (wide comp's refresh bar).
- Info tab: stats, Info/FAQ/About, share links, Log In/Sign Up. Optional progress counter.

## Files
New folder `widget/`:
- `widget/index.html`: page with the widget, a small control strip (restart, logged in,
  moderation on/off, counter style, theme, "simulate" menu: new questions / session expired /
  cookies blocked), and the SVG icon sprite (copied from `prototype/index.html`).
- `widget/live.js`: the engine (state, question pool, animations, event handling).
- `widget/live.css`: motion only: card morph, slide/enter/collapse, pie sweep, notice
  slide, drawer/overlay transitions. Tokens for durations/easing added to `tokens.css`.

Reused, not copied:
- `prototype/tokens.css` and `prototype/widget.css` linked from `widget/index.html`
  (single source of tokens and component styles).
- `prototype/widget.js`: export its existing builders so the live engine reuses them:
  `window.Urtak.parts = { icon, btn, pie, notice, askCard, tab, drawer, overlay, loading }`
  and `syncScroll`/`maxScroll` (already exported). No behaviour change for the prototype.

## Engine design (`widget/live.js`)
**Data**: a pool of ~14 questions (comp questions plus new ones), each `{id, q, by, yes, no, care,
votes}` seeded counts; ordered by `care` with jitter (Urtak's "most cared about first").
State: `queue`, `answered[]` (newest first), `my answers`, `loggedIn`, `moderation`,
`asked[]` (your questions with status pending/live).

**Persistent DOM, keyed cards.** The stream is built once; cards are added/removed individually
(no full re-render), so CSS transitions run. One unified card element holds both faces:
`.u-card.u-q` question parts (text, flag, `.u-answers`) and result parts (answer word, pie,
numbers, social row); class `is-answered` switches faces. Same geometry as the comps
(buttons at x 205, pie at x 210).

**The core move (answer → slide):** on click
1. Record the vote, bump counts (+1 to that side, votes +1).
2. Morph the card (~400ms): buttons fade/scale out, the answer word fades in after the question,
   the pie scales in and sweeps its slice from 0 to its share (`@property --u-slice` registered
   as `<number>` so the conic mask transitions), social row fades in where the flag was.
3. FLIP slide: measure card positions, insert the next question card at the top in an
   "entering" state (above the viewport top, opacity 0), then animate existing cards down by
   one card + gap (110px) while the new card drops into place. Stream scroll resets to top.
4. Counter updates (e.g. "3 of 12"); after the 2nd answer the "Ask your own" prompt bar slides in
   once under the top card (Ask Promt comp).
- Hover/focus on a result's pie fades in the numbers overlay (Yes/No/Votes/Care).
- Don't Care: result shows "DON'T CARE" in grey; votes/care update.
- Flag: flag icon → inline "Flag this question? YES" → card collapses (height → 0) and the next
  question slides in.

**Ask flow (in place):** Ask tab / prompt → an ask card slides in at the top pushing the stream
down; tab turns into the red close tab (Cancel/close slides it back out). Type, then pick your
own Yes/No:
- Logged out: yellow "To submit your Question Log In or Sign Up." notice slides out under the
  card; links open the login/sign-up lightbox (pop + dimmer). Logging in resumes the submit.
- Logged in, moderation off: the ask card morphs into your result card (pie, "Asked by You |
  Remove") with a green "succesfully submitted" notice that slides in, then fades after ~4s.
- Moderation on: card morphs to the pending face (faint pie + hourglass, "Pending Approval")
  with the grey notice; after a simulated approval (~6s) it morphs to the live pie.
- Remove: card collapses and leaves.

**End of queue:** Happy Ending slides in (ask card + green "Awesome!" notice). After ~8s a
"3 New Questions! Click to Load" bar drops in at the top; clicking loads 3 more questions into the
queue and the next card slides in.

**Chrome, all animated in place:** loading bars at start fade into the first card; info drawer
(closed → mini → open, reusing `.u-drawer[data-pos]` transitions) with Info/FAQ/About content and
Log In/Sign Up forms; share icons open Tweet/Facebook lightboxes (live tweet counter); star toggle;
real wheel/touch scrolling with hints + scrollbar (`syncScroll`); simulated Session Expired /
Cookies Blocked overlays from the control strip.

**Accessibility/motion:** buttons stay real buttons; focus moves to the new top card after a
slide; `aria-live` announces results; `prefers-reduced-motion` swaps slides for fades.

## Docs
Plan copied to `docs/plans/2026-10-27-live-widget.md` before coding; log entry in `docs/log.md`;
`docs/reference.md` gets a "Live widget" section (mechanics, engine, how it reuses the prototype);
`PROJECT.md` inventory adds `widget/`.

## Verification
- `node --check` on all JS.
- jsdom script (scratchpad, already set up) driving the real page: answer through the whole
  queue (each answer leaves exactly one unanswered top card, answered count +1, pie face shown),
  happy ending appears, refresh loads 3 more, ask flow logged out → login → pending → approved,
  moderation off → live, remove collapses the card, flag skips, drawer and lightboxes open/close,
  no console errors. (jsdom has no layout, so it checks state and DOM, not motion.)
- The user checks the motion and look in their browser by opening `widget/index.html`.

## Steps
1. ✅ Export builders from `prototype/widget.js`.
2. ✅ Write `widget/index.html`, `widget/live.css`, `widget/live.js`.
3. ✅ Verify with jsdom; update docs and log.

## Changes
- Added `widget/page.css` for the page around the widget (stand-in article, controls), keeping
  `live.css` to widget motion only.
- The PSD was moved out of the repo (now gitignored); the refresh bar was styled from the PSD's
  refresh button (grey circle + arrows) and link text instead of re-reading the wide widget.
- Other readers' votes tick in live ("Live votes" toggle), so pies on screen keep moving.
- Verified in jsdom: 35 checks across the full loop, ask flow, moderation, flag, drawer, share,
  reload; no errors.
- Feedback round: removed the 1×/2× switch (widget fixed at 1.5×); slide slowed to 1100ms with a
  soft ease and a gliding scroll-to-top; buttons → pie is now a plain crossfade (no spin/scale or
  sweep on answer), with the pressed button fading 100ms after the others.
