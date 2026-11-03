/* Rime cursor: a small solid diamond that tracks exactly, and a thin diamond outline that follows with a little lag
   (a nod to the peak in the logo). The outline leans with your movement and squares up when you stop.
   Over a product it opens into a frosted glass diamond that says View; over links and big type it widens; on press it tightens.
   It uses difference blending so it stays visible on the grey sky and on the dark climber alike. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const ease = 'cubic-bezier(.2,.8,.2,1)';
  const css = `
    html.rime-cursor, html.rime-cursor * { cursor: none !important; }
    .rc-dot, .rc-ring { position: fixed; left: 0; top: 0; z-index: 9999; pointer-events: none; will-change: transform; }
    .rc-dot { width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; mix-blend-mode: difference; transition: opacity .2s; }
    .rc-dot i { display: block; width: 100%; height: 100%; background: #fff; transform: rotate(45deg); }
    .rc-ring { --s: 30px; width: var(--s); height: var(--s); margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
      display: grid; place-items: center; mix-blend-mode: difference;
      transition: width .45s ${ease}, height .45s ${ease}, margin .45s ${ease}, opacity .3s; }
    /* the diamond itself: a square turned 45°, plus the lean from movement */
    .rc-ring b { position: absolute; inset: 0; border: 1px solid #fff; border-radius: 2px;
      transform: rotate(calc(45deg + var(--lean, 0deg))) scale(var(--sq, 1));
      transition: background-color .35s, border-color .35s, box-shadow .35s; }
    .rc-ring span { position: relative; font: 500 9px/1 "Montserrat", system-ui, sans-serif; letter-spacing: .24em; text-indent: .24em;
      text-transform: uppercase; color: #0d0d0d; opacity: 0; transform: scale(.6); transition: opacity .25s, transform .4s ${ease}; }
    /* on a product: a frosted glass diamond with a label, no blending so it reads as glass */
    .rc-ring.view { --s: 76px; mix-blend-mode: normal; }
    .rc-ring.view b { border-color: rgba(255,255,255,.95); background-color: rgba(255,255,255,.5);
      -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: inset 0 1px 0 #fff, 0 14px 30px -14px rgba(0,0,0,.35); }
    .rc-ring.view span { opacity: 1; transform: none; }
    .rc-dot.view { opacity: 0; }
    .rc-ring.link { --s: 44px; }
    .rc-ring.big { --s: 84px; }
    .rc-ring.down { --s: 20px; }
    .rc-ring.view.down { --s: 64px; }
    .rc-hidden { opacity: 0 !important; }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  const dot = document.createElement('div'), ring = document.createElement('div');
  dot.className = 'rc-dot rc-hidden'; dot.innerHTML = '<i></i>';
  ring.className = 'rc-ring rc-hidden'; ring.innerHTML = '<b></b><span>View</span>';
  document.body.append(dot, ring);
  document.documentElement.classList.add('rime-cursor');

  let x = -100, y = -100, rx = -100, ry = -100, lean = 0, sq = 1, seen = false;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; rx = x; ry = y; dot.classList.remove('rc-hidden'); ring.classList.remove('rc-hidden'); }
    const t = e.target;
    const view = !!t.closest('.gear, .card, .row a, .stage, .row, .pin, .mini, .saved a, .item .ph, .pol, .sketch');
    const big = !view && !!t.closest('.summit-copy h2, .word, .shop-head h2, .climb-copy h2');
    const link = !view && !big && !!t.closest('a, button, .rs');
    ring.classList.toggle('view', view); dot.classList.toggle('view', view);
    ring.classList.toggle('big', big); ring.classList.toggle('link', link);
  });
  document.addEventListener('pointerleave', () => { dot.classList.add('rc-hidden'); ring.classList.add('rc-hidden'); seen = false; });
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  const tick = () => {
    const vx = x - rx, vy = y - ry;
    rx += vx * .18; ry += vy * .18;
    // lean into horizontal movement and stretch a touch with speed, then settle back to a crisp diamond
    lean += (Math.max(-25, Math.min(25, vx * .6)) - lean) * .15;
    sq += (1 + Math.min(.18, Math.hypot(vx, vy) * .004) - sq) * .2;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    ring.style.setProperty('--lean', lean.toFixed(2) + 'deg');
    ring.style.setProperty('--sq', sq.toFixed(3));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
