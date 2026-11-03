// The big "mochiboard" wordmark with pink Mochi hopping along it. Each letter she lands on squishes,
// springs back, and blooms into the pastel rainbow (the "surprise me" swatch from the app) before fading home.
// Markup: <div class="mb-hop"><canvas width="64" height="56"></canvas><a class="wm">mochiboard</a></div>
(() => {
  document.querySelectorAll('.mb-hop').forEach(wrap => {
    const cv = wrap.querySelector('canvas'), wm = wrap.querySelector('.wm');
    wm.innerHTML = [...wm.textContent.trim()].map(c => `<span data-c="${c}">${c}</span>`).join('');
    const L = [...wm.querySelectorAll('span')];
    // the wordmark always fits its column on one line: size it to the space it has
    const fit = () => { wm.style.fontSize = '100px'; const k = wrap.clientWidth / wm.scrollWidth; wm.style.fontSize = Math.max(40, Math.min(420, 100 * k * .99)) + 'px'; };
    fit(); addEventListener('resize', fit); document.fonts?.ready.then(fit);
    const pink = Goo(cv, { colors: { B: '#ff8fc2', S: '#ffe0ee', D: '#e0559a' } });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cv.style.display = 'none'; return; }
    const TALL = 'bhdklf', HOP = .58, REST = .12;
    let i = 0, dir = 1, t0 = 0, on = false;
    const spot = k => { const r = L[k].getBoundingClientRect(), w = wrap.getBoundingClientRect(), fs = parseFloat(getComputedStyle(L[k]).fontSize);
      return { x: r.left - w.left + r.width / 2, y: r.top - w.top + fs * (TALL.includes(L[k].dataset.c) ? .1 : .33) }; };
    const land = k => { L[k].classList.remove('boing'); void L[k].offsetWidth; L[k].classList.add('boing'); };
    function tick(now) {
      if (!on) return; if (!t0) t0 = now;
      let k = (now - t0) / 1000 / (HOP + REST);
      if (k >= 1) { t0 = now; land(i + dir); i += dir; if (i === L.length - 1 || i === 0) dir = -dir; k = 0; }
      const a = spot(i), b = spot(i + dir), m = Math.min(1, k * (HOP + REST) / HOP), e = m * m * (3 - 2 * m);
      const S = Math.max(24, parseFloat(getComputedStyle(L[0]).fontSize) * .34), arc = Math.sin(m * Math.PI) * S * 1.1;
      const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e - arc;
      Object.assign(cv.style, { width: S + 'px', height: S * 56 / 64 + 'px', transform: `translate(${x - S / 2}px, ${y - S * 56 / 64}px) scaleX(${dir})` });
      requestAnimationFrame(tick);
    }
    new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !on) { on = true; t0 = 0; requestAnimationFrame(tick); } else if (!v) on = false; }).observe(wrap);
  });
})();
