/* Urtak widget prototype: one state per Layer Comp in 1201-MagicWidgets.psd.
 * Each state builds a view for widget.js. Drawer and overlay states are layers: they draw
 * on top of whichever card state you came from. */

// ---- Content -----------------------------------------------------------------

const Q = {
  liked: 'Did you like this Article?',
  agree: 'Do you agree with the author’s general opinion?',
  bike: 'Do you ride a bike in New York during the summer?',
  thirsty: 'Are you thirsty?',
};

const ctx = {
  loggedIn: false,
  answers: {},          // question key → 'yes' | 'no' | 'dontcare'
  askText: null,        // what the reader typed in the ask card (null = use the comp's text)
  askAnswer: 'yes',
  askWaiting: false,    // submitted while logged out
  flagged: false,
  flagPrompt: false,
  starred: false,
  scroll: 0,
};

const answered = (key, fallback = 'yes') => (ctx.answers[key] === 'no' ? 'no' : ctx.answers[key] === 'yes' ? 'yes' : fallback);

const card = {
  question: (key, extra = {}) => ({ type: 'question', q: Q[key], key, flag: ctx.flagPrompt && !ctx.flagged ? 'prompt' : null, ...extra }),
  liked: () => ({ type: 'result', q: 'Did you like this article?', answer: answered('liked'), yes: 70, display: 'pie', social: 'on', by: 'Asked by The Daily Beast' }),
  agree: (extra = {}) => ({ type: 'result', q: 'Do you agree with the author’s general opinion?', answer: answered('agree', 'no'), yes: 6, votes: 1465, care: 98, display: 'numbers', social: 'off', by: 'Asked by a Reader', ...extra }),
  mine: (pending) => ({
    type: 'result', q: ctx.askText?.trim() || 'Is Chuck Norris real?', answer: ctx.askAnswer,
    yes: pending ? 100 : 70, display: pending ? 'pending' : 'pie', social: pending ? 'off' : 'on',
    by: pending ? 'Asked by You! Pending Approval.' : 'Asked by You', remove: !pending, mine: true,
  }),
  ask: (mode = 'reader', text) => ({ type: 'ask', mode, text: text ?? ctx.askText ?? '' }),
  notice: (tone, pointer, html, extra = {}) => ({ type: 'notice', tone, pointer, html, ...extra }),
  prompt: () => ({ type: 'prompt' }),
};

const thirdQ = () => [card.question('bike'), card.agree(), card.liked()];

// ---- States ------------------------------------------------------------------
// view(): the widget view. next: where answering the top question goes.
// layer: 'drawer' | 'overlay' draws over the previous card state.

