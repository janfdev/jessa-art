/* Floating search: any "Search" link (href ends in #search), or the / key, drops a frosted glass search bar in from above
   the page. It filters the gear live; Enter or a click opens the product. Esc, the backdrop, or the × closes it. */
(() => {
  const GEAR = Object.entries(window.RIME_GEAR || {}).map(([k, o]) => [k, o.name, o.what, o.price]);
  const ease = 'cubic-bezier(.2,.85,.25,1)';
  const css = `
    .fs-back { position: fixed; inset: 0; z-index: 60; background: rgba(245,245,245,.35);
      -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; visibility: hidden; transition: opacity .35s, visibility 0s .35s; }
    .fs { position: fixed; z-index: 61; left: 50%; top: 92px; width: min(640px, calc(100vw - 32px));
      transform: translate(-50%, -26px) scale(.97); filter: blur(6px); opacity: 0; visibility: hidden;
      transition: transform .55s ${ease}, opacity .3s, filter .4s, visibility 0s .55s; }
    .fs-open .fs-back { opacity: 1; visibility: visible; transition: opacity .35s; }
    .fs-open .fs { transform: translate(-50%, 0) scale(1); filter: none; opacity: 1; visibility: visible; transition: transform .55s ${ease}, opacity .3s, filter .4s; }
    .fs-glass { background: linear-gradient(115deg, rgba(255,255,255,.75) 0%, rgba(255,255,255,0) 45%), rgba(255,255,255,.55);
      -webkit-backdrop-filter: blur(22px) saturate(120%); backdrop-filter: blur(22px) saturate(120%);
      border: 1px solid rgba(255,255,255,.9); box-shadow: inset 0 1px 0 #fff, 0 40px 80px -40px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.05); }
    .fs-bar { display: flex; align-items: center; gap: 14px; height: 62px; padding: 0 12px 0 24px; border-radius: 999px; }
    .fs-bar svg { flex: none; width: 15px; height: 15px; fill: none; stroke: #0d0d0d; stroke-width: 1.3; }
    .fs-bar input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; color: #0d0d0d;
      font: 500 13px/1 "Montserrat", system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
    .fs-bar input::placeholder { color: #8a8a8a; }
    .fs-bar input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }   /* our own × does this */
    .fs-x { flex: none; width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(13,13,13,.06); cursor: pointer;
      display: grid; place-items: center; transition: background .25s; }
    .fs-x:hover { background: rgba(13,13,13,.12); }
    .fs-x svg { width: 10px; height: 10px; stroke-width: 1.4; }
    .fs-list { margin-top: 10px; border-radius: 22px; padding: 8px; max-height: min(60vh, 460px); overflow: auto; }
    .fs-list:empty { display: none; }
    .fs-hint { padding: 12px 16px 6px; font: 500 10px/1 "Montserrat", sans-serif; letter-spacing: .22em; text-transform: uppercase; color: #8a8a8a; }
    .fs-item { display: grid; grid-template-columns: 52px 1fr auto; align-items: center; gap: 16px; padding: 8px 16px 8px 8px; border-radius: 14px;
      color: #0d0d0d; text-decoration: none; font: 500 11px/1.4 "Montserrat", sans-serif; letter-spacing: .12em; text-transform: uppercase;
      opacity: 0; transform: translateY(-6px); transition: background .2s; }
    .fs-open .fs-item { animation: fsIn .45s ${ease} forwards; animation-delay: calc(var(--i) * 35ms + 120ms); }
    @keyframes fsIn { to { opacity: 1; transform: none; } }
    .fs-item img { width: 52px; height: 52px; object-fit: contain; border-radius: 10px; background: rgba(255,255,255,.7); padding: 6px; }
    .fs-item small { display: block; color: #777; font-size: 9.5px; letter-spacing: .16em; margin-top: 2px; }
    .fs-item.on, .fs-item:hover { background: rgba(13,13,13,.06); }
    .fs-none { padding: 18px 16px; font: 400 13px/1.5 "Montserrat", sans-serif; color: #6b6b6b; }
    @media (prefers-reduced-motion: reduce) { .fs, .fs-open .fs-item { transition: none; animation: none; opacity: 1; transform: translate(-50%, 0); filter: none; } .fs-item { opacity: 1; transform: none; } }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="fs-back" id="fsBack"></div>
    <div class="fs" id="fs" role="dialog" aria-modal="true" aria-label="Search">
      <form class="fs-bar fs-glass" id="fsForm" role="search">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5.2"/><path d="M11 11l4 4"/></svg>
        <input id="fsInput" type="search" placeholder="Search gear" autocomplete="off" aria-label="Search gear" aria-controls="fsList">
        <button class="fs-x" type="button" id="fsX" aria-label="Close search"><svg viewBox="0 0 10 10" aria-hidden="true" style="fill:none;stroke:#0d0d0d"><path d="M1 1l8 8M9 1l-8 8"/></svg></button>
      </form>
      <div class="fs-list fs-glass" id="fsList" role="listbox"></div>
    </div>`);
  const root = document.documentElement, input = document.getElementById('fsInput'), list = document.getElementById('fsList');
  let sel = 0, shown = [];

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = GEAR.filter(g => !q || (g[1] + ' ' + g[2]).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = (q ? '' : '<div class="fs-hint">All gear</div>') + (shown.length
      ? shown.map((g, i) => `<a class="fs-item${i === sel ? ' on' : ''}" role="option" style="--i:${i}" href="product.html?p=${g[0]}">
          <img src="products/${g[0]}.webp" alt=""><span>${g[1]}<small>${g[2]}</small></span><span>${g[3]}</span></a>`).join('')
      : `<div class="fs-none">Nothing for “${input.value.trim()}” yet. Try tent, rope or shell.</div>`);
  };
  const open = () => {
    root.classList.remove('menu-open');                       // close the phone menu if it's up
    input.value = ''; sel = 0; render();
    root.classList.add('fs-open');
    setTimeout(() => input.focus({ preventScroll: true }), 60);
  };
  const close = () => { root.classList.remove('fs-open'); input.blur(); };

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href$="#search"]');
    if (a) { e.preventDefault(); open(); }
  });
  document.getElementById('fsBack').addEventListener('click', close);
  document.getElementById('fsX').addEventListener('click', close);
  input.addEventListener('input', () => { sel = 0; render(); });
  document.getElementById('fsForm').addEventListener('submit', e => {
    e.preventDefault();
    if (shown[sel]) location.href = 'product.html?p=' + shown[sel][0];
  });
  addEventListener('keydown', e => {
    const isOpen = root.classList.contains('fs-open');
    if (!isOpen && e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); return; }
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % Math.max(1, shown.length);
      list.querySelectorAll('.fs-item').forEach((el, i) => el.classList.toggle('on', i === sel));
    }
  });
})();
