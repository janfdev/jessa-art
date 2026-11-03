// Ukiniwa. One clock drives the page:
//   intro (time):  the pavilion is drawn stroke by stroke, the poem written, the logo stamped, the name signed
//   scroll:        the pavilion + words are erased (reverse pen order), then the hall is drawn on the left,
//                  the story is written in Japanese and then given in English, three polaroids drop in on the right,
//                  and a cherry branch grows in from the right edge across them. Scrolling back reverses it all.
// Debug: ?t=ms freezes the intro clock, ?p=0..1 sets the scroll position.
const q = new URLSearchParams(location.search);
const freezeT = q.has('t') ? Number(q.get('t')) : null;
const forceP = q.has('p') ? Number(q.get('p')) : null;
if (q.get('lv')) document.body.dataset.lv = q.get('lv');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#1c1a17';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const span = (x, a, b) => clamp((x - a) / (b - a));                       // 0..1 progress of x through [a, b]
const easeOut = x => 1 - Math.pow(1 - x, 2);
const easeIn = x => x * x;

// scroll timeline, in screens of scrolling (the page scrolls SCREENS screens in total)
const SCREENS = 15;
const P = Object.fromEntries(Object.entries({
  erase: [.12, 1.14], logoOut: [.72, 1.14],
  hall: [1.14, 2.4], storyJp: [1.5, 3.0], storyEn: [2.82, 3.84],
  pols: [2.04, 3.48], branch: [3.36, 4.68],
  clear: [5.3, 6.3],                       // scene two is put away
  map: [6.1, 8.2], mapTitle: [6.1, 6.9],   // the sketchbook map is drawn
  walk: [7.7, 11.2],                       // the path walks from the gate to the pavilion
  night: [12.2, 13.5],                     // night spreads out from the pavilion until the screen is black
  end: [13.2, 14.6],                       // logo stamped in white, then the visit details
}).map(([k, [a, b]]) => [k, [a / SCREENS, b / SCREENS]]));
// intro timeline (ms)
const I = { poem: 3500, poemEach: 115, poemEnEach: 32, logo: 5200, name: 5450, nameEach: 190, nameEnEach: 30 };

/* ---------- hand-written letters ---------- */
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - .5;
function jitter(el, tilt, lift) {               // every character gets a small, fixed (seeded) tilt, lift and size change
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 1) return jitter(n, tilt, lift);
    if (n.nodeType !== 3 || !n.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    for (const c of n.textContent) {
      if (c === ' ') { frag.append(' '); continue; }
      const s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
      s.style.transform = `translate(${rnd() * lift}px, ${rnd() * lift}px) rotate(${rnd() * tilt}deg) scale(${1 + rnd() * .1})`;
      frag.append(s);
    }
    n.replaceWith(frag);
  });
}
document.querySelectorAll('.one .jp').forEach(el => jitter(el, 13, 3));
document.querySelectorAll('.one .en').forEach(el => jitter(el, 7, 1.6));
document.querySelectorAll('.story .jp').forEach(el => jitter(el, 8, 1.4));
document.querySelectorAll('.three .jp, .three .en').forEach(el => jitter(el, 9, 1.8));
document.querySelectorAll('.end-name .jp, .end-name .en, .info h3 .jp, .info h3 .en').forEach(el => jitter(el, 9, 1.6));

// show the first f of a run of characters, each revealed along the writing direction (f can go back down: un-writing)
function written(chars, f, vertical) {
  const pos = f * chars.length;
  chars.forEach((c, i) => {
    const k = clamp(pos - i);
    if (c._k === k) return; c._k = k;
    c.style.clipPath = k >= 1 ? '' : vertical ? `inset(0 0 ${(1 - k) * 100}% 0)` : `inset(0 ${(1 - k) * 100}% 0 0)`;
    c.style.opacity = k <= 0 ? 0 : .4 + .6 * k;
  });
}

