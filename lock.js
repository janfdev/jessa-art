/* PIN lock for private case studies. A soft gate: visitors get a taste (everything up to the
   frame with id="about"), the rest blurs and the page stops scrolling until the PIN is entered.
   Unlocking is remembered on this device for every locked page. */
(() => {
  const PIN_HASH = 'c18ad048ccf05b104e1e77623f5511003dafc3e16f6a93234c691dc86547c597';   // sha-256 of 'jessa-acv:' + PIN (set privately with ~/.jessa-deploy/setpin.py)
  const KEY = 'acv-unlock';
  const canvas = document.querySelector('.canvas'), taste = document.getElementById('about');
  if (!canvas || !taste) return;
  const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  try { if (localStorage.getItem(KEY) === PIN_HASH) return; } catch (_) {}

  // everything after the taste gets blurred
  const after = [];
  for (let el = taste.nextElementSibling; el; el = el.nextElementSibling) if (!el.matches('.shared, .play, .cur, script')) after.push(el);
  after.forEach(el => el.classList.add('lk'));
  document.body.classList.add('locked');

  const LOCK = '<path class="shackle" d="M18 34 V22 a14 14 0 0 1 28 0 V34"/><rect class="body" x="7" y="32" width="50" height="38" rx="14"/>';
  const bar = document.createElement('div'); bar.className = 'lockbar wob';
  bar.innerHTML = `<svg viewBox="0 0 64 72" aria-hidden="true">${LOCK}<circle class="hole" cx="32" cy="50" r="5"/></svg><span>This is locked. Enter the PIN to view.</span><button type="button">Enter PIN</button>`;
  const modal = document.createElement('div'); modal.className = 'lockmodal';
  const pad = document.createElement('div'); pad.className = 'lockpad wob'; pad.setAttribute('role', 'dialog'); pad.setAttribute('aria-label', 'Enter the PIN to see the rest');
  const COLORS = ['var(--blush-2)', 'var(--butter)', 'var(--mint)', 'var(--sky)', 'var(--lilac)', 'var(--peach)'];
  const key = (n, i) => `<button type="button" data-k="${n}" style="--k:${COLORS[i % COLORS.length]};--r:${((i * 7) % 9) - 4}deg" aria-label="${n}">${n}</button>`;
  pad.innerHTML = `
    <button type="button" class="lp-x" aria-label="Close">×</button>
    <svg class="lp-lock" viewBox="0 0 64 72" aria-hidden="true"><path class="shackle" d="M18 34 V22 a14 14 0 0 1 28 0 V34"/><rect class="body" x="7" y="32" width="50" height="38" rx="14"/><path class="shine" d="M15 44 q1 -5 6 -6"/><circle class="hole" cx="32" cy="49" r="4.5"/><path class="hole" d="M30 51 h4 l1.5 9 h-7 z"/></svg>
    <h2 class="lp-h">Psst. This one's locked.</h2>
    <p class="lp-sub">Enter PIN to view</p>
    <div class="lp-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="lp-keys">${[1,2,3,4,5,6,7,8,9].map(key).join('')}<button type="button" class="fn" data-k="clear">clear</button>${key(0, 9)}<button type="button" class="fn" data-k="back" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6z"/><path d="M12.5 10l4 4m0-4l-4 4"/></svg></button></div>
    <p class="lp-msg" aria-live="polite"></p>
    <a class="lp-ask" href="app.html#hi">Need the PIN? Ask me</a>`;
  modal.appendChild(pad); document.body.append(bar, modal);
  [bar, modal].forEach(el => ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'].forEach(t => el.addEventListener(t, e => e.stopPropagation())));   // keep the drawing tools off the lock
  const open = () => { modal.classList.add('on'); code = ''; paint(); msg.textContent = ''; if (timeout()) pad.classList.add('was-wait'); setTimeout(() => pad.querySelector('[data-k="1"]').focus({ preventScroll: true }), 50); };
  const close = () => modal.classList.remove('on');
  bar.querySelector('button').addEventListener('click', open);
  pad.querySelector('.lp-x').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // where the taste ends: the pad sits there, the page stops just under it
  function layout() {
    const c = canvas.getBoundingClientRect(), t = taste.getBoundingClientRect();
    const cut = t.bottom - c.top + 30;
    canvas.style.setProperty('--lock-cut', cut + 'px');
    canvas.style.setProperty('--lock-h', (cut + 460) + 'px');   // a blurred peek, then the page ends
  }
  layout(); addEventListener('resize', layout); new ResizeObserver(layout).observe(taste);
  // reaching the end of the peek nudges the button
  addEventListener('scroll', () => { if (document.body.classList.contains('locked') && innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && !bar.classList.contains('nudge')) { bar.classList.add('nudge'); setTimeout(() => bar.classList.remove('nudge'), 700); } }, { passive: true });
  setTimeout(layout, 600); setTimeout(layout, 2000);

  // jump links into locked sections bring you to the pad instead
  document.addEventListener('click', e => {
    if (!document.body.classList.contains('locked')) return;
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.querySelector(a.getAttribute('href')); if (!t || !t.closest('.lk')) return;
    e.preventDefault(); e.stopPropagation();
    open();
  }, true);

  let code = '', busy = false;
  // 3 wrong tries = a timeout. It grows each time (1 min, 5 min, 30 min) and survives a reload.
  const TRIES = 'acv-tries', WAITS = [60, 300, 1800];
  const getT = () => { try { return JSON.parse(localStorage.getItem(TRIES)) || { n: 0, until: 0, level: 0 }; } catch (_) { return { n: 0, until: 0, level: 0 }; } };
  const setT = v => { try { localStorage.setItem(TRIES, JSON.stringify(v)); } catch (_) {} };
  let tickT = 0;
  function timeout() {
    const left = Math.ceil((getT().until - Date.now()) / 1000);
    pad.classList.toggle('wait', left > 0);
    if (left > 0) { msg.textContent = `Too many tries. Try again in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; ask.classList.add('nudge'); clearTimeout(tickT); tickT = setTimeout(timeout, 1000); return true; }
    if (pad.classList.contains('was-wait')) { msg.textContent = ''; pad.classList.remove('was-wait'); }
    return false;
  }
  const dots = [...pad.querySelectorAll('.lp-dots i')], msg = pad.querySelector('.lp-msg'), ask = pad.querySelector('.lp-ask');
  const NOPE = ['Nope! Try again.', 'Not quite. One more try.'];
  const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < code.length));
  function wiggle() { pad.classList.remove('shake'); void pad.offsetWidth; pad.classList.add('shake'); }
  function sparks(el, n = 6) {
    const p = pad.getBoundingClientRect(), r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'lp-pop'; const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 26;
      s.style.left = (r.left - p.left + r.width / 2 - 5) + 'px'; s.style.top = (r.top - p.top + r.height / 2 - 5) + 'px';
      s.style.background = COLORS[(Math.random() * COLORS.length) | 0].replace('var(--blush-2)', 'var(--pink)');
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      pad.appendChild(s); setTimeout(() => s.remove(), 750);
    }
  }
  async function press(k, btn) {
    if (busy) return;
    if (timeout()) { pad.classList.add('was-wait'); wiggle(); return; }
    if (btn) { btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 140); sparks(btn, 5); }
    msg.textContent = ''; pad.classList.remove('bad');
    if (k === 'clear') { code = ''; paint(); return; }
    if (k === 'back') { code = code.slice(0, -1); paint(); return; }
    if (code.length >= 4) return;
    code += k; paint();
    if (code.length < 4) return;
    busy = true;
    const h = await sha('jessa-acv:' + code);
    await new Promise(r => setTimeout(r, 180));
    if (h === PIN_HASH) { unlock(h); return; }
    const T = getT(); T.n++;
    if (T.n >= 3) { T.until = Date.now() + WAITS[Math.min(T.level, WAITS.length - 1)] * 1000; T.level++; T.n = 0; }
    setT(T); pad.classList.add('bad'); wiggle();
    if (!timeout()) msg.textContent = NOPE[Math.min(T.n - 1, NOPE.length - 1)];
    else pad.classList.add('was-wait');
    setTimeout(() => { code = ''; paint(); pad.classList.remove('bad'); busy = false; }, 650);
  }
  function unlock(h) {
    try { localStorage.setItem(KEY, h); localStorage.removeItem(TRIES); } catch (_) {}
    pad.classList.add('good', 'open'); msg.textContent = 'You’re in!'; bar.classList.add('gone'); modal.classList.add('done');
    for (let i = 0; i < 4; i++) setTimeout(() => sparks(pad.querySelector('.lp-lock'), 10), i * 120);
    setTimeout(() => {
      document.body.classList.add('unlocking');
      canvas.style.removeProperty('--lock-h'); document.body.classList.remove('locked');
      setTimeout(() => { after.forEach(el => el.classList.remove('lk')); modal.remove(); bar.remove(); document.body.classList.remove('unlocking'); dispatchEvent(new Event('scroll')); }, 1000);
    }, 900);
  }
  pad.querySelector('.lp-keys').addEventListener('click', e => { const b = e.target.closest('button'); if (b) press(b.dataset.k, b); });
  const onKey = e => {
    if (!modal.classList.contains('on') || e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (e.key === 'Escape' && !code) { close(); return; }
    if (/^[0-9]$/.test(e.key)) press(e.key, pad.querySelector(`[data-k="${e.key}"]`));
    else if (e.key === 'Backspace') press('back', pad.querySelector('[data-k="back"]'));
    else if (e.key === 'Escape') press('clear');
  };
  addEventListener('keydown', onKey); modal.addEventListener('keydown', onKey);   // the modal keeps keys from the drawing tools, so it listens itself too
})();
