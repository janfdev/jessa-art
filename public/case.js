/* Case study pages: the same chrome and cursor as the studio, with frames
   that Jessa draws as they scroll into view. A click finishes the page. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const phone = matchMedia('(max-width: 860px)').matches;
  /* Pages this visitor has already seen pop in instead of being drawn again. Remembered per tab
     (sessionStorage 'jw-seen'); a browser refresh clears it, so a refresh always gets the full show. */
  const SEEN = 'jw-seen';
  if (window.top === window && (performance.getEntriesByType('navigation')[0] || {}).type === 'reload') { try { sessionStorage.removeItem(SEEN); } catch (_) {} }
  const visit = k => { try { const s = JSON.parse(sessionStorage.getItem(SEEN) || '[]'); if (s.includes(k)) return true; s.push(k); sessionStorage.setItem(SEEN, JSON.stringify(s)); } catch (_) {} return false; };
  const again = visit(location.pathname.split('/').pop() || 'index.html');
  if (again) document.body.classList.add('popin');
  const base = phone || again;   // phones and already-seen pages never draw
  let skip = base, fast = false;   // skip: visitor asked to finish (always on phones / seen pages); fast: catching up to where they scrolled
  const wait = ms => new Promise(r => setTimeout(r, (skip || fast) ? 0 : ms));
  const tween = (ms, fn) => new Promise(res => {
    if (reduced || skip || fast) { fn(1); return res(); }
    const t0 = performance.now();
    const step = now => { if (skip || fast) { fn(1); return res(); } const t = Math.min(1, (now - t0) / ms); fn(t); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });

  class Cursor {
    constructor(el) {
      this.el = el; this.bub = $('.bub', el);
      this.x = innerWidth * .5; this.y = innerHeight * .4; this.px = this.x; this.py = this.y; this.ox = 0; this.oy = 0;
      this.place();
      const loop = () => {
        const vx = this.x - this.px, vy = this.y - this.py; this.px = this.x; this.py = this.y;
        this.ox += (Math.max(-16, Math.min(16, -vx * .55)) - this.ox) * .18;
        this.oy += (Math.max(-16, Math.min(16, -vy * .55)) - this.oy) * .18;
        const bob = Math.sin(performance.now() / 1000 * 1.6 + (this.seed || 0)) * 1.4;
        const sq = 1 + Math.min(.12, Math.hypot(this.ox, this.oy) / 90);
        this.bub.style.transform = `translate(${this.ox}px, ${this.oy + bob}px) rotate(${this.ox * .5}deg) scale(${sq}, ${2 - sq})`;
        requestAnimationFrame(loop);
      };
      if (!reduced) requestAnimationFrame(loop);
    }
    place() { this.el.style.transform = `translate(${this.x}px, ${this.y}px)`; }
    set(x, y) { this.x = x; this.y = y; this.place(); }
    show() { this.el.classList.add('show'); }
    hide() { this.el.classList.remove('show'); }
    moveTo(x, y, ms = 600) {
      const sx = this.x, sy = this.y, wob = rnd(-1, 1) * 18;
      return tween(ms, t => { const e = easeIO(t), arc = Math.sin(t * Math.PI) * wob; this.set(sx + (x - sx) * e + arc * .4, sy + (y - sy) * e + arc); });
    }
  }
  const jessa = new Cursor($('#jessa')); jessa.seed = 1.3;
  const visitor = new Cursor($('#visitor')); visitor.seed = 2.9;

  /* visitor name + tint, shared with the people dots */
  const NAMES = ['Dreamer', 'Seeker', 'Wanderer', 'Maker', 'Curious one', 'Friend', 'New here', 'Explorer', 'Hiring?', 'Designer?'];
  let youName = pick(NAMES);
  function setYou(name) {
    youName = name; $('#visitorName').textContent = name; $('#youIni').textContent = name[0];
    $('#youLbl').textContent = `You’re “${name}”. Click to be someone else.`;
    const tint = pick(['mint', 'lilac', 'sky']);
    visitor.el.classList.remove('lilac', 'sky'); if (tint !== 'mint') visitor.el.classList.add(tint);
    const you = $('#you'); you.classList.remove('mint', 'lilac', 'sky'); you.classList.add(tint);
  }
  setYou(youName);
  $('#you').addEventListener('click', () => {
    let n; do { n = pick(NAMES); } while (n === youName); setYou(n);
    $('#you').animate([{ transform: 'scale(.85) rotate(-10deg)' }, { transform: 'scale(1.1) rotate(4deg)' }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  });
  if (fine) {
    document.body.classList.add('fancy-cursor');
    let mx = -100, my = -100, seen = false;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!seen) { seen = true; visitor.set(mx, my); visitor.show(); } });
    addEventListener('pointerleave', () => visitor.hide());
    addEventListener('pointerenter', () => seen && visitor.show());
    (function follow() { visitor.set(visitor.x + (mx - visitor.x) * .42, visitor.y + (my - visitor.y) * .42); requestAnimationFrame(follow); })();
  }

  const TOOL_ICONS = {}; $$('.tool').forEach(b => { TOOL_ICONS[b.dataset.tool] = $('svg', b).outerHTML; });
  function setTool(name) {
    $$('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === name));
    const held = $('#held'); if (name === 'move') { held.classList.remove('on'); return; }
    held.innerHTML = TOOL_ICONS[name] || ''; held.classList.add('on');
  }

  /* ---- frames ---- */
  const rect = el => el.getBoundingClientRect();
  async function draw(slot, ms = 650) {
    const r = rect(slot); const box = $('.box', slot), pill = $('.pill', slot);
    setTool('frame');
    await jessa.moveTo(r.left, r.top, 380);
    slot.classList.add('on', 'drawing'); box.style.width = '0px'; box.style.height = '0px';
    await tween(ms, t => { const e = easeOut(t), w = r.width * e, h = r.height * e; box.style.width = w + 'px'; box.style.height = h + 'px'; if (pill) pill.textContent = `${Math.round(w)} × ${Math.round(h)}`; jessa.set(r.left + w, r.top + h); });
    slot.classList.remove('drawing'); slot.classList.add('drawn'); box.style.width = '100%'; box.style.height = '100%';
  }
  async function typeIn(span, cps = 75) {
    const text = span.dataset.text || ''; const caret = span.nextElementSibling;
    span.textContent = ''; caret && caret.classList.add('on'); setTool('text');
    // glide to where the caret really is (centered headlines start mid-line), so the first letter doesn't snap her across
    const r = rect(span.parentElement), c0 = caret && rect(caret);
    await (c0 && c0.height ? jessa.moveTo(c0.left + 4, c0.top + c0.height * .6, 300) : jessa.moveTo(r.left + 8, r.top + 12, 300));
    if (skip || fast) { span.textContent = text; caret && caret.classList.remove('on'); return; }
    // follow the end of the text, not the caret (it can wrap a line early)
    for (let i = 0; i < text.length; i++) { span.textContent += text[i]; const rs = span.getClientRects(), cr = rs.length ? rs[rs.length - 1] : rect(caret); jessa.set((rs.length ? cr.right : cr.left) + 4, cr.top + cr.height * .6); await wait(reduced ? 0 : 1000 / cps + rnd(-6, 10)); }
    caret && caret.classList.remove('on');
  }
  async function paste(el) {
    const r = rect(el); setTool('move');
    await jessa.moveTo(r.left + Math.min(60, r.width * .3), r.top + Math.min(40, r.height * .4), 300);
    el.classList.add('pop');
    if (el.classList.contains('slot')) { el.classList.add('on'); const box = $('.box', el); box.style.width = '100%'; box.style.height = '100%'; el.classList.add('drawn'); }
    await wait(reduced ? 0 : 200);
  }
  const finish = s => { s.classList.remove('drawing', 'drawn'); s.classList.add('done'); };

  /* Tap: Jessa moves to a frame, taps, and it pops in whole (no drawing, no typing) */
  async function tap() { jessa.el.classList.remove('tap'); void jessa.el.offsetWidth; jessa.el.classList.add('tap'); await wait(200); }
  function popWhole(slot) {
    slot.classList.add('on', 'drawn', 'pop');
    const box = $('.box', slot); if (box) { box.style.width = '100%'; box.style.height = '100%'; }
    $$('.t', slot).forEach(t => { t.textContent = t.dataset.text || ''; const c = t.nextElementSibling; c && c.classList.remove('on'); });
    $$('.pasted', slot).forEach(p => p.classList.add('pop'));
    finish(slot);
  }
  async function tapIn(slot) {
    const subs = slot.classList.contains('group') ? $$('.sub', slot) : [slot];
    const first = subs[0] || slot; const r = rect(first);
    setTool('move');
    if (hurry) { subs.forEach(popWhole); jessa.set(r.left + 30, r.top + 24); return; }   // scrolling fast: just pop, keep up
    await jessa.moveTo(r.left + Math.min(40, r.width * .3), r.top + Math.min(30, r.height * .3), 240);
    await tap();
    for (let i = 0; i < subs.length; i++) { popWhole(subs[i]); if (i < subs.length - 1) await wait(hurry ? 0 : 70); }
    if (slot.classList.contains('flow-sec')) { $$('.node', slot).forEach((n, k) => n.style.setProperty('--i', k)); }
    await wait(120);
  }
  const TOP_COUNT = 3;   // title, cover, facts: Jessa builds these; everything after is tapped in

  /* Build a frame: draw it, type its headline, paste the rest. A group pastes its children in turn. */
  async function build(slot) {
    if (tops.indexOf(slot) >= TOP_COUNT && !skip && !fast) { await tapIn(slot); return; }
    if (slot.classList.contains('cs-title')) {
      // no frame here: Jessa just types the headline, then the chips pop in
      slot.classList.add('on', 'drawn');
      for (const t of $$('.t', slot)) await typeIn(t);
      for (const p of $$('.pasted', slot)) await paste(p);
      finish(slot); return;
    }
    if (slot.classList.contains('flow-sec')) {
      $$('.node', slot).forEach((n, i) => n.style.setProperty('--i', i));
      await draw(slot, 500); for (const t of $$('.t', slot)) await typeIn(t, 70);
      finish(slot); await wait(300); return;
    }
    if (slot.classList.contains('group')) { for (const c of $$('.sub', slot)) { await paste(c); finish(c); } return; }
    if (slot.classList.contains('paste')) { await paste(slot); finish(slot); return; }
    await draw(slot, +slot.dataset.ms || 650);
    for (const t of $$('.t', slot)) await typeIn(t);
    for (const p of $$('.pasted', slot)) await paste(p);
    finish(slot);
  }

  /* Reveal in page order as frames reach the viewport; one at a time */
  const queue = []; let busy = false; const seen = new Set();
  async function pump() {
    if (busy) return; busy = true;
    while (queue.length) {
      const s = queue.shift(); if (s.dataset.built) continue; s.dataset.built = 1; current = s;
      if (s.getBoundingClientRect().bottom < 0) fast = true;   // already scrolled past: instant
      await build(s);
      fast = false;
    }
    current = null;
    busy = false; setTool('move');
  }
  const tops = $$('.case > .slot, .case > .group, .case > .side > .slot, .case > .flow-group > .slot');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting && !seen.has(en.target)) { seen.add(en.target); queue.push(en.target); } });
    queue.sort((a, b) => tops.indexOf(a) - tops.indexOf(b));
    pump();
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  tops.forEach(s => io.observe(s));
  document.addEventListener('flows:refresh', () => { tops.forEach(s => { if (!s.dataset.built) { seen.delete(s); io.unobserve(s); io.observe(s); } }); });

  /* Scrolled past what's being built: finish it instantly, and build anything else already
     above the fold instantly too, so the build catches up to wherever the reader is. */
  let current = null, hurry = false, lastY = scrollY, lastT = performance.now(), hurryTimer = null;
  addEventListener('scroll', () => {
    const now = performance.now(), dy = Math.abs(scrollY - lastY), dt = Math.max(1, now - lastT); lastY = scrollY; lastT = now;
    if (dy / dt > 1.2) { hurry = true; clearTimeout(hurryTimer); hurryTimer = setTimeout(() => { hurry = false; }, 500); }   // > ~1.2px per ms = reading fast
  }, { passive: true });
  function catchUp() {
    let added = false;
    tops.forEach(s => { if (!seen.has(s) && s.getBoundingClientRect().bottom < 0) { seen.add(s); queue.push(s); added = true; } });
    if (added) queue.sort((a, b) => tops.indexOf(a) - tops.indexOf(b));
    if (busy && current) { const r = current.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) fast = true; }
    pump();
  }
  addEventListener('scroll', catchUp, { passive: true });

  /* click anywhere on the canvas: finish everything in view and below for a beat */
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('.pages, .toolbar, .people, a, button')) return;
    if (!busy) return;
    skip = true; setTimeout(() => { skip = base; }, 1500);
  }, true);

  /* Jump links (section chips, in-page buttons): build everything up to and including the
     target instantly, then scroll, so nothing is left waiting to be drawn. */
  async function buildUpTo(target) {
    let stop = -1; tops.forEach((s, i) => { if (s === target || s.contains(target) || target.contains(s)) stop = i; });
    if (stop < 0) return;
    skip = true;
    const pending = tops.slice(0, stop + 1).filter(s => !s.dataset.built);
    pending.forEach(s => { seen.add(s); s.dataset.built = 1; });
    for (const s of pending) await build(s);
    skip = base;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); const target = id && document.getElementById(id); if (!target) return;
    e.preventDefault();
    buildUpTo(target).then(() => {
      history.replaceState(null, '', '#' + id);
      const y = target.getBoundingClientRect().top + scrollY - 96;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
  /* arriving with a hash: same thing, after the first paint */
  if (location.hash.length > 1) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => buildUpTo(target).then(() => { const y = target.getBoundingClientRect().top + scrollY - 96; window.scrollTo({ top: y, behavior: 'auto' }); }), 300);
  }

  /* Floating copy of the title's section chips, shown once the title frame scrolls out of view */
  const subnav = $('.cs-title .subnav');
  if (subnav) {
    const fl = document.createElement('span'); fl.className = 'subfloat'; fl.setAttribute('aria-label', 'Sections');
    $$('a', subnav).forEach(a => { const c = a.cloneNode(true); c.classList.add('wob'); c.classList.remove('active', 'mode'); fl.appendChild(c); });
    $('#pages').appendChild(fl);
    const title = subnav.closest('.slot');
    new IntersectionObserver(([en]) => fl.classList.toggle('on', !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe(title);
    const targets = $$('a', fl).map(a => { const h = a.getAttribute('href') || ''; return h.startsWith('#') ? $(h) : null; });
    const mark = () => {
      let best = null;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * .4) best = i; });
      $$('a', fl).forEach((a, i) => a.classList.toggle('active', i === best));
    };
    addEventListener('scroll', mark, { passive: true }); mark();
  }

  /* Tuck the top chrome away while scrolling down, bring it back on scroll up */
  { let lastY = scrollY, acc = 0;
    addEventListener('scroll', () => {
      const y = scrollY, dy = y - lastY; lastY = y;
      acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
      const tuck = y > 140 && acc > 24, show = acc < -12 || y < 80;
      if (tuck || show) { $('#pages').classList.toggle('tuck', tuck && !show); $('.people').classList.toggle('tuck', tuck && !show); }
    }, { passive: true }); }

  /* Any picture or clip on a case page opens big in a lightbox; arrows (and ← →) step through every one on the page */
  if ($('.case')) {
    const lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.innerHTML = '<button class="lb-x wob" aria-label="Close">×</button><button class="lb-nav prev wob" aria-label="Previous">←</button>'
      + '<figure class="lb-fig"><img alt=""><video muted loop playsinline></video><figcaption class="wob"></figcaption></figure><button class="lb-nav next wob" aria-label="Next">→</button>';
    document.body.appendChild(lb);
    const img = $('img', lb), vid = $('video', lb), cap = $('figcaption', lb); let cur = null, down = null;
    // what counts: real pictures and clips in the case, not logos, links, embeds or tiny icons
    const zoomable = el => el && el.matches('img, video') && !el.matches('video[controls]') && el.closest('.case') && !el.closest('a, .site-embed, .tools, .cs-end, button, .lb')
      && (el.offsetWidth >= 90 || el.closest('.screen'));
    const all = () => $$('.case img, .case video').filter(zoomable);
    const label = el => { const s = el.closest('[data-name]'); const h = el.closest('.content') && $('h3, h4', el.closest('.content'));
      return (h && h.textContent) || el.alt || (s ? s.dataset.name.replace(/^\d+\s*·\s*/, '') : ''); };
    function open(el) {
      cur = el; const isV = el.tagName === 'VIDEO';
      img.hidden = isV; vid.hidden = !isV;
      if (isV) { vid.src = el.currentSrc || el.src; vid.currentTime = 0; vid.play().catch(() => {}); } else { vid.pause(); img.src = el.currentSrc || el.src; }
      const t = label(el); cap.textContent = t; cap.hidden = !t;
      lb.hidden = false; requestAnimationFrame(() => lb.classList.add('in')); document.body.classList.add('lb-open');
    }
    function close() { lb.classList.remove('in'); document.body.classList.remove('lb-open'); vid.pause(); setTimeout(() => { lb.hidden = true; }, 250); }
    function step(d) { const a = all(); if (!a.length) return; open(a[(a.indexOf(cur) + d + a.length) % a.length]); }
    // a click opens it; a drag that scrolls a row, or drawing with another tool, doesn't
    document.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; }, true);
    document.addEventListener('click', e => {
      let el = e.target.closest('img, video');
      if (!el) { const s = e.target.closest('.screen'); el = s && $('img, video', s); }
      if (!zoomable(el) || !document.body.classList.contains('tool-move')) return;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      open(el);
    });
    $('.lb-x', lb).addEventListener('click', close); $('.prev', lb).addEventListener('click', () => step(-1)); $('.next', lb).addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target === $('.lb-fig', lb)) close(); });
    addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    // over something that opens, the visitor's own cursor turns into a little magnifier (in their colour)
    const vis = $('#visitor');
    if (vis) {
      vis.insertAdjacentHTML('beforeend', '<svg class="mag" viewBox="0 0 32 32" aria-hidden="true"><circle class="lens" cx="13" cy="13" r="8.5"/><circle class="glint" cx="10" cy="10" r="2.2"/><path class="grip" d="M19.6 19.6 27 27"/><path class="plus" d="M13 9.5v7M9.5 13h7"/></svg>');
      document.addEventListener('pointerover', e => {
        const el = e.target.closest && (e.target.closest('img, video') || ((s => s && $('img, video', s))(e.target.closest('.screen'))));
        vis.classList.toggle('zoom', !!(zoomable(el) && document.body.classList.contains('tool-move') && lb.hidden));
      });
      lb.addEventListener('pointerover', () => vis.classList.remove('zoom'));
    }
  }

  /* Leaving for another page: Jessa marquee-selects what's on screen and deletes it, then we go */
  let leaving = false;
  const anim = (ms, fn) => new Promise(res => { const t0 = performance.now(); const step = now => { const t = Math.min(1, (now - t0) / ms); fn(t); t < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  document.addEventListener('click', async e => {
    const a = e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download') || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
    if (phone || reduced) return;   // small screens: no delete choreography
    const slots = $$('.slot.on').filter(s => { const r = s.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width; })
      .filter((s, _, all) => !all.some(o => o !== s && o.contains(s)));
    if (!slots.length) return;
    e.preventDefault(); if (leaving) return; leaving = true;
    const bail = setTimeout(() => { location.href = a.href; }, 2500);   // never strand anyone on an empty page
    try {
      const rs = slots.map(s => s.getBoundingClientRect());
      const x0 = Math.max(8, Math.min(...rs.map(r => r.left)) - 18), y0 = Math.max(8, Math.min(...rs.map(r => r.top)) - 18);
      const x1 = Math.min(innerWidth - 8, Math.max(...rs.map(r => r.right)) + 18), y1 = Math.min(innerHeight - 8, Math.max(...rs.map(r => r.bottom)) + 18);
      let m = $('#marquee'); if (!m) { m = document.createElement('div'); m.className = 'marquee'; m.id = 'marquee'; document.body.appendChild(m); }
      setTool('move');
      const sx = jessa.x, sy = jessa.y;
      await anim(280, t => { const k = easeIO(t); jessa.set(sx + (x0 - sx) * k, sy + (y0 - sy) * k); });
      Object.assign(m.style, { left: x0 + 'px', top: y0 + 'px', width: '0px', height: '0px' }); m.classList.add('on');
      await anim(260, t => { const k = easeOut(t); m.style.width = (x1 - x0) * k + 'px'; m.style.height = (y1 - y0) * k + 'px'; jessa.set(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); });
      slots.forEach(s => s.classList.add('sel'));
      await pause(160); m.classList.remove('on');
      slots.forEach((s, i) => { s.classList.add('bye'); if (s.animate) s._bye = s.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.4) rotate(-6deg)' }], { duration: 500, delay: i * 25, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' }); });
      await pause(380 + slots.length * 25);
      $('.case') && ($('.case').style.visibility = 'hidden');   // nothing pops back between the delete and the next page
    } catch (_) {}
    clearTimeout(bail); location.href = a.href;
  });
  // came back with the browser's Back button: put everything back where it was
  addEventListener('pageshow', e => {
    if (!e.persisted || !leaving) return; leaving = false;
    $('.case') && ($('.case').style.visibility = '');
    $$('.slot.sel, .slot.bye').forEach(s => { s.classList.remove('sel', 'bye'); if (s._bye) { s._bye.cancel(); s._bye = null; } });
  });

  // pick Jessa up where she was on the last page (if we just came from one), so she glides on instead of popping in
  const handoff = (() => { try { const h = JSON.parse(sessionStorage.getItem('jessaAt') || 'null'); return h && Date.now() - h.t < 5000 ? h : null; } catch (_) { return null; } })();
  if (handoff) { jessa.set(Math.min(Math.max(handoff.x, 30), innerWidth - 60), Math.min(Math.max(handoff.y, 30), innerHeight - 60)); jessa.el.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { jessa.el.style.transition = ''; })); }
  else jessa.set(innerWidth * .62, innerHeight * .35);
  addEventListener('pagehide', () => { try { sessionStorage.setItem('jessaAt', JSON.stringify({ x: jessa.x, y: jessa.y, t: Date.now() })); } catch (_) {} });
  jessa.show();
})();