/* ---------- pen drawings on canvas ---------- */
// The ink is revealed along traced pen strokes (draw/*.json: [path, width, start ms, duration ms]).
// setT(t) shows the drawing as it was t ms into being drawn; going backwards erases in reverse pen order.
class Drawing {
  constructor(box, src, strokesUrl, vb) { Object.assign(this, { box, src, strokesUrl, vb, t: -1 }); }
  async load() {
    const strokes = await fetch(this.strokesUrl).then(r => r.json());
    this.img = new Image(); this.img.src = this.src; await this.img.decode();
    this.list = strokes.map(([d, w, t0, dur]) => {
      const p = d.slice(1).split('L').map(s => s.split(' ').map(Number));
      const acc = [0]; for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
      const path = new Path2D(d);
      return { p, acc, w, t0, dur, path };
    });
    this.end = Math.max(...this.list.map(k => k.t0 + k.dur));
    this.size(); addEventListener('resize', () => { this.size(); const t = this.t; this.t = -1; this.setT(t); });
    return this;
  }
  size() {
    const dpr = Math.min(devicePixelRatio || 1, 2), r = this.box.getBoundingClientRect();
    if (!this.view) { this.view = document.createElement('canvas'); this.box.append(this.view); this.mask = document.createElement('canvas'); }
    this.view.width = this.mask.width = Math.max(1, Math.round(r.width * dpr));
    this.view.height = this.mask.height = Math.max(1, Math.round(r.height * dpr));
    const s = this.view.width / this.vb[2], m = this.mask.getContext('2d');
    m.setTransform(s, 0, 0, s, -this.vb[0] * s, -this.vb[1] * s); m.lineCap = m.lineJoin = 'round'; m.strokeStyle = '#000';
  }
  stroke(m, k, t) {                                    // draw stroke k as far as it has got at time t
    const f = clamp((t - k.t0) / k.dur); if (f <= 0) return;
    m.lineWidth = k.w;
    if (f >= 1) { m.stroke(k.path); return; }
    const L = easeOut(f) * k.acc[k.acc.length - 1];
    m.beginPath(); m.moveTo(...k.p[0]);
    let i = 1; for (; i < k.p.length && k.acc[i] <= L; i++) m.lineTo(...k.p[i]);
    if (i < k.p.length) { const a = k.p[i - 1], b = k.p[i], r = (L - k.acc[i - 1]) / (k.acc[i] - k.acc[i - 1]); m.lineTo(a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r); }
    m.stroke();
  }
  setT(t) {
    t = clamp(t, 0, this.end + 600);
    if (Math.abs(t - this.t) < .5 || !this.list) return;
    const m = this.mask.getContext('2d'), v = this.view.getContext('2d');
    if (t < this.t || this.t < 0) {                    // going back (erasing): start from blank and redraw what is left
      m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, this.mask.width, this.mask.height); m.restore();
      for (const k of this.list) if (k.t0 < t) this.stroke(m, k, t);
    } else {                                           // going forward: only the strokes still in motion
      for (const k of this.list) if (k.t0 < t && k.t0 + k.dur > this.t) this.stroke(m, k, t);
    }
    this.t = t;
    v.globalCompositeOperation = 'copy'; v.globalAlpha = 1; v.drawImage(this.mask, 0, 0);
    v.globalCompositeOperation = 'source-in'; v.drawImage(this.img, 0, 0, this.view.width, this.view.height);
    const finish = span(t, this.end - 200, this.end + 600);   // ink the strokes missed (solid patches) settles in at the end
    if (finish > 0) { v.globalCompositeOperation = 'source-over'; v.globalAlpha = finish; v.drawImage(this.img, 0, 0, this.view.width, this.view.height); v.globalAlpha = 1; }
  }
}

const svgUrl = text => URL.createObjectURL(new Blob([text.replace(/currentColor/g, INK)], { type: 'image/svg+xml' }));
const vbOf = text => text.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);

