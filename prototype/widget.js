/* Urtak widget renderer.
 * render(root, view) draws one widget state from a plain "view" object:
 *   {
 *     theme, loading, logo, counter,            // frame
 *     tab: 'ask' | 'close' | 'none', tabHover,   // top-right tab
 *     stream: [item, ...], scroll,               // card stream (px scrolled)
 *     drawer: 'closed' | 'mini' | 'info' | 'faq' | 'about' | 'login' | 'signup' | 'none',
 *     overlay: null | 'login' | 'signup' | 'facebook' | 'tweet' | 'expired' | 'security',
 *   }
 * Interactive elements carry data-action (and data-value); app.js listens for them. */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id, cls = '') => `<svg class="u-icon u-icon--${id} ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const btn = (action, label, cls, value, extra = '') =>
    `<button type="button" class="${cls}" data-action="${action}"${value != null ? ` data-value="${esc(value)}"` : ''}${extra}>${label}</button>`;

  // ------------------------------------------------------------ Card stream

  function answers(kind, { dim = false } = {}) {
    // Question cards: Yes / No / Don't Care. Ask cards: Yes / No / Cancel.
    const asking = kind === 'ask';
    const act = asking ? 'ask-submit' : 'answer';
    return `<div class="u-answers${dim ? ' is-dim' : ''}">
      ${btn(act, 'Yes', 'u-btn u-btn--yes', 'yes', dim ? ' disabled' : '')}
      ${btn(act, 'No', 'u-btn u-btn--no', 'no', dim ? ' disabled' : '')}
      ${asking ? btn('ask-cancel', 'Cancel', 'u-btn u-btn--neutral', null, dim ? ' disabled' : '') : btn('answer', 'Don’t Care', 'u-btn u-btn--neutral', 'dontcare')}
    </div>`;
  }

  function questionCard(it) {
    const flag = it.flag === 'prompt'
      ? `<p class="u-flag is-on">${icon('flag')}<span>Flag this question.? ${btn('flag', 'YES', 'u-flag__yes')}</span></p>`
      : `<p class="u-flag">${btn('flag', icon('flag'), 'u-flag__toggle', null, ' aria-label="Flag this question"')}</p>`;
    const sponsor = it.sponsor
      ? `<p class="u-q__sponsor">${icon('sponsored')}Sponsored Question by ${esc(it.sponsor)}</p>` : flag;
    return `<article class="u-card u-q${it.sponsor ? ' u-q--sponsored' : ''}">
      <p class="u-q__text">${esc(it.q)}</p>
      ${sponsor}
      ${answers('question')}
    </article>`;
  }

  function askCard(it) {
    const empty = it.mode === 'empty' || it.mode === 'typing';
    const byline = empty ? '' : it.mode === 'username'
      ? `<p class="u-byline">Asked by a ${esc(it.user || 'smombartzverylong')} <span class="u-sep">|</span> ${btn('hide-username', 'Remove', 'u-link u-link--danger')}</p>`
      : `<p class="u-byline">Asked by a reader <span class="u-sep">|</span> ${btn('show-username', 'Show Username', 'u-link u-link--positive')}</p>`;
    return `<article class="u-card u-ask${empty ? ' u-ask--empty' : ''}">
      <label class="u-ask__field">
        <span class="u-visually-hidden">Your yes or no question</span>
        <textarea class="u-ask__input" data-ask-input rows="3" maxlength="80"
          placeholder="Ask the community a Yes or No Question">${esc(it.text || '')}</textarea>
      </label>
      ${byline}
      ${answers('ask', { dim: it.mode === 'empty' })}
    </article>`;
  }

  function pie(it, size) {
    // Majority fills the circle; the minority slice runs counter-clockwise from 12 o'clock
    // and is nudged 2px left, as in the comps.
    const yes = it.yes ?? 50;
    const majority = yes >= 50 ? 'yes' : 'no';
    const minority = Math.min(yes, 100 - yes);
    return `<div class="u-pie u-pie--${majority}${it.display === 'pending' ? ' is-pending' : ''}"
        style="--u-slice:${minority}${size ? `;--urtak-pie-size:${size}px` : ''}" role="img"
        aria-label="${yes}% yes, ${100 - yes}% no">
      <span class="u-pie__base"></span>${minority > 0 ? '<span class="u-pie__slice"></span>' : ''}
      ${it.display === 'pending' ? icon('hourglass', 'u-pie__pending') : ''}
    </div>`;
  }

  function resultCard(it) {
    const ans = it.answer === 'no' ? 'no' : 'yes';
    const numbers = it.display === 'numbers' ? `<dl class="u-numbers">
        <dt class="is-yes">Yes</dt><dd class="is-yes">${it.yes}%</dd>
        <dt class="is-no">No</dt><dd class="is-no">${100 - it.yes}%</dd>
        <dt>Votes</dt><dd>${it.votes}</dd>
        <dt>Care</dt><dd>${it.care}%</dd>
      </dl>` : '';
    const byline = it.remove
      ? `${esc(it.by)} <span class="u-sep">|</span> ${btn('remove-question', 'Remove', 'u-link u-link--danger')}`
      : esc(it.by);
    return `<article class="u-card u-result u-result--social-${it.social || 'off'}">
      <p class="u-result__text">${esc(it.q)}&nbsp; <b class="u-answer u-answer--${ans}">${ans.toUpperCase()}</b></p>
      <div class="u-result__chart">${pie(it)}${numbers}</div>
      <p class="u-social">
        ${btn('star', icon('star'), 'u-social__btn u-social__btn--star', null, ' aria-label="Favourite"')}
        ${btn('share-tweet', icon('twitter'), 'u-social__btn u-social__btn--twitter', null, ' aria-label="Tweet"')}
        ${btn('share-facebook', icon('facebook'), 'u-social__btn u-social__btn--facebook', null, ' aria-label="Share on Facebook"')}
        <span class="u-byline">${byline}</span>
      </p>
    </article>`;
  }

  function notice(it) {
    const plus = it.plus ? `<span class="u-plus">+</span>` : '';
    return `<div class="u-notice u-notice--${it.tone} u-notice--${it.pointer || 'none'}${it.tall ? ' u-notice--tall' : ''}" role="status">
      <p>${it.html}</p>${plus}
    </div>`;
  }

  const prompt = () => btn('ask-open', `<span>Ask your own Yes or No question.</span><span class="u-plus">+</span>`, 'u-prompt');

  const ITEM = { question: questionCard, ask: askCard, result: resultCard, notice, prompt };

  // ------------------------------------------------------------ Chrome

  const COUNTERS = {
    a: `<span class="u-counter__bar u-counter__bar--tall"><span style="width:var(--u-progress)"></span></span>`,
    b: `<span class="u-counter__bar"><span style="width:var(--u-progress)"></span></span>`,
    c: `<span class="u-counter__text">3/12</span>`,
    d: `<span class="u-counter__text u-counter__text--small">3 of 12</span>`,
    e: `<span class="u-counter__text">9 left</span>`,
    f: `<span class="u-counter__text">9 questions</span>`,
    g: `<span class="u-counter__dots"></span>`,
    h: `<span class="u-counter__ticks"></span>`,
  };

  function tab(view) {
    if (view.tab === 'ask') return btn('ask-open', 'Ask', `u-tab u-tab--ask${view.tabHover ? ' is-hover' : ''}`);
    if (view.tab === 'close') return btn('ask-cancel', icon('close-x'), 'u-tab u-tab--close', null, ' aria-label="Close"');
    return '';
  }

  const STATS = `<span class="u-stats">1,720,304 Responses | 2364 Question</span>`;
  const AUTH_LINKS = (active) => `<span class="u-auth-links">
      ${active === 'login' ? '<b>Log In</b>' : btn('drawer-login', 'Log In', 'u-link')}
      <span class="u-sep-dark">|</span>
      ${active === 'signup' ? '<b>Sign Up</b>' : btn('drawer-signup', 'Sign Up', 'u-link')}
    </span>`;

  function drawerBody(mode) {
    if (mode === 'login' || mode === 'signup') {
      const login = mode === 'login';
      return `<div class="u-drawer__bar">
          ${btn('back', `${icon('chev-left')}Back`, 'u-back')}
          ${AUTH_LINKS(mode)}
        </div>
        <form class="u-form" data-form="auth" novalidate>
          <input class="u-field" type="email" placeholder="Email" autocomplete="email" aria-label="Email">
          <input class="u-field" type="password" placeholder="Password" autocomplete="${login ? 'current-password' : 'new-password'}" aria-label="Password">
          <button type="submit" class="u-form-btn u-form-btn--primary" data-action="auth">${login ? 'Log In' : 'Sign Up'}</button>
          ${login ? btn('forgot', 'Fogrot your Password?', 'u-link u-form__aside') : btn('terms', 'Please read our terms.', 'u-link u-form__aside')}
          <p class="u-form__divider"><span>${login ? 'Login with' : 'Sign Up with'}</span></p>
          <div class="u-form__social">
            ${btn('auth', `<span class="u-form-btn__icon">${icon('fb-f')}</span>Facebook`, 'u-form-btn u-form-btn--facebook')}
            ${btn('auth', `<span class="u-form-btn__icon">${icon('twitter-t')}</span>Twitter`, 'u-form-btn u-form-btn--twitter')}
          </div>
        </form>`;
    }
    const menu = ['info', 'faq', 'about'].map((m) => {
      const label = { info: 'Info', faq: 'FAQ', about: 'About' }[m];
      return m === mode ? `<b class="u-menu__item is-current">${label}</b>` : btn('drawer-section', label, 'u-menu__item', m);
    }).join('');
    let content = '';
    if (mode === 'info') content = `
      <p class="u-copy"><span class="u-copy__meta">Published on March 20th by Hollywood.com</span></p>
      <p class="u-copy">Description of this Urtak if one exists. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tempor augue id tellus condimentum sit amet congue velit tristique. Nam congue lobortis quam, non rhoncus …</p>
      <div class="u-share">
        <p class="u-share__label">Share this Urtak</p>
        ${btn('explore', 'Explore Results', 'u-link u-share__explore')}
        <div class="u-share__row">
          ${btn('share-tweet', icon('tw-circle'), 'u-share__btn u-share__btn--twitter', null, ' aria-label="Tweet this Urtak"')}
          ${btn('share-facebook', icon('fb-circle'), 'u-share__btn u-share__btn--facebook', null, ' aria-label="Share on Facebook"')}
          ${btn('copy-link', `<span class="u-share__chain">${icon('link')}</span><span class="u-share__url">urtak.is/IrXRpK</span>`, 'u-share__link')}
        </div>
      </div>`;
    if (mode === 'faq') content = `
      <p class="u-copy"><b>What is an Urtak?</b><br>Urtaks are made up of a scrolling series of yes or no questions that can be asked and answered by everyone who participates. Questions are asked in a random order and the results appear after each question is answered.</p>
      <ul class="u-faq">
        <li>${btn('faq', 'Who writes the questions?', 'u-link u-link--strong')}</li>
        <li>${btn('faq', 'Why “Don’t Care”?', 'u-link u-link--strong')}</li>
        <li>${btn('faq', 'Why can’t I see the question I asked?', 'u-link u-link--strong')}</li>
      </ul>`;
    if (mode === 'about') content = `
      <p class="u-copy"><b class="u-caps">Finding out what the world is thinking</b></p>
      <p class="u-copy">Urtak is collaborative polling—everyone can ask questions. It’s easy to engage a great number of people in a structured conversation that produces thousands of responses.</p>
      <div class="u-cta">
        ${btn('get-urtak', 'Get Urtak For Your Site', 'u-go u-go--large')}
        <p>Its free!</p>
      </div>`;
    return `<div class="u-drawer__bar">${STATS}${AUTH_LINKS()}</div>
      <nav class="u-menu" aria-label="Info sections">${menu}</nav>
      <div class="u-drawer__content">${content}</div>`;
  }

  function drawer(view) {
    const mode = view.drawer || 'closed';
    if (mode === 'none') return '';
    const pos = mode === 'closed' ? 'closed' : mode === 'mini' ? 'mini' : 'open';
    const tabAction = pos === 'closed' ? 'info-tab' : pos === 'mini' ? 'info-expand' : 'info-collapse';
    const body = pos === 'mini'
      ? `<div class="u-drawer__bar u-drawer__bar--mini">${STATS}${AUTH_LINKS()}</div>`
      : pos === 'open' ? drawerBody(mode) : '';
    return `${pos === 'open' ? '<div class="u-dimmer u-dimmer--drawer" data-action="info-close"></div>' : ''}
      <section class="u-drawer" data-pos="${pos}" aria-label="About this Urtak">
        ${btn(tabAction, '<span>i</span>', 'u-drawer__tab', null, ` aria-expanded="${pos !== 'closed'}" aria-label="Info"`)}
        ${pos === 'open' ? btn('info-close', icon('close-x'), 'u-drawer__close', null, ' aria-label="Close info"') : ''}
        <div class="u-drawer__panel">${body}</div>
      </section>`;
  }

  // ------------------------------------------------------------ Lightboxes

  const closeChip = btn('overlay-close', icon('close-x'), 'u-lightbox__close', null, ' aria-label="Close"');

  function authBox(kind) {
    const login = kind === 'login';
    return `<div class="u-lightbox u-lightbox--neutral u-lightbox--auth" role="dialog" aria-label="${login ? 'Login' : 'Sign Up'}">
      <p class="u-lightbox__title">${login ? 'Login' : 'Sign Up'}
        ${btn(login ? 'overlay-signup' : 'overlay-login', login ? 'Sign Up' : 'Login', 'u-link u-lightbox__switch')}
        ${login ? '' : '<span class="u-lightbox__hint">or Sign Up with:</span>'}
      </p>
      ${closeChip}
      <form class="u-lightbox__form" data-form="auth" novalidate>
        <label>Username <input class="u-input" type="text" autocomplete="username"></label>
        <label>Password <input class="u-input" type="password" autocomplete="${login ? 'current-password' : 'new-password'}"></label>
        <button type="submit" class="u-chip-btn u-chip-btn--go" data-action="auth">${login ? 'Login' : 'Get Started'}</button>
        ${login ? btn('forgot', 'Forgot your<br>password?', 'u-link u-lightbox__forgot') : ''}
      </form>
      <div class="u-lightbox__social">
        ${btn('auth', `${icon('fb-f')}<span>Facebook</span>`, 'u-chip-btn u-chip-btn--facebook')}
        ${btn('auth', `${icon('twitter-t')}<span>Twitter</span>`, 'u-chip-btn u-chip-btn--twitter')}
      </div>
    </div>`;
  }

  function overlay(view) {
    const o = view.overlay;
    if (!o) return '';
    let box = '';
    if (o === 'login' || o === 'signup') box = authBox(o);
    if (o === 'facebook') box = `<div class="u-lightbox u-lightbox--facebook u-lightbox--share" role="dialog" aria-label="Share this Response on Facebook">
        <p class="u-lightbox__title">Share this Response on Facebook</p>${closeChip}
        <div class="u-share-card">${pie({ yes: 50 }, 50)}<p><b>Do you believe in magic?</b><br>50% said Yes on in Daily Beast.</p></div>
        ${btn('share-send', 'Share', 'u-chip-btn u-chip-btn--facebook u-lightbox__action', 'Shared to Facebook')}
      </div>`;
    if (o === 'tweet') box = `<div class="u-lightbox u-lightbox--twitter" role="dialog" aria-label="Tweet this Urtak">
        <p class="u-lightbox__title">Tweet this Urtak</p>${closeChip}
        <textarea class="u-tweet" data-tweet maxlength="140" aria-label="Tweet text">@Urtak: Do you believe in magic. Ask and answer questions. http://urtak.is/HEk7</textarea>
        <span class="u-tweet__count" data-tweet-count>124</span>
        ${btn('share-send', 'Tweet', 'u-chip-btn u-chip-btn--twitter u-lightbox__action', 'Tweet sent')}
      </div>`;
    if (o === 'expired') box = `<div class="u-lightbox u-lightbox--positive u-lightbox--notice u-lightbox--short" role="alertdialog" aria-label="Your Session Expired">
        <p class="u-lightbox__title">Your Session Expired</p>
        <p class="u-lightbox__body">To continue simply relaod this Urtak.</p>
        ${btn('reload', 'Reload', 'u-go')}
      </div>`;
    if (o === 'security') box = `<div class="u-lightbox u-lightbox--positive u-lightbox--notice" role="alertdialog" aria-label="Urtak is unable to load">
        <p class="u-lightbox__title">Urtak is unable to load</p>
        <p class="u-lightbox__body">Your browser’s security settings seem to prevent Urtak from loading on this site. You can use Urtak in a seperate window.</p>
        ${btn('open-window', 'Open', 'u-go')}
      </div>`;
    const dismiss = o === 'expired' || o === 'security' ? '' : ' data-action="overlay-close"';
    return `<div class="u-overlay"><div class="u-dimmer"${dismiss}></div>${box}</div>`;
  }

  const LOGO = `<span class="u-logo" role="img" aria-label="Urtak">${icon('logo')}</span>`;

  function loading() {
    return `<div class="u-loading" role="status" aria-label="Loading">
      <span class="u-loader"><i></i><i></i><i></i><i></i></span>${LOGO}
    </div>`;
  }

  // ------------------------------------------------------------ Render

  function render(root, view) {
    const items = (view.stream || []).map((it) => ITEM[it.type](it)).join('');
    root.dataset.urtakTheme = view.theme || '';
    root.classList.toggle('is-scrolling', !!view.scroll);
    root.innerHTML = `
      <div class="u-viewport">
        <span class="u-hint u-hint--up" aria-hidden="true">${icon('up')}</span>
        <span class="u-hint u-hint--down" aria-hidden="true">${icon('down')}</span>
        ${view.logo ? LOGO : ''}
        <div class="u-stream" data-stream>${items}</div>
        <span class="u-scrollbar" aria-hidden="true"><span class="u-scrollbar__thumb"></span></span>
      </div>
      ${view.counter ? `<div class="u-counter" style="--u-progress:${(3 / 12) * 100}%">${COUNTERS[view.counter]}</div>` : ''}
      ${view.loading ? '' : tab(view)}
      <span class="u-curl" aria-hidden="true"></span>
      ${view.loading ? '' : drawer(view)}
      ${view.loading ? loading() : ''}
      ${overlay(view)}`;
    // Whatever sits under an open drawer or lightbox is out of reach for keyboard and pointer.
    const covered = view.overlay ? '.u-viewport, .u-tab, .u-drawer, .u-loading' : view.drawer && !['closed', 'mini', 'none'].includes(view.drawer) ? '.u-viewport, .u-tab' : null;
    if (covered) root.querySelectorAll(covered).forEach((el) => { el.inert = true; });
    syncScroll(root, view.scroll || 0);
  }

  // Real scrolling: the stream moves inside the viewport; hints and scrollbar follow.
  function maxScroll(root) {
    const vp = root.querySelector('.u-viewport'), st = root.querySelector('[data-stream]');
    return vp && st ? Math.max(0, st.scrollHeight - vp.clientHeight) : 0;
  }
  function syncScroll(root, y) {
    const st = root.querySelector('[data-stream]');
    if (!st) return 0;
    const max = maxScroll(root);
    y = Math.max(0, Math.min(max, y));
    st.style.transform = `translateY(${-y}px)`;
    root.style.setProperty('--u-scroll-ratio', max ? y / max : 0);
    root.classList.toggle('can-scroll-up', y > 0);
    root.classList.toggle('can-scroll-down', y < max - 1);
    return y;
  }

  window.Urtak = {
    render, syncScroll, maxScroll,
    // Building blocks, reused by the live widget (../widget/live.js).
    parts: { esc, icon, btn, answers, pie, notice, askCard, prompt, tab, drawer, overlay, loading, COUNTERS, LOGO },
  };
})();