/* Phones: Prototype links skip the framed page and open the app on its own, full bleed like a web app */
(() => {
  const APPS = { harbor: 'apps/harbor/live/index.html', somnar: 'apps/somnar/index.html?screen=onboarding', indent: 'apps/indent/landing.html' };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href$="-prototype.html"]');
    if (!a || !matchMedia('(max-width: 860px)').matches) return;
    const app = APPS[a.getAttribute('href').replace('-prototype.html', '')];
    if (!app) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.open(app, '_blank', 'noopener');
  }, true);
})();

// iPhones in Low Power Mode (and some browsers) block autoplay, which leaves the looping clips frozen.
// The first touch anywhere counts as permission, so start them then, and keep nudging clips as they scroll into view.
(() => {
  const loops = () => [...document.querySelectorAll('video[autoplay]')];
  const nudge = v => { if (!v.paused) return; v.muted = true; v.playsInline = true; const p = v.play(); if (p) p.catch(() => {}); };
  const wake = () => loops().forEach(nudge);
  ['touchend', 'click', 'keydown'].forEach(t => addEventListener(t, wake, { once: true, passive: true, capture: true }));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && nudge(e.target)), { rootMargin: '100px 0px' });
    const watch = () => loops().forEach(v => { if (!v.dataset.nudge) { v.dataset.nudge = 1; io.observe(v); } });
    watch(); new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
  }
})();