/* ---------- the walking path ---------- */
// A smooth curve through the route points (Catmull-Rom), revealed as a dotted trail with a pen tip.
// Stops are written in when the walk reaches them; the map's polaroids drop at the matching stops.
function buildRoute(r) {
  const svg = document.querySelector('.route'), pts = r.path;
  let d = `M${pts[0]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1} ${c2} ${p2}`;
  }
  const trail = svg.querySelector('.trail'), reveal = svg.querySelector('.reveal'), tip = svg.querySelector('.tip');
  trail.setAttribute('d', d); reveal.setAttribute('d', d);
  const L = reveal.getTotalLength();
  reveal.style.strokeDasharray = L;
  // how far along the curve each route point sits (search the curve for the closest sample)
  const samples = Array.from({ length: 600 }, (_, i) => { const q = reveal.getPointAtLength(L * i / 599); return [q.x, q.y, i / 599]; });
  const along = pts.map(([x, y]) => samples.reduce((b, s) => (Math.hypot(s[0] - x, s[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? s : b))[2]);
  const stops = [...document.querySelectorAll('.stop')].map(n => ({ n, f: along[+n.dataset.at], jp: [...n.querySelectorAll('.jp .ch')], en: [...n.querySelectorAll('.en .ch')] }));
  // labels that sit away from their stop get a thin pen leader, drawn from the path to the label
  const leads = svg.querySelector('.leads');
  stops.forEach(s => {
    if (!('lead' in s.n.dataset)) return;
    const [x0, y0] = pts[+s.n.dataset.at];
    const x1 = parseFloat(s.n.style.left) / 100 * r.size[0], y1 = parseFloat(s.n.style.top) / 100 * r.size[1];
    const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    const a = [x0 + ux * 34, y0 + uy * 34], b = [x1 - ux * 70, y1 - uy * 70];          // stop short of the dot and the words
    const bend = [(a[0] + b[0]) / 2 - uy * len * .12, (a[1] + b[1]) / 2 + ux * len * .12];   // a slight hand-drawn curve
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M${a}Q${bend} ${b}`); leads.append(p);
    s.lead = p; s.leadLen = p.getTotalLength();
    p.style.strokeDasharray = `5 11`;
  });
  const mapPols = [...document.querySelectorAll('.three .pol')];
  const polAt = [1, 3, 4, 6].map(i => stops[i].f);           // basin → hall photo, lantern → stones, pine → pine, pavilion → posts in water
  let last = -1;
  return {
    set(raw) {
      if (Math.abs(raw - last) < 1e-4) return; last = raw;
      const f = clamp(raw / .86), g = raw / .86;               // the path finishes early so the last label has time to be written
      reveal.style.strokeDashoffset = L * (1 - f);
      const q = reveal.getPointAtLength(L * f);
      tip.setAttribute('cx', q.x); tip.setAttribute('cy', q.y); tip.style.opacity = f > 0 && f < 1 ? 1 : 0;
      stops.forEach(s => {
        const k = raw <= 0 ? 0 : span(g, s.f, s.f + .1);        // nothing shows before the walk begins (the gate is stop 0)
        written(s.jp, span(k, .2, .65), false); written(s.en, span(k, .5, 1), false);
        s.n.style.opacity = span(k, 0, .2);                    // the paper tag is laid down first, then written on
        if (s.lead) s.lead.style.clipPath = `inset(0 0 0 0)`, s.lead.style.opacity = .7 * span(k, 0, .3);
      });
      mapPols.forEach((n, i) => {
        const k = easeOut(span(g, polAt[i] - .01, polAt[i] + .09));
        n.style.opacity = Math.min(1, k * 1.6);
        n.style.transform = `translateY(${(1 - k) * -40}px) scale(${1 + (1 - k) * .14}) rotate(calc(var(--r) + ${(1 - k) * 9}deg))`;
      });
    },
  };
}

/* ---------- build ---------- */
(async () => {
  const [pavSvg, logoSvg, branchSvg] = await Promise.all(['assets/pavilion.svg', 'assets/logo.svg', 'assets/branch.svg'].map(u => fetch(u).then(r => r.text())));
  document.querySelector('.logo').innerHTML = logoSvg;
  document.querySelector('.end-logo').innerHTML = logoSvg.replace(/id="lg"/, 'id="lg-end"').replace(/url\(#lg\)/, 'url(#lg-end)');
  const pavBox = document.querySelector('.pavilion'); pavBox.classList.add('draw-box'); pavBox.style.aspectRatio = vbOf(pavSvg)[2] + ' / ' + vbOf(pavSvg)[3];
  const [pav, hall, branch] = await Promise.all([
    new Drawing(pavBox, svgUrl(pavSvg), 'draw/pavilion.json', vbOf(pavSvg)).load(),
    new Drawing(document.querySelector('.hall'), 'assets/hall.png', 'draw/hall.json', [0, 0, 1360, 754]).load(),
    new Drawing(document.querySelector('.branch'), svgUrl(branchSvg), 'draw/branch.json', vbOf(branchSvg)).load(),
  ]);
  const map = await new Drawing(document.querySelector('.map'), 'assets/map.png', 'draw/map.json', [0, 0, 1091, 807]).load();
  map.view.style.zIndex = 0;
  const route = await fetch('map/route.json').then(r => r.json());
  const walk = buildRoute(route);
  await document.fonts.ready;

  const el = s => [...document.querySelectorAll(s)];
  const poemJp = el('.one .poem .jp .ch'), poemEn = el('.one .poem .en .ch');
  const nameJp = el('.one .name .jp .ch'), nameEn = el('.one .name .en .ch');
  const storyJp = el('.story .jp .ch'), storyEn = el('.story .en > *');
  const mapTitle = el('.map-title .ch');
  const night = document.querySelector('.night'), ink = night.firstElementChild, end = document.querySelector('.end'), endLogo = document.querySelector('.end-logo');
  const endName = [el('.end-name .jp .ch'), el('.end-name .en .ch')];
  const endBlocks = el('.info section'), foot = document.querySelector('.foot');
  // the floating visit button: its pen loop is drawn in after the intro, and redrawn on hover
  const cta = document.querySelector('.cta'), loop = cta.querySelector('.loop'), loopLen = loop.getTotalLength();
  loop.style.strokeDasharray = loopLen;
  let redraw = 0;
  cta.addEventListener('mouseenter', () => { redraw = performance.now(); });

  // scroller: an ink line, the moon is the thumb; marks jump to sections, the moon can be dragged
  const rail = document.querySelector('.rail'), moon = rail.querySelector('.moon'), done = rail.querySelector('.done'), marks = [...rail.querySelectorAll('.mark')];
    const scrollMax = () => document.documentElement.scrollHeight - innerHeight;
  moon.addEventListener('pointerdown', e => {
    e.preventDefault(); moon.setPointerCapture(e.pointerId); rail.classList.add('dragging');
    const move = ev => { const r = rail.getBoundingClientRect(); scrollTo(0, clamp((ev.clientY - r.top) / r.height) * scrollMax()); };
    const up = () => { rail.classList.remove('dragging'); moon.removeEventListener('pointermove', move); moon.removeEventListener('pointerup', up); };
    moon.addEventListener('pointermove', move); moon.addEventListener('pointerup', up);
  });
  moon.addEventListener('keydown', e => {
    const step = { ArrowDown: .02, ArrowUp: -.02, PageDown: .08, PageUp: -.08, End: 1, Home: -1 }[e.key];
    if (step) { e.preventDefault(); scrollTo({ top: clamp(scrollY / scrollMax() + step) * scrollMax(), behavior: 'smooth' }); }
  });

  // mouse: ink dot on the pointer, a loose pen loop trailing behind; grows over anything clickable, presses on click
  const pen = document.querySelector('.pen'), ring = pen.querySelector('.ring'), dot = pen.querySelector('.dot');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const m = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, seen: false };
  if (fine) {
    document.documentElement.classList.add('ink-cursor');
    addEventListener('pointermove', e => {
      m.x = e.clientX; m.y = e.clientY;
      if (!m.seen) { m.rx = m.x; m.ry = m.y; m.seen = true; }
      pen.classList.add('on');
      pen.classList.toggle('link', !!e.target.closest('a, button, [role="slider"]'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => pen.classList.remove('on'));
    addEventListener('pointerdown', () => pen.classList.add('down'));
    addEventListener('pointerup', () => pen.classList.remove('down'));
  }
  // the footer links jump to a place in the story (data-to = screens of scroll)
  document.querySelectorAll('[data-to]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: max * Math.min(1, +a.dataset.to / SCREENS), behavior: 'smooth' });
  }));
  const pols = el('.two .pol');
  const logo = document.querySelector('.logo');

  const start = performance.now();
  let p = 0, target = 0;
  const readScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; target = forceP ?? (max > 0 ? scrollY / max : 0); };
  addEventListener('scroll', readScroll, { passive: true }); readScroll();
  if (forceP != null) p = forceP;

  function render(now) {
    const it = calm ? 1e9 : freezeT ?? now - start;            // intro clock
    p += (target - p) * .12; if (Math.abs(target - p) < .0004) p = target;   // soft, slightly lagging scroll
    const e = easeOut(span(p, ...P.erase));                     // 0 = all there, 1 = erased

    // scene one: drawn by the intro, erased by scroll (the eraser runs the pen backwards)
    pav.setT(Math.min(it, (pav.end + 600) * (1 - e)));
    const wPoemJp = span(it, I.poem, I.poem + poemJp.length * I.poemEach);
    const tEn = I.poem + poemJp.length * I.poemEach + 150;
    written(poemJp, wPoemJp * (1 - span(e, .35, 1)), true);
    written(poemEn, span(it, tEn, tEn + poemEn.length * I.poemEnEach) * (1 - span(e, 0, .5)), false);
    written(nameJp, span(it, I.name, I.name + nameJp.length * I.nameEach) * (1 - span(e, .5, 1)), false);
    const tNameEn = I.name + nameJp.length * I.nameEach + 100;
    written(nameEn, span(it, tNameEn, tNameEn + nameEn.length * I.nameEnEach) * (1 - span(e, .1, .6)), false);
    const st = span(it, I.logo, I.logo + 420), out = span(p, ...P.logoOut);   // logo: pressed on like a seal, lifts off on scroll
    const sc = st < .7 ? 1.12 - .14 * (st / .7) : .98 + .02 * ((st - .7) / .3);
    logo.style.opacity = (st > 0 ? Math.min(1, st / .4) : 0) * (1 - out);
    logo.style.transform = `scale(${sc}) rotate(${-3 * (1 - Math.min(1, st / .7))}deg)`;

    // scene two: arrives, then is put away (drawings erased, words un-written, polaroids lifted off)
    const c = easeOut(span(p, ...P.clear)), keep = 1 - c;
    hall.setT(Math.min(span(p, ...P.hall), keep) * (hall.end + 600));
    written(storyJp, Math.min(span(p, ...P.storyJp), 1 - span(c, .1, .8)), true);
    const en = span(p, ...P.storyEn), enOut = span(c, 0, .6);
    storyEn.forEach((n, i) => {                                 // the English arrives sentence by sentence, from soft focus
      const k = clamp(en * storyEn.length * 1.15 - i) * (1 - enOut);
      n.style.opacity = k; n.style.filter = k >= 1 ? '' : `blur(${(1 - k) * 4}px)`; n.style.transform = `translateY(${(1 - k) * 6}px)`;
    });
    pols.forEach((n, i) => {                                    // each polaroid is dropped onto the table, settles, shadow tightens
      const k = easeOut(span(p, P.pols[0] + i * .006, P.pols[0] + i * .006 + .009));
      const up = easeOut(span(c, i * .12, .5 + i * .12));      // ...and later picked back up
      n.style.opacity = Math.min(1, k * 1.6) * (1 - up);
      n.style.transform = `translateY(${(1 - k) * -40 - up * 50}px) scale(${1 + (1 - k) * .14 + up * .08}) rotate(calc(var(--r) + ${(1 - k) * 9 - up * 6}deg))`;
    });
    branch.setT(Math.min(span(p, ...P.branch), keep) * (branch.end + 600));

    // scene three: the sketchbook map is drawn, then a path walks the garden; each stop is labelled and
    // a polaroid is dropped beside its margin sketch as the walk passes
    map.setT(span(p, ...P.map) * (map.end + 600));
    written(mapTitle, span(p, ...P.mapTitle), false);
    walk.set(span(p, ...P.walk));

    // last scene: night spreads from the pavilion ("where the moon rests"), then the logo and how to visit
    const n = span(p, ...P.night), mr = document.querySelector('.map').getBoundingClientRect();
    const nb = night.getBoundingClientRect();   // the night layer overhangs the screen, so measure from its own corner
    ink.style.setProperty('--nx', mr.left - nb.left + mr.width * .73 + 'px'); ink.style.setProperty('--ny', mr.top - nb.top + mr.height * .68 + 'px');
    ink.style.setProperty('--nr', n <= 0 ? '-4vmax' : (easeIn(n) * 170 - 4) + 'vmax');
    const bleeding = n > 0 && n < 1;                       // ragged ink edge only while it spreads; fully dark = plain black
    night.style.filter = bleeding ? 'url(#bleed)' : 'none';
    ink.style.webkitMaskImage = ink.style.maskImage = n >= 1 ? 'none' : '';
    const en2 = span(p, ...P.end);
    end.classList.toggle('on', en2 > 0);
    const st2 = span(en2, 0, .22), sc2 = st2 < .7 ? 1.12 - .14 * (st2 / .7) : .98 + .02 * ((st2 - .7) / .3);
    endLogo.style.opacity = Math.min(1, st2 / .4); endLogo.style.transform = `scale(${sc2}) rotate(${-3 * (1 - Math.min(1, st2 / .7))}deg)`;
    written(endName[0], span(en2, .18, .38), false); written(endName[1], span(en2, .3, .5), false);
    endBlocks.forEach((b, i) => { const k = span(en2, .45 + i * .1, .7 + i * .1); b.style.opacity = k; b.style.transform = `translateY(${(1 - k) * 10}px)`; b.style.filter = k >= 1 ? '' : `blur(${(1 - k) * 3}px)`; });
    foot.style.opacity = span(en2, .8, 1);

    // visit button: appears once the intro has settled, steps aside when the visit details are on screen
    const ctaIn = span(it, 6400, 7400), ctaOut = span(en2, .3, .6);
    const hover = span(now - redraw, 0, 650);                 // hovering lifts the pen and loops it again
    const drawn = Math.min(easeOut(ctaIn), redraw ? (hover < 1 ? easeOut(hover) : 1) : 1);
    loop.style.strokeDashoffset = loopLen * (1 - drawn);
    cta.style.opacity = Math.min(1, ctaIn * 2.5) * (1 - ctaOut);
    cta.querySelector('.word').style.opacity = span(ctaIn, .35, .8);
    cta.classList.toggle('on', ctaIn > .5 && ctaOut < .5);
    cta.classList.toggle('dark', span(p, ...P.night) > .6);

    // scroller: the moon floats down the ink line; the walked part of the line is darker
    const sp = forceP ?? clamp(scrollY / Math.max(1, scrollMax()));
    rail.style.opacity = span(it, 6000, 7000);
    moon.style.top = sp * 100 + '%'; moon.setAttribute('aria-valuenow', Math.round(sp * 100));
    done.style.clipPath = `inset(0 0 ${(1 - sp) * 100}% 0)`;   // the line is stretched to fit, so crop rather than dash
    const screen = sp * SCREENS;
    marks.forEach((k, i) => k.classList.toggle('here', screen >= +k.dataset.to - .01 && (i === marks.length - 1 || screen < +marks[i + 1].dataset.to - .01)));
    rail.classList.toggle('dark', span(p, ...P.night) > .6);

    // mouse: dot is exact, the loop trails with a little lag and turns slowly like a hand
    if (fine && m.seen) {
      m.rx += (m.x - m.rx) * .2; m.ry += (m.y - m.ry) * .2;
      dot.style.transform = `translate(${m.x}px, ${m.y}px)` + (pen.classList.contains('down') ? ' scale(1.7)' : pen.classList.contains('link') ? ' scale(.6)' : '');
      ring.style.transform = `translate(${m.rx}px, ${m.ry}px) rotate(${(now / 60) % 360}deg)`;
      pen.classList.toggle('dark', span(p, ...P.night) > .6);
    }

        requestAnimationFrame(render);
  }
  document.body.classList.add('ready');
  requestAnimationFrame(render);
})();