const STATES = {
  'loading': { comp: 'Loading', group: 'Flow', note: 'Loads, then shows the first question.',
    view: () => ({ loading: true }) },
  'first-q': { comp: 'First Q', group: 'Flow', note: 'Answer, or ask your own question.', next: 'second-q', key: 'liked',
    view: () => ({ tab: 'ask', logo: true, stream: [card.question('liked'), card.prompt()] }) },
  'second-q': { comp: 'Second Q', group: 'Flow', note: 'Your answer shows as a result card. Click YES to flag the question.', next: 'ask-promt', key: 'agree',
    view: () => ({ tab: 'ask', stream: [card.question('agree', { flag: ctx.flagged ? null : 'prompt' }), card.liked()] }) },
  'ask-promt': { comp: 'Ask Promt', group: 'Flow', note: 'A nudge to ask your own question.', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', stream: [card.question('bike'), card.prompt(), card.agree(), card.liked()] }) },
  'third-q': { comp: 'Third Q', group: 'Flow', note: 'Scroll the widget to see older results. Click the flag to flag a question.', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', stream: thirdQ() }) },
  'scroll': { comp: 'Scroll', group: 'Flow', note: 'Scrolled: up hint and scrollbar appear.', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', stream: thirdQ(), scroll: 60 }) },
  'happy-ending': { comp: 'Happy Ending', group: 'Flow', note: 'All questions answered: ask your own.',
    view: () => ({ tab: 'none', stream: [
      card.ask(),
      card.notice('positive', 'up', 'Awesome! You’ve answered all the questions. Add your own and Sign Up to get updates on this Urtak.', { tall: true }),
      card.agree(), card.liked()] }) },
  'happy-ending-refresh': { comp: 'Happy Ending Refresh', group: 'Flow',
    note: 'Same as Happy Ending in the narrow widget; the refresh bar only exists in the wide one.',
    view: () => STATES['happy-ending'].view() },

  'empty': { comp: 'Empty', group: 'Empty Urtak', note: 'No questions yet. Click the card to start typing.', focusTo: 'empty-ask',
    view: () => ({ tab: 'none', logo: true, stream: [card.ask('empty', ''), card.notice('neutral', 'up', 'Be the first to ask a question!')] }) },
  'empty-ask': { comp: 'Empty Ask', group: 'Empty Urtak', note: 'Typing the first question.', submitTo: 'ask-pending', cancelTo: 'empty',
    view: () => ({ tab: 'none', stream: [card.ask('typing', ctx.askText ?? 'Is this an important artic'),
      { type: 'result', q: 'Did you like this article?', answer: 'yes', yes: 100, display: 'pie', social: 'on', by: 'Asked by a user' }] }) },

  'ask-hover': { comp: 'Ask Hover', group: 'Asking', note: 'Ask tab hover (also live on hover).', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', tabHover: true, stream: thirdQ() }) },
  'ask-card': { comp: 'Ask CARD', group: 'Asking', note: 'Type a question, then pick your own answer to submit it.',
    view: () => ({ tab: 'close', stream: [card.ask(), card.agree(), card.liked()] }) },
  'ask-card-username': { comp: 'Ask CARD Username', group: 'Asking', note: 'Asking under your username.',
    view: () => ({ tab: 'close', stream: [card.ask('username'), card.agree(), card.liked()] }) },
  'ask-card-loggedout': { comp: 'Ask CARD LoggedOut', group: 'Asking', note: 'Logged out: log in or sign up to submit.',
    view: () => ({ tab: 'close', stream: [card.ask(),
      card.notice('warning', 'up', 'To submit your Question <button type="button" class="u-link" data-action="overlay-login">Log In</button> or <button type="button" class="u-link" data-action="overlay-signup">Sign Up</button>.'),
      card.agree(), card.liked()] }) },
  'ask-submitted': { comp: 'Ask Submitted', group: 'Asking', note: 'Question published.', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', stream: [card.question('bike'), card.notice('positive', 'down', 'Your questions was succesfully submitted!'), card.mine(false), card.agree()] }) },
  'ask-pending': { comp: 'Ask Pending', group: 'Asking', note: 'Question waiting for approval.', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', stream: [card.question('bike'), card.notice('pending', 'down', '<b>Question Submitted.</b> Pending Approval.'), card.mine(true), card.agree()] }) },

  'info-mini': { comp: 'Info Mini', group: 'Info & account', note: 'Click the i tab again to expand.', layer: 'drawer', layerView: { drawer: 'mini' } },
  'info': { comp: 'Info', group: 'Info & account', note: 'About this Urtak, with share links.', layer: 'drawer', layerView: { drawer: 'info' } },
  'info-faq': { comp: 'Info FAQ', group: 'Info & account', note: 'FAQ tab.', layer: 'drawer', layerView: { drawer: 'faq' } },
  'info-about': { comp: 'Info About', group: 'Info & account', note: 'About tab.', layer: 'drawer', layerView: { drawer: 'about' } },
  'info-log-in': { comp: 'Info Log In', group: 'Info & account', note: 'Log in from the info panel.', layer: 'drawer', layerView: { drawer: 'login' } },
  'info-sign-up': { comp: 'Info Sign Up', group: 'Info & account', note: 'Sign up from the info panel.', layer: 'drawer', layerView: { drawer: 'signup' } },
  'login-overlay': { comp: 'Login Overlay', group: 'Info & account', note: 'Log in lightbox.', layer: 'overlay', layerView: { overlay: 'login' } },
  'signup-overlay': { comp: 'SignUp Overlay', group: 'Info & account', note: 'Sign up lightbox.', layer: 'overlay', layerView: { overlay: 'signup' } },

  'fb-share-overlay': { comp: 'FB Share Overlay', group: 'Overlays & errors', note: 'Share your response on Facebook.', layer: 'overlay', layerView: { overlay: 'facebook' } },
  'tweet-overlay': { comp: 'Tweet Overlay', group: 'Overlays & errors', note: 'Tweet this Urtak. The counter is live.', layer: 'overlay', layerView: { overlay: 'tweet' } },
  'cookie-expired': { comp: 'Cookie Expired', group: 'Overlays & errors', note: 'Session expired.', layer: 'overlay', layerView: { overlay: 'expired' } },
  'cookie-security': { comp: 'Cookie Security', group: 'Overlays & errors', note: 'Third-party cookies blocked.',
    view: () => ({ loading: true, overlay: 'security' }) },

  'sponsored': { comp: 'Sponsored', group: 'Skins & variants', note: 'Sponsored question over a brand background (placeholder gradient).', next: 'happy-ending', key: 'thirsty',
    view: () => ({ theme: 'sponsored', tab: 'ask', stream: [card.question('thirsty', { sponsor: 'Coca Cola' }), card.agree({ display: 'pie', yes: 30, social: 'off', by: 'By The Daily Beast' }), card.liked()] }) },
  'custom01': { comp: 'Custom01', group: 'Skins & variants', note: 'Theme: blue gradient (token swap only).', next: 'happy-ending', key: 'bike',
    view: () => ({ theme: 'blue', tab: 'ask', stream: thirdQ() }) },
  'custom02': { comp: 'Custom02', group: 'Skins & variants', note: 'Theme: wood, approximated with CSS gradients.', next: 'happy-ending', key: 'bike',
    view: () => ({ theme: 'wood', tab: 'ask', stream: thirdQ() }) },
};

const COUNTERS = { a: 'grey bar', b: 'thin bar', c: '“3/12”', d: '“3 of 12”', e: '“9 left”', f: '“9 questions”', g: 'dotted strip', h: 'tick strip' };
for (const [k, desc] of Object.entries(COUNTERS)) {
  STATES['third-q-count-' + k] = { comp: 'Third Q Count ' + k.toUpperCase(), group: 'Skins & variants',
    note: 'Progress counter, top-left: ' + desc + '.', next: 'happy-ending', key: 'bike',
    view: () => ({ tab: 'ask', counter: k, stream: thirdQ() }) };
}

const ORDER = Object.keys(STATES);

// ---- Runtime -----------------------------------------------------------------

const $ = (s) => document.querySelector(s);
const root = $('#urtak');
let current = null, base = 'third-q', trail = [], loadTimer;

function viewFor(id) {
  const s = STATES[id];
  if (!s.layer) return s.view();
  const under = STATES[base].view();
  // An overlay opened from the info drawer keeps the drawer underneath it.
  const below = trail[trail.length - 1];
  const drawer = s.layer === 'overlay' && below && STATES[below.id].layer === 'drawer' ? STATES[below.id].layerView : {};
  return { ...under, scroll: 0, ...drawer, ...s.layerView };
}

function go(id, { push = true, auto = false } = {}) {
  if (!STATES[id]) return;
  clearTimeout(loadTimer);
  if (push && current && current !== id) trail.push({ id: current, base });
  current = id;
  if (!STATES[id].layer) base = id;
  draw();
  if (id === 'loading' && auto) loadTimer = setTimeout(() => go('first-q'), 1600);
}

function draw() {
  const s = STATES[current];
  const view = viewFor(current);
  if (!view.drawer && !view.loading) view.drawer = 'closed';
  ctx.scroll = view.scroll || 0;
  Urtak.render(root, view);
  if (ctx.starred) root.querySelectorAll('.u-social__btn--star').forEach((b) => b.classList.add('is-on'));

  $('#caption .comp').textContent = s.comp;
  $('#caption .note').textContent = s.note;
  for (const a of document.querySelectorAll('#states a')) a.classList.toggle('current', a.dataset.id === current);
  $('#back').disabled = trail.length === 0;
  history.replaceState(null, '', '#' + current);
  syncComp();
}

function goBack() {
  const prev = trail.pop();
  if (!prev) return;
  base = prev.base;
  go(prev.id, { push: false });
}

function closeLayer() {
  // Leave the drawer/overlay and return to the card state underneath.
  while (trail.length && STATES[trail[trail.length - 1].id].layer) trail.pop();
  go(base, { push: false });
}

function restart() {
  trail = []; current = null; base = 'third-q';
  Object.assign(ctx, { answers: {}, askText: null, askAnswer: 'yes', askWaiting: false, flagged: false, flagPrompt: false, starred: false });
  go('loading', { push: false, auto: true });
}

function submitAsk(value) {
  const input = root.querySelector('[data-ask-input]');
  if (input) ctx.askText = input.value;
  ctx.askAnswer = value === 'no' ? 'no' : 'yes';
  const s = STATES[current];
  if (s.submitTo) return go(s.submitTo);
  if (ctx.loggedIn) return go('ask-submitted');
  ctx.askWaiting = true;
  go('ask-card-loggedout');
}

function logIn() {
  ctx.loggedIn = true; syncLogin(); toast('Logged in');
  if (ctx.askWaiting) { ctx.askWaiting = false; trail = trail.filter((t) => !STATES[t.id].layer); go('ask-pending'); }
  else closeLayer();
}

const NO_COMP = 'This screen isn’t in the comps';

const ACTIONS = {
  'answer': (v) => {
    const s = STATES[current];
    if (s.key) ctx.answers[s.key] = v;
    ctx.flagPrompt = false;
    go(s.next || 'happy-ending');
  },
  'ask-open': () => { ctx.askText = null; go('ask-card'); },
  'ask-cancel': () => {
    const s = STATES[current];
    if (s.cancelTo) return go(s.cancelTo);
    const prev = [...trail].reverse().find((t) => !STATES[t.id].layer && !t.id.startsWith('ask-card'));
    go(prev ? prev.id : 'third-q');
  },
  'ask-submit': submitAsk,
  'show-username': () => go('ask-card-username'),
  'hide-username': () => go('ask-card'),
  'remove-question': () => { toast('Question removed'); go('third-q'); },

  'info-tab': () => go('info-mini'),
  'info-expand': () => go('info'),
  'info-collapse': () => go('info-mini'),
  'info-close': closeLayer,
  'drawer-section': (v) => go(v === 'faq' ? 'info-faq' : v === 'about' ? 'info-about' : 'info'),
  'drawer-login': () => go('info-log-in'),
  'drawer-signup': () => go('info-sign-up'),
  'back': () => (trail.length ? goBack() : go('info')),

  'overlay-login': () => go('login-overlay'),
  'overlay-signup': () => go('signup-overlay'),
  'overlay-close': () => (STATES[current].layer === 'overlay' && trail.length ? goBack() : closeLayer()),
  'auth': logIn,
  'share-tweet': () => go('tweet-overlay'),
  'share-facebook': () => go('fb-share-overlay'),
  'share-send': (v) => { toast(v || 'Shared'); trail.length ? goBack() : closeLayer(); },
  'reload': restart,
  'open-window': () => { toast('Would open Urtak in a new window'); restart(); },

  'flag': () => { ctx.flagPrompt = true; draw(); },
  'flag-confirm': () => { ctx.flagged = true; ctx.flagPrompt = false; toast('Question flagged'); draw(); },
  'star': () => { ctx.starred = !ctx.starred; draw(); },
  'copy-link': () => { navigator.clipboard?.writeText('http://urtak.is/IrXRpK').catch(() => {}); toast('Short link copied'); },
  'explore': () => toast(NO_COMP), 'get-urtak': () => toast(NO_COMP), 'forgot': () => toast(NO_COMP),
  'terms': () => toast(NO_COMP), 'faq': () => toast(NO_COMP),
};

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !root.contains(el) || el.disabled || el.closest('[inert]')) return;
  e.preventDefault();
  let action = el.dataset.action;
  if (action === 'flag' && el.classList.contains('u-flag__yes')) action = 'flag-confirm';
  ACTIONS[action]?.(el.dataset.value);
});
root.addEventListener('submit', (e) => e.preventDefault());

root.addEventListener('focusin', (e) => {
  if (!e.target.matches('[data-ask-input]')) return;
  const to = STATES[current].focusTo;
  if (!to) return;
  ctx.askText = '';
  go(to);
  root.querySelector('[data-ask-input]')?.focus();
});
root.addEventListener('input', (e) => {
  if (e.target.matches('[data-ask-input]')) ctx.askText = e.target.value;
  if (e.target.matches('[data-tweet]')) root.querySelector('[data-tweet-count]').textContent = 140 - e.target.value.length;
});

// Real scrolling inside the widget.
let scrollTimer;
root.addEventListener('wheel', (e) => {
  if (root.querySelector('.u-overlay, .u-drawer[data-pos="open"], .u-loading')) return;
  if (e.target.closest('textarea')) return;
  e.preventDefault();
  ctx.scroll = Urtak.syncScroll(root, ctx.scroll + e.deltaY * 0.5);
  root.classList.add('is-scrolling');
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => root.classList.toggle('is-scrolling', current === 'scroll'), 900);
}, { passive: false });

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---- Shell -------------------------------------------------------------------

function store(key, val) { try { localStorage.setItem('urtak-proto-' + key, val); } catch (e) {} }
function recall(key) { try { return localStorage.getItem('urtak-proto-' + key); } catch (e) { return null; } }

function syncLogin() { $('#login').checked = ctx.loggedIn; store('loggedIn', ctx.loggedIn ? '1' : '0'); }

// The original comp, shown next to the coded widget for comparison only (press C).
function syncComp() {
  const img = $('#comp img');
  img.src = '../design/comps/' + current + '.png';
  img.alt = 'Photoshop comp: ' + STATES[current].comp;
}

const groups = {};
for (const id of ORDER) (groups[STATES[id].group] ||= []).push(id);
for (const [name, ids] of Object.entries(groups)) {
  const sec = document.createElement('section');
  sec.innerHTML = `<h2>${name}</h2><ul>${ids.map((id) => `<li><a href="#${id}" data-id="${id}">${STATES[id].comp}</a></li>`).join('')}</ul>`;
  $('#states').appendChild(sec);
}
$('#states').addEventListener('click', (e) => {
  const a = e.target.closest('a[data-id]');
  if (!a) return;
  e.preventDefault();
  ctx.askText = null; ctx.flagPrompt = false;
  go(a.dataset.id);
});

$('#back').addEventListener('click', goBack);
$('#restart').addEventListener('click', restart);
$('#login').addEventListener('change', (e) => { ctx.loggedIn = e.target.checked; syncLogin(); });
$('#outline').addEventListener('change', (e) => { document.body.classList.toggle('show-actions', e.target.checked); store('outline', e.target.checked ? '1' : '0'); });
$('#compare').addEventListener('change', (e) => { document.body.classList.toggle('show-comp', e.target.checked); store('compare', e.target.checked ? '1' : '0'); });
for (const r of document.querySelectorAll('input[name=zoom]')) {
  r.addEventListener('change', () => { document.body.dataset.zoom = r.value; store('zoom', r.value); });
}

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  const i = ORDER.indexOf(current);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(ORDER[(i + 1) % ORDER.length]); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(ORDER[(i - 1 + ORDER.length) % ORDER.length]); }
  else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); goBack(); }
  else if (e.key === 'r' || e.key === 'R') restart();
  else if (e.key === 'c' || e.key === 'C') $('#compare').click();
});

const z = recall('zoom');
if (z) { document.body.dataset.zoom = z; const r = $(`input[name=zoom][value="${z}"]`); if (r) r.checked = true; }
if (recall('outline') === '1') { $('#outline').checked = true; document.body.classList.add('show-actions'); }
if (recall('compare') === '1') { $('#compare').checked = true; document.body.classList.add('show-comp'); }
ctx.loggedIn = recall('loggedIn') === '1'; syncLogin();

const start = location.hash.slice(1);
if (STATES[start]) go(start, { push: false }); else restart();
