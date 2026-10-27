/* Live Urtak widget.
 * One view, persistent DOM: answering turns a card's buttons into its result (pie, your answer,
 * share icons) while the stream slides down and the next question drops in at the top.
 * Component markup and styles come from ../prototype (widget.js builders, widget.css, tokens.css). */
(function () {
  const { esc, icon, btn, answers, pie, notice, askCard, prompt, drawer, overlay, loading } = Urtak.parts;
  const root = document.getElementById('urtak');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Durations come from tokens.css so motion is tuned in one place.
  const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ms = (name, fallback) => { const v = parseFloat(token(name)); return Number.isFinite(v) ? v : fallback; };
  const T = {
    morph: ms('--urtak-live-morph', 420), slide: ms('--urtak-live-slide', 1100),
    crossfade: ms('--urtak-live-crossfade', 600), pressed: ms('--urtak-live-pressed-delay', 100),
    slideDelay: ms('--urtak-live-slide-delay', 260),
    collapse: ms('--urtak-live-collapse', 320), fade: ms('--urtak-live-fade', 180),
  };
  const wait = (t) => new Promise((r) => setTimeout(r, reduced.matches ? Math.min(t, 150) : t));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // ------------------------------------------------------------------ Questions
  // yes / no / dc are vote counts. Care = share of people who didn't pick Don't Care.

  const POOL = [
    { q: 'Did you like this article?', by: 'The Daily Beast', yes: 1026, no: 439, dc: 30 },
    { q: 'Do you agree with the author’s general opinion?', by: 'a Reader', yes: 88, no: 1377, dc: 30 },
    { q: 'Do you ride a bike in New York during the summer?', by: 'a Reader', yes: 412, no: 903, dc: 210 },
    { q: 'Should the city add more protected bike lanes?', by: 'Salon.com', yes: 1210, no: 388, dc: 95 },
    { q: 'Would you pay for a news site you read every day?', by: 'a Reader', yes: 540, no: 860, dc: 120 },
    { q: 'Do you read the comments under articles?', by: 'a Reader', yes: 701, no: 655, dc: 260 },
    { q: 'Have you ever changed your mind because of a poll?', by: 'Hollywood.com', yes: 233, no: 1012, dc: 180 },
    { q: 'Do you trust online reviews?', by: 'a Reader', yes: 610, no: 702, dc: 64 },
    { q: 'Should schools start later in the morning?', by: 'a Reader', yes: 980, no: 470, dc: 150 },
    { q: 'Is it rude to check your phone at dinner?', by: 'a Reader', yes: 1140, no: 380, dc: 42 },
    { q: 'Do you believe in magic?', by: 'The Daily Beast', yes: 512, no: 508, dc: 300 },
    { q: 'Is Chuck Norris real?', by: 'a Reader', yes: 1320, no: 410, dc: 75 },
  ];
  const LATE = [
    { q: 'Would you ride in a self-driving taxi?', by: 'a Reader', yes: 402, no: 377, dc: 41 },
    { q: 'Is a hot dog a sandwich?', by: 'a Reader', yes: 330, no: 690, dc: 220 },
    { q: 'Should tipping be replaced by higher wages?', by: 'Salon.com', yes: 720, no: 410, dc: 88 },
  ];

  const total = (q) => q.yes + q.no + q.dc;
  const yesPct = (q) => (q.yes + q.no ? Math.round((q.yes / (q.yes + q.no)) * 100) : 50);
  const carePct = (q) => Math.round(((q.yes + q.no) / Math.max(1, total(q))) * 100);

  // Urtak served the most cared-about questions first, with some shuffle.
  const order = (list) => list
    .map((q) => ({ q, k: carePct(q) + Math.random() * 18 }))
    .sort((a, b) => b.k - a.k).map((x) => x.q);

  let uid = 0;
  const make = (q) => ({ ...q, id: 'q' + ++uid });

  // ---------------------------------------------------------------------- State

  const S = {};
  const timers = new Set();
  const later = (fn, t) => { const id = setTimeout(() => { timers.delete(id); fn(); }, t); timers.add(id); return id; };

  function resetState() {
    timers.forEach(clearTimeout); timers.clear();
    Object.assign(S, {
      queue: order(POOL.map(make)), late: LATE.map(make), byId: {},
      done: 0, total: POOL.length, current: null,
      askEl: null, askHappy: false, pendingAsk: null, showName: false,
      promptShown: false, happy: false, scroll: 0, drawer: 'closed', busy: false,
      loggedIn: S.loggedIn ?? false, moderation: S.moderation ?? true, counter: S.counter ?? 'd',
    });
    S.queue.forEach((q) => { S.byId[q.id] = q; });
    S.late.forEach((q) => { S.byId[q.id] = q; });
  }

  // ------------------------------------------------------------------- Markup

  function cardEl(q) {
    const el = document.createElement('article');
    el.className = 'u-card u-live u-result--social-on';
    el.dataset.key = q.id;
    el.innerHTML = `
      <p class="u-q__text">${esc(q.q)}<span class="u-live__answer"></span></p>
      <p class="u-flag">${btn('flag', icon('flag'), 'u-flag__toggle', null, ' aria-label="Flag this question"')}</p>
      ${answers('question')}`;
    return el;
  }

  function numbers(q) {
    const y = yesPct(q);
    return `<dt class="is-yes">Yes</dt><dd class="is-yes">${y}%</dd>
      <dt class="is-no">No</dt><dd class="is-no">${100 - y}%</dd>
      <dt>Votes</dt><dd>${total(q).toLocaleString('en-US')}</dd>
      <dt>Care</dt><dd>${carePct(q)}%</dd>`;
  }

  function byline(q) {
    if (!q.mine) return `Asked by ${esc(q.by)}`;
    if (q.status === 'pending') return 'Asked by You! Pending Approval.';
    return `Asked by You <span class="u-sep">|</span> ${btn('remove-question', 'Remove', 'u-link u-link--danger')}`;
  }

  function resultHTML(q) {
    const y = yesPct(q);
    return `
      <div class="u-result__chart" tabindex="0" aria-label="${y}% yes, ${100 - y}% no, ${total(q)} votes. Hover for numbers.">
        ${pie({ yes: y, display: q.status === 'pending' ? 'pending' : 'pie' })}
        <dl class="u-numbers">${numbers(q)}</dl>
      </div>
      <p class="u-social">
        ${btn('star', icon('star'), 'u-social__btn u-social__btn--star', null, ' aria-label="Favourite" aria-pressed="false"')}
        ${btn('share-tweet', icon('twitter'), 'u-social__btn u-social__btn--twitter', null, ' aria-label="Tweet"')}
        ${btn('share-facebook', icon('facebook'), 'u-social__btn u-social__btn--facebook', null, ' aria-label="Share on Facebook"')}
        <span class="u-byline">${byline(q)}</span>
      </p>`;
  }

  const ANSWER_WORD = { yes: 'YES', no: 'NO', dontcare: 'DON’T CARE' };

  function fromHTML(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // -------------------------------------------------------------------- Motion

  const stream = () => root.querySelector('[data-stream]');

  // While anything slides, the pie's vote details stay hidden (live.css keys off .is-moving).
  let moving = 0;
  const beginMove = () => { moving += 1; root.classList.add('is-moving'); };
  const endMove = () => { moving = Math.max(0, moving - 1); if (!moving) root.classList.remove('is-moving'); };

  // FLIP: remember where every card was, change the DOM, then animate from the old spots.
  async function flip(change) {
    const st = stream();
    const before = new Map([...st.children].map((n) => [n, n.offsetTop]));
    beginMove();
    change();
    if (reduced.matches) { endMove(); return settle(); }
    const moved = [];
    for (const n of st.children) {
      if (!before.has(n)) continue;
      const dy = before.get(n) - n.offsetTop;
      if (!dy) continue;
      n.style.transition = 'none';
      n.style.transform = `translateY(${dy}px)`;
      moved.push(n);
    }
    void st.offsetHeight;
    requestAnimationFrame(() => {
      for (const n of moved) { n.style.transition = ''; n.style.transform = ''; }
      st.querySelectorAll('.is-entering').forEach((n) => n.classList.remove('is-entering'));
    });
    await wait(T.slide);
    endMove();
    settle();
  }

  // Insert one or more elements before a reference node (null = end), sliding the rest.
  function insert(els, beforeNode) {
    els = [].concat(els);
    return flip(() => {
      for (const el of els) { el.classList.add('is-entering'); stream().insertBefore(el, beforeNode); }
      if (reduced.matches) requestAnimationFrame(() => els.forEach((el) => el.classList.remove('is-entering')));
    });
  }
  const insertTop = (els) => insert(els, stream().firstElementChild);
  const insertAfter = (ref, els) => insert(els, ref.nextElementSibling);

  // Fold an element away; whatever is below slides up with it.
  async function collapse(el) {
    if (!el || !el.isConnected || el.dataset.collapsing) return;
    el.dataset.collapsing = '1';
    beginMove();
    const next = el.nextElementSibling;
    const gap = next && !el.previousElementSibling ? parseFloat(getComputedStyle(next).marginTop) : 0;
    el.style.height = el.offsetHeight + 'px';
    el.style.minHeight = '0';
    el.style.overflow = 'hidden';
    void el.offsetHeight;
    el.style.transition = `height ${T.collapse}ms ease, margin ${T.collapse}ms ease, opacity ${T.collapse * 0.6}ms ease`;
    el.style.height = '0';
    el.style.marginTop = '0';
    el.style.marginBottom = gap ? `-${gap}px` : '0';
    el.style.opacity = '0';
    await wait(T.collapse);
    el.remove();
    endMove();
    settle();
  }

  // Swap one element for another in place (crossfade), keeping the stream position.
  async function swap(oldEl, newEl) {
    oldEl.classList.add('is-swapping');
    await wait(T.fade);
    newEl.classList.add('is-swapping');
    oldEl.replaceWith(newEl);
    await nextFrame();
    newEl.classList.remove('is-swapping');
  }

  function settle() { S.scroll = Urtak.syncScroll(root, S.scroll); }
  let glideTimer;
  function scrollToTop() {
    if (!S.scroll) return;
    root.classList.add('is-gliding');
    S.scroll = Urtak.syncScroll(root, 0);
    clearTimeout(glideTimer);
    glideTimer = setTimeout(() => root.classList.remove('is-gliding'), T.slide);
  }

  function setPie(el, q, { sweep = false } = {}) {
    const p = el.querySelector('.u-pie');
    if (!p) return;
    const y = yesPct(q);
    const majority = y >= 50 ? 'yes' : 'no';
    const minority = Math.min(y, 100 - y);
    p.classList.toggle('u-pie--yes', majority === 'yes');
    p.classList.toggle('u-pie--no', majority === 'no');
    p.classList.toggle('is-pending', q.status === 'pending');
    if (minority > 0 && !p.querySelector('.u-pie__slice')) p.querySelector('.u-pie__base').insertAdjacentHTML('afterend', '<span class="u-pie__slice"></span>');
    if (q.status !== 'pending') p.querySelector('.u-pie__pending')?.remove();
    if (sweep) { p.style.setProperty('--u-slice', 0); void p.offsetWidth; }
    requestAnimationFrame(() => p.style.setProperty('--u-slice', minority));
    p.setAttribute('aria-label', `${y}% yes, ${100 - y}% no`);
    const dl = el.querySelector('.u-numbers');
    if (dl) dl.innerHTML = numbers(q);
  }

  // ------------------------------------------------------------------ Answering

  function topQuestion() {
    return [...stream().children].find((n) => n.classList.contains('u-live') && !n.classList.contains('is-answered'));
  }

  async function answer(el, value, pressed) {
    if (!el || el.classList.contains('is-answered') || S.busy) return;
    S.busy = true;
    beginMove();   // from the click until the new card has landed
    const q = S.byId[el.dataset.key];
    q[value === 'dontcare' ? 'dc' : value] += 1;
    q.mineAnswer = value;
    S.done += 1;
    S.queue = S.queue.filter((x) => x !== q);
    el.querySelectorAll('.u-answers .u-btn').forEach((b) => { b.disabled = true; });
    pressed?.classList.add('is-pressed');

    // Same card, new face: the buttons crossfade into the answer word, pie and share row.
    el.querySelector('.u-live__answer').innerHTML = `&nbsp; <b class="u-answer u-answer--${value}">${ANSWER_WORD[value]}</b>`;
    el.insertAdjacentHTML('beforeend', resultHTML(q));
    void el.offsetWidth;
    el.classList.add('is-answered');
    announce(`${ANSWER_WORD[value]}. ${yesPct(q)}% of ${total(q).toLocaleString('en-US')} people said yes.`);
    updateCounter();

    const hadFocus = root.contains(document.activeElement);
    later(() => el.querySelectorAll('.u-answers, .u-flag').forEach((n) => n.remove()), T.crossfade + T.pressed + 50);
    await wait(T.slideDelay);
    scrollToTop();
    await advance();
    endMove();
    if (hadFocus) topQuestion()?.querySelector('.u-btn')?.focus({ preventScroll: true });
    S.busy = false;
  }

  async function advance() {
    const next = S.queue[0];
    if (!next) return happyEnding();
    const el = cardEl(next);
    const extra = [];
    if (S.done === 2 && !S.promptShown && !S.askEl) { S.promptShown = true; extra.push(fromHTML(prompt())); }
    await insertTop([el, ...extra]);
  }

  // Flag: inline "Flag this question? YES", then the card folds away and the next one drops in.
  function toggleFlag(el) {
    const f = el.querySelector('.u-flag');
    const asking = f.classList.toggle('is-asking');
    f.classList.toggle('is-on', asking);
    f.innerHTML = asking
      ? `${btn('flag', icon('flag'), 'u-flag__toggle', null, ' aria-label="Keep this question"')}<span>Flag this question? ${btn('flag-confirm', 'YES', 'u-flag__yes')}</span>`
      : btn('flag', icon('flag'), 'u-flag__toggle', null, ' aria-label="Flag this question"');
  }

  async function flag(el) {
    if (S.busy) return;
    S.busy = true;
    const q = S.byId[el.dataset.key];
    S.queue = S.queue.filter((x) => x !== q);
    S.done += 1;
    updateCounter();
    toast('Question flagged. Thanks!');
    await collapse(el);
    await advance();
    S.busy = false;
  }

  // ------------------------------------------------------------- Happy ending

  async function happyEnding() {
    S.happy = true;
    setTab('none');
    updateCounter();
    const ask = fromHTML(askCard({ mode: 'reader', text: '' }));
    const note = fromHTML(notice({ tone: 'positive', pointer: 'up', tall: true,
      html: 'Awesome! You’ve answered all the questions. Add your own and Sign Up to get updates on this Urtak.' }));
    note.dataset.role = 'happy';
    S.askEl = ask; S.askHappy = true;
    await insertTop([ask, note]);
    if (S.late.length) later(showRefresh, 8000);
  }

  function showRefresh() {
    if (!S.late.length || root.querySelector('.u-refresh')) return;
    const n = S.late.length;
    const bar = fromHTML(`<button type="button" class="u-refresh" data-action="refresh">
      <span class="u-refresh__icon">${icon('refresh')}</span><span>${n} New Question${n > 1 ? 's' : ''}! Click to Load</span></button>`);
    scrollToTop();
    insertTop(bar);
  }

  async function loadNew() {
    const bar = root.querySelector('.u-refresh');
    bar?.classList.add('is-loading');
    await wait(500);
    S.queue.push(...S.late.splice(0));
    S.total += S.queue.length;
    S.happy = false;
    const happyNote = root.querySelector('[data-role="happy"]');
    const keepAsk = S.askHappy && S.askEl?.querySelector('textarea').value.trim();
    collapse(bar); collapse(happyNote);
    if (S.askHappy && !keepAsk) { collapse(S.askEl); S.askEl = null; S.askHappy = false; }
    else if (S.askHappy) S.askHappy = false;
    setTab(S.askEl ? 'close' : 'ask');
    await wait(T.collapse);
    updateCounter();
    await advance();
  }

  // ------------------------------------------------------------- Asking your own

  async function openAsk() {
    scrollToTop();
    if (S.askEl) { S.askEl.querySelector('textarea').focus(); return; }
    const el = fromHTML(askCard({ mode: S.showName ? 'username' : 'reader', text: '' }));
    S.askEl = el; S.askHappy = false;
    setTab('close');
    root.querySelector('.u-prompt') && collapse(root.querySelector('.u-prompt'));
    await insertTop(el);
    el.querySelector('textarea').focus({ preventScroll: true });
  }

  async function cancelAsk() {
    if (!S.askEl) return;
    if (S.askHappy) { S.askEl.querySelector('textarea').value = ''; S.pendingAsk = null; collapse(loginNotice()); return; }
    const el = S.askEl;
    S.askEl = null; S.pendingAsk = null;
    collapse(loginNotice());
    setTab('ask');
    await collapse(el);
  }

  function setByline(show) {
    S.showName = show;
    const old = S.askEl?.querySelector('.u-byline');
    if (!old) return;
    const name = S.loggedIn ? 'smombartzverylong' : 'reader';
    old.innerHTML = show
      ? `Asked by ${name === 'reader' ? 'a reader' : name} <span class="u-sep">|</span> ${btn('hide-username', 'Remove', 'u-link u-link--danger')}`
      : `Asked by a reader <span class="u-sep">|</span> ${btn('show-username', 'Show Username', 'u-link u-link--positive')}`;
  }

  const loginNotice = () => root.querySelector('[data-role="login"]');

  async function submitAsk(value) {
    const ta = S.askEl?.querySelector('textarea');
    if (!ta) return;
    const text = ta.value.trim();
    if (!text) {
      S.askEl.classList.remove('is-shaking'); void S.askEl.offsetWidth; S.askEl.classList.add('is-shaking');
      ta.focus();
      return;
    }
    S.pendingAsk = { text: /\?$/.test(text) ? text : text + '?', answer: value };
    if (S.loggedIn) return completeAsk();
    const existing = loginNotice();
    if (existing) { existing.classList.remove('is-nudged'); void existing.offsetWidth; existing.classList.add('is-nudged'); return; }
    const note = fromHTML(notice({ tone: 'warning', pointer: 'up',
      html: 'To submit your Question <button type="button" class="u-link" data-action="overlay-login">Log In</button> or <button type="button" class="u-link" data-action="overlay-signup">Sign Up</button>.' }));
    note.dataset.role = 'login';
    await insertAfter(S.askEl, note);
  }

  async function completeAsk() {
    const p = S.pendingAsk;
    if (!p || !S.askEl) return;
    S.pendingAsk = null;
    const ask = S.askEl;
    S.askEl = null;
    const wasHappy = S.askHappy;
    S.askHappy = false;
    collapse(loginNotice());
    if (wasHappy) collapse(root.querySelector('[data-role="happy"]'));

    const q = make({ q: p.text, by: 'You', yes: p.answer === 'yes' ? 1 : 0, no: p.answer === 'no' ? 1 : 0, dc: 0 });
    q.mine = true; q.status = S.moderation ? 'pending' : 'live';
    S.byId[q.id] = q;

    // The ask card becomes your result card.
    const el = cardEl(q);
    el.querySelector('.u-live__answer').innerHTML = `&nbsp; <b class="u-answer u-answer--${p.answer}">${ANSWER_WORD[p.answer]}</b>`;
    el.querySelector('.u-flag').remove(); el.querySelector('.u-answers').remove();
    el.insertAdjacentHTML('beforeend', resultHTML(q));
    await swap(ask, el);
    el.classList.add('is-answered');
    setPie(el, q, { sweep: true });
    setTab(S.happy ? 'none' : 'ask');
    await wait(T.morph);

    // Your card settles under the current question, with a notice pointing at it.
    const note = fromHTML(notice(q.status === 'pending'
      ? { tone: 'pending', pointer: 'down', html: '<b>Question Submitted.</b> Pending Approval.' }
      : { tone: 'positive', pointer: 'down', html: 'Your questions was succesfully submitted!' }));
    note.dataset.role = 'submitted';
    const top = topQuestion();
    await flip(() => {
      if (top) top.after(el);
      note.classList.add('is-entering');
      el.before(note);
    });
    announce(q.status === 'pending' ? 'Question submitted. Pending approval.' : 'Your question was submitted.');

    if (q.status === 'pending') later(() => approve(el, q, note), 6000);
    else later(() => collapse(note), 4000);
  }

  function approve(el, q, note) {
    if (!el.isConnected) return;
    q.status = 'live';
    setPie(el, q, { sweep: true });
    el.querySelector('.u-byline').innerHTML = byline(q);
    el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
    toast('Your question was approved');
    announce('Your question was approved and is live.');
    collapse(note);
  }

  async function removeMine(el) {
    const prev = el.previousElementSibling;
    if (prev?.dataset.role === 'submitted') collapse(prev);
    toast('Question removed');
    await collapse(el);
  }

  // ------------------------------------------------------------ Tab, counter

  function setTab(kind) {
    const tab = root.querySelector('.u-tab');
    if (tab.dataset.kind === kind) return;
    tab.dataset.kind = kind;
    tab.classList.add('is-hidden');
    if (kind === 'none') return;
    later(() => {
      if (tab.dataset.kind !== kind) return;
      tab.className = `u-tab u-tab--${kind === 'close' ? 'close' : 'ask'} is-hidden`;
      tab.dataset.action = kind === 'close' ? 'ask-cancel' : 'ask-open';
      tab.innerHTML = kind === 'close' ? icon('close-x') : 'Ask';
      tab.setAttribute('aria-label', kind === 'close' ? 'Close' : 'Ask your own question');
      requestAnimationFrame(() => tab.classList.remove('is-hidden'));
    }, T.fade);
  }

  function updateCounter() {
    const c = root.querySelector('.u-counter');
    const style = S.counter;
    const left = Math.max(0, S.total - S.done);
    const show = style !== 'none' && !S.happy && left > 0;
    c.hidden = !show;
    if (!show) return;
    const now = Math.min(S.total, S.done + 1);
    c.style.setProperty('--u-progress', `${(S.done / S.total) * 100}%`);
    const html = {
      a: '<span class="u-counter__bar u-counter__bar--tall"><span style="width:var(--u-progress)"></span></span>',
      b: '<span class="u-counter__bar"><span style="width:var(--u-progress)"></span></span>',
      c: `<span class="u-counter__text">${now}/${S.total}</span>`,
      d: `<span class="u-counter__text u-counter__text--small">${now} of ${S.total}</span>`,
      e: `<span class="u-counter__text">${left} left</span>`,
      f: `<span class="u-counter__text">${left} question${left === 1 ? '' : 's'}</span>`,
      g: '<span class="u-counter__dots"></span>',
      h: '<span class="u-counter__ticks"></span>',
    }[style];
    const bar = c.querySelector('.u-counter__bar span');
    if (bar && (style === 'a' || style === 'b') && c.dataset.style === style) return; // width animates via the var
    c.dataset.style = style;
    c.innerHTML = html;
  }

  // ------------------------------------------------------------------ Drawer

  const POS = (mode) => (mode === 'closed' ? 'closed' : mode === 'mini' ? 'mini' : 'open');

  async function setDrawer(mode) {
    const el = root.querySelector('.u-drawer');
    const fresh = fromHTML(drawer({ drawer: mode }).replace(/^[\s\S]*?(<section)/, '$1'));
    const from = POS(S.drawer), to = POS(mode);
    S.drawer = mode;
    root.querySelector('.u-live-dimmer').classList.toggle('is-on', to === 'open');
    root.querySelectorAll('.u-viewport, .u-tab').forEach((n) => { n.inert = to === 'open'; });
    const swapAll = () => { el.innerHTML = fresh.innerHTML; };

    if (from === to && to === 'open') {          // switching sections: quick crossfade
      el.classList.add('is-fading');
      await wait(T.fade);
      swapAll();
      el.classList.remove('is-fading');
      return;
    }
    el.dataset.pos = to;
    if (from === 'open' && to !== 'open') {      // keep the old content while it slides down
      for (const sel of ['.u-drawer__tab', '.u-drawer__close']) {
        const a = el.querySelector(sel), b = fresh.querySelector(sel);
        if (a && b) a.replaceWith(b); else if (a) a.remove(); else if (b) el.prepend(b);
      }
      await wait(ms('--duration-slow', 320));
      if (S.drawer === mode) swapAll();
    } else swapAll();
    if (to === 'open') el.querySelector('.u-drawer__panel button, .u-drawer__panel input')?.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- Lightboxes

  let shareFrom = null;

  function openOverlay(kind, card) {
    root.querySelector('.u-overlay')?.remove();
    root.insertAdjacentHTML('beforeend', overlay({ overlay: kind }));
    const o = root.querySelector('.u-overlay');
    const q = card && S.byId[card.dataset.key];
    if (q && kind === 'facebook') {
      const y = yesPct(q);
      o.querySelector('.u-share-card').innerHTML = `${pie({ yes: y }, 50)}<p><b>${esc(q.q)}</b><br>${y}% said Yes on Urtak.</p>`;
    }
    if (q && kind === 'tweet') {
      const ta = o.querySelector('[data-tweet]');
      ta.value = `@Urtak: ${q.q} ${yesPct(q)}% said yes. Ask and answer questions. http://urtak.is/HEk7`;
      o.querySelector('[data-tweet-count]').textContent = 140 - ta.value.length;
    }
    root.querySelectorAll('.u-viewport, .u-tab, .u-drawer, .u-loading').forEach((n) => { n.inert = true; });
    o.querySelector('.u-lightbox input, .u-lightbox textarea, .u-lightbox button:not(.u-lightbox__close)')?.focus({ preventScroll: true });
  }

  async function closeOverlay() {
    const o = root.querySelector('.u-overlay');
    if (!o) return;
    o.classList.add('is-leaving');
    await wait(T.fade);
    o.remove();
    root.querySelectorAll('.u-viewport, .u-tab, .u-drawer, .u-loading').forEach((n) => { n.inert = false; });
    if (POS(S.drawer) === 'open') root.querySelectorAll('.u-viewport, .u-tab').forEach((n) => { n.inert = true; });
  }

  async function logIn() {
    S.loggedIn = true;
    syncControls();
    toast('Logged in');
    await closeOverlay();
    if (POS(S.drawer) === 'open') await setDrawer('closed');
    if (S.pendingAsk) completeAsk();
  }

  // ----------------------------------------------------------------- Actions

  const ACTIONS = {
    'answer': (v, el) => answer(el.closest('.u-live'), v, el),
    'flag': (v, el) => toggleFlag(el.closest('.u-live')),
    'flag-confirm': (v, el) => flag(el.closest('.u-live')),
    'star': (v, el) => { const on = el.classList.toggle('is-on'); el.setAttribute('aria-pressed', on); },
    'share-tweet': (v, el) => openOverlay('tweet', el.closest('.u-live')),
    'share-facebook': (v, el) => openOverlay('facebook', el.closest('.u-live')),
    'remove-question': (v, el) => removeMine(el.closest('.u-live')),

    'ask-open': openAsk,
    'ask-cancel': cancelAsk,
    'ask-submit': (v) => submitAsk(v),
    'show-username': () => setByline(true),
    'hide-username': () => setByline(false),
    'refresh': loadNew,

    'info-tab': () => setDrawer('mini'),
    'info-expand': () => setDrawer('info'),
    'info-collapse': () => setDrawer('mini'),
    'info-close': () => setDrawer('closed'),
    'drawer-section': (v) => setDrawer(v),
    'drawer-login': () => setDrawer('login'),
    'drawer-signup': () => setDrawer('signup'),
    'back': () => setDrawer('info'),

    'overlay-login': () => openOverlay('login'),
    'overlay-signup': () => openOverlay('signup'),
    'overlay-close': closeOverlay,
    'auth': logIn,
    'share-send': (v) => { toast(v || 'Shared'); closeOverlay(); },
    'reload': () => start(),
    'open-window': () => { toast('Would open Urtak in a new window'); start(); },

    'copy-link': () => { navigator.clipboard?.writeText('http://urtak.is/IrXRpK').catch(() => {}); toast('Short link copied'); },
    'explore': () => toast('Results explorer isn’t part of this prototype'),
    'get-urtak': () => toast('Publisher sign-up isn’t part of this prototype'),
    'forgot': () => toast('Password reset isn’t part of this prototype'),
    'terms': () => toast('Terms aren’t part of this prototype'),
    'faq': () => toast('FAQ answers aren’t part of this prototype'),
  };

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !root.contains(el) || el.disabled || el.closest('[inert]')) return;
    e.preventDefault();
    ACTIONS[el.dataset.action]?.(el.dataset.value, el);
  });
  root.addEventListener('submit', (e) => e.preventDefault());
  root.addEventListener('input', (e) => {
    if (e.target.matches('[data-tweet]')) root.querySelector('[data-tweet-count]').textContent = 140 - e.target.value.length;
  });
  root.addEventListener('keydown', (e) => {
    // Questions are one line: Enter doesn't add a line break (pick Yes or No to submit).
    if (e.target.matches('[data-ask-input]') && e.key === 'Enter') e.preventDefault();
    if (e.key === 'Escape') {
      if (root.querySelector('.u-overlay')) closeOverlay();
      else if (POS(S.drawer) !== 'closed') setDrawer('closed');
      else if (S.askEl && !S.askHappy) cancelAsk();
    }
  });

  // Scroll back through answered cards (wheel or touch).
  let scrollTimer, touchY = null;
  function scrollBy(dy) {
    if (root.querySelector('.u-overlay, .u-loading') || POS(S.drawer) === 'open') return false;
    S.scroll = Urtak.syncScroll(root, S.scroll + dy);
    root.classList.add('is-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => root.classList.remove('is-scrolling'), 900);
    return true;
  }
  root.addEventListener('wheel', (e) => {
    if (e.target.closest('textarea')) return;
    if (scrollBy(e.deltaY * 0.5)) e.preventDefault();
  }, { passive: false });
  root.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  root.addEventListener('touchmove', (e) => {
    if (touchY == null || e.target.closest('textarea')) return;
    const y = e.touches[0].clientY;
    if (scrollBy(touchY - y)) e.preventDefault();
    touchY = y;
  }, { passive: false });

  // Other readers keep voting: results already on screen tick along.
  function liveVotes() {
    if (document.hidden || !S.liveVotes) return;
    const shown = [...root.querySelectorAll('.u-live.is-answered')]
      .map((el) => [el, S.byId[el.dataset.key]]).filter(([, q]) => q && q.status !== 'pending');
    if (!shown.length) return;
    const [el, q] = shown[Math.floor(Math.random() * shown.length)];
    const lean = q.mine ? 0.5 : yesPct(q) / 100;
    for (let i = 0, n = 1 + Math.floor(Math.random() * 3); i < n; i++) {
      const r = Math.random();
      if (r < 0.08) q.dc++; else if (r < 0.08 + 0.92 * lean) q.yes++; else q.no++;
    }
    setPie(el, q);
  }

  // ----------------------------------------------------------------- Lifecycle

  function announce(msg) { const a = root.querySelector('[data-announce]'); if (a) a.textContent = msg; }

  async function start() {
    resetState();
    moving = 0;
    S.liveVotes = document.getElementById('liveVotes')?.checked ?? true;
    root.className = 'urtak urtak--live';
    root.dataset.urtakTheme = document.getElementById('theme')?.value || '';
    root.innerHTML = `
      <div class="u-viewport">
        <span class="u-hint u-hint--up" aria-hidden="true">${icon('up')}</span>
        <span class="u-hint u-hint--down" aria-hidden="true">${icon('down')}</span>
        <div class="u-stream" data-stream aria-live="off"></div>
        <span class="u-scrollbar" aria-hidden="true"><span class="u-scrollbar__thumb"></span></span>
      </div>
      <div class="u-counter" hidden></div>
      <button type="button" class="u-tab u-tab--ask is-hidden" data-kind="none" data-action="ask-open" aria-label="Ask your own question">Ask</button>
      <span class="u-curl" aria-hidden="true"></span>
      <div class="u-dimmer u-dimmer--drawer u-live-dimmer" data-action="info-close"></div>
      ${drawer({ drawer: 'closed' })}
      <p class="u-visually-hidden" aria-live="polite" data-announce></p>
      ${loading()}`;
    syncControls();
    await wait(1300);
    const load = root.querySelector('.u-loading');
    load.classList.add('is-leaving');
    setTab('ask');
    updateCounter();
    S.current = S.queue[0];
    insertTop(cardEl(S.current));
    await wait(T.fade * 2);
    load.remove();
  }

  // ----------------------------------------------------------------- Controls

  function syncControls() {
    const set = (id, prop, v) => { const el = document.getElementById(id); if (el) el[prop] = v; };
    set('loggedIn', 'checked', S.loggedIn);
    set('moderation', 'checked', S.moderation);
    set('counter', 'value', S.counter);
  }

  function bindControls() {
    const on = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
    on('restart', 'click', () => start());
    on('loggedIn', 'change', (e) => { S.loggedIn = e.target.checked; });
    on('moderation', 'change', (e) => { S.moderation = e.target.checked; });
    on('liveVotes', 'change', (e) => { S.liveVotes = e.target.checked; });
    on('counter', 'change', (e) => { S.counter = e.target.value; root.querySelector('.u-counter').dataset.style = ''; updateCounter(); });
    on('theme', 'change', (e) => { root.dataset.urtakTheme = e.target.value; });
    on('simNew', 'click', () => {
      if (!S.late.length) S.late = LATE.map(make).map((q) => { S.byId[q.id] = q; return q; });
      if (S.happy) showRefresh(); else { toast('New questions join the queue'); S.queue.push(...S.late.splice(0)); S.total = S.done + S.queue.length; updateCounter(); }
    });
    on('simExpired', 'click', () => openOverlay('expired'));
    on('simBlocked', 'click', () => {
      root.querySelector('.u-loading') || root.insertAdjacentHTML('beforeend', loading());
      openOverlay('security');
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  bindControls();
  setInterval(liveVotes, 2200);
  start();

  window.UrtakLive = { S, start, answer, ACTIONS }; // handy in the console and for tests
})();
