/* Rime scrollbar: the browser's bar is hidden and replaced by a hairline rail on the right edge.
   A slim thumb shows where you are; small diamonds mark each chapter of the page and jump to it on click.
   The rail widens when you're near it, and the thumb can be dragged. Difference blending keeps it visible on the
   grey sky and on the dark footer alike. Touch screens keep their native scrolling. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const ease = 'cubic-bezier(.2,.8,.2,1)';
  const css = `
    html { scrollbar-width: none; } html::-webkit-scrollbar { display: none; }
    .rs { position: fixed; z-index: 80; top: 96px; bottom: 40px; right: 14px; width: 28px; mix-blend-mode: difference; opacity: .9; transition: opacity .4s; }
    .rs.idle { opacity: .35; }
    .rs-rail { position: absolute; top: 0; bottom: 0; right: 6px; width: 1px; background: rgba(255,255,255,.35); }
    .rs-thumb { position: absolute; right: 5.5px; width: 2px; background: #fff; border-radius: 2px; cursor: grab;
      transition: width .3s ${ease}, right .3s ${ease}; }
    .rs:hover .rs-thumb, .rs.drag .rs-thumb { width: 4px; right: 4.5px; }
    .rs.drag .rs-thumb { cursor: grabbing; }
    .rs-tick { position: absolute; right: 2.5px; width: 8px; height: 8px; margin-top: -4px; padding: 0; border: 0; background: none; cursor: pointer; }
    .rs-tick i { display: block; width: 100%; height: 100%; border: 1px solid #fff; background: #000; transform: rotate(45deg) scale(.75);
      transition: transform .3s ${ease}, background-color .3s; }
    .rs-tick.on i { background: #fff; transform: rotate(45deg) scale(.9); }
    .rs-tick:hover i { transform: rotate(45deg) scale(1.15); }
    .rs-tick span { position: absolute; right: 18px; top: 50%; transform: translate(6px, -50%); opacity: 0; white-space: nowrap; pointer-events: none;
      font: 500 9.5px/1 "Montserrat", system-ui, sans-serif; letter-spacing: .22em; text-transform: uppercase; color: #fff;
      transition: opacity .25s, transform .35s ${ease}; }
    .rs-tick:hover span, .rs:hover .rs-tick.on span { opacity: 1; transform: translate(0, -50%); }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  document.documentElement.classList.add('has-rs');
  const bar = document.createElement('div'); bar.className = 'rs';
  bar.innerHTML = '<div class="rs-rail"></div><div class="rs-thumb"></div>';
  document.body.appendChild(bar);
  const thumb = bar.querySelector('.rs-thumb');

  // chapters: any section with a data-chapter name
  const chapters = [...document.querySelectorAll('[data-chapter]')].map(el => {
    const b = document.createElement('button'); b.className = 'rs-tick'; b.type = 'button';
    b.setAttribute('aria-label', 'Go to ' + el.dataset.chapter);
    b.innerHTML = `<i></i><span>${el.dataset.chapter}</span>`;
    b.addEventListener('click', () => { window.rimeJump = Date.now() + 2500; scrollTo({ top: el.offsetTop, behavior: 'smooth' }); });
    bar.appendChild(b);
    return { el, b };
  });

  let H = 0, max = 1;
  const layout = () => {
    H = bar.clientHeight; max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    chapters.forEach(c => { c.b.style.top = (Math.min(c.el.offsetTop, max) / max * H) + 'px'; });
    paint();
  };
  const paint = () => {
    const len = Math.max(28, H * innerHeight / (max + innerHeight));
    const f = scrollY / max;
    thumb.style.height = len + 'px'; thumb.style.top = (f * (H - len)) + 'px';
    let cur = 0; chapters.forEach((c, i) => { if (scrollY >= c.el.offsetTop - innerHeight * .4) cur = i; });
    chapters.forEach((c, i) => c.b.classList.toggle('on', i === cur));
  };

  // fades back when you stop scrolling
  let idle = 0;
  const wake = () => { bar.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => bar.classList.add('idle'), 1400); };
  addEventListener('scroll', () => { paint(); wake(); }, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  new ResizeObserver(layout).observe(document.body);
  layout(); wake();

  // drag the thumb, or click the rail to jump there
  let drag = null;
  thumb.addEventListener('pointerdown', e => {
    e.preventDefault(); thumb.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, s: scrollY }; bar.classList.add('drag'); window.rimeJump = Infinity;
  });
  thumb.addEventListener('pointermove', e => {
    if (!drag) return;
    const len = thumb.offsetHeight;
    scrollTo(0, drag.s + (e.clientY - drag.y) / (H - len) * max);
  });
  thumb.addEventListener('pointerup', () => { drag = null; bar.classList.remove('drag'); window.rimeJump = Date.now() + 300; });
  bar.addEventListener('pointerdown', e => {
    if (e.target !== bar && !e.target.classList.contains('rs-rail')) return;
    const r = bar.getBoundingClientRect();
    window.rimeJump = Date.now() + 2500;
    scrollTo({ top: (e.clientY - r.top) / H * max, behavior: 'smooth' });
  });

  /* the same rail and thumb for panels that scroll on their own (search results, the bag drawer) */
  document.head.insertAdjacentHTML('beforeend', `<style>
    .rs-in { scrollbar-width: none; } .rs-in::-webkit-scrollbar { display: none; }
    .rs-mini { position: absolute; z-index: 5; width: 10px; pointer-events: none; opacity: 0; transition: opacity .3s; }
    .rs-mini.on { opacity: 1; }
    .rs-mini::before { content: ""; position: absolute; top: 0; bottom: 0; right: 4px; width: 1px; background: rgba(13,13,13,.14); }
    .rs-mini i { position: absolute; right: 3.5px; width: 2px; border-radius: 2px; background: #0d0d0d; pointer-events: auto; cursor: grab;
      transition: width .3s ${ease}, right .3s ${ease}; }
    .rs-mini i:hover, .rs-mini.drag i { width: 4px; right: 2.5px; }
  </style>`);
  const mini = el => {
    if (el.rsMini) return; el.rsMini = true; el.classList.add('rs-in');
    const host = el.offsetParent || el.parentElement, rail = document.createElement('div'), th = document.createElement('i');
    rail.className = 'rs-mini'; rail.appendChild(th); host.appendChild(rail);
    const upd = () => {
      const h = el.clientHeight, sh = el.scrollHeight, over = sh > h + 2 && el.offsetParent;
      rail.classList.toggle('on', !!over); if (!over) return;
      const pad = 10, r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
      rail.style.top = (r.top - hr.top + pad) + 'px'; rail.style.height = (h - pad * 2) + 'px';
      rail.style.left = (r.right - hr.left - 12) + 'px';
      const H = h - pad * 2, len = Math.max(24, H * h / sh);
      th.style.height = len + 'px'; th.style.top = (el.scrollTop / (sh - h) * (H - len)) + 'px';
    };
    el.addEventListener('scroll', upd, { passive: true });
    new ResizeObserver(upd).observe(el); new MutationObserver(upd).observe(el, { childList: true, subtree: true });
    addEventListener('resize', upd); setInterval(upd, 600);   // also catches panels sliding open
    let d = null;
    th.addEventListener('pointerdown', e => { e.preventDefault(); th.setPointerCapture(e.pointerId); d = { y: e.clientY, s: el.scrollTop }; rail.classList.add('drag'); });
    th.addEventListener('pointermove', e => { if (!d) return; const H = rail.clientHeight - th.offsetHeight; el.scrollTop = d.s + (e.clientY - d.y) / H * (el.scrollHeight - el.clientHeight); });
    th.addEventListener('pointerup', () => { d = null; rail.classList.remove('drag'); });
    upd();
  };
  document.querySelectorAll('.fs-list, .bd-list').forEach(mini);
})();
