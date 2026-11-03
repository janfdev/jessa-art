/* Rime bag: one shared bag for every page, kept in this browser's localStorage.
   It keeps every "Bag (n)" link in step and sends them to bag.html; the Account link goes to account.html. */
(() => {
  const KEY = 'rime-bag';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const write = b => { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {} paint(); dispatchEvent(new Event('rimebag')); };
  const count = () => Object.values(read()).reduce((a, n) => a + n, 0);
  const paint = () => document.querySelectorAll('a[href$="#bag"], a[href="bag.html"]').forEach(a => {
    a.href = 'bag.html'; a.textContent = `Bag (${count()})`;
  });
  window.RimeBag = {
    items: read,
    count,
    add(id, n = 1) { const b = read(); b[id] = (b[id] || 0) + n; write(b); },
    set(id, n) { const b = read(); if (n > 0) b[id] = n; else delete b[id]; write(b); },
    clear() { write({}); },
  };
  document.querySelectorAll('a[href$="#account"]').forEach(a => a.href = 'account.html');
  paint();

  /* the bag drawer: Bag (and Add to bag) slides a glass panel in from the right first;
     from there, View bag goes to bag.html and Checkout goes straight to its checkout step. */
  const onBagPage = /bag\.html$/.test(location.pathname);
  const G = window.RIME_GEAR || {};
  const num = s => +String(s).replace(/[^0-9.]/g, '');
  const money = n => '$' + n.toLocaleString('en-US');
  const ease = 'cubic-bezier(.2,.85,.25,1)';
  document.head.insertAdjacentHTML('beforeend', `<style>
    .bd-back { position: fixed; inset: 0; z-index: 90; background: rgba(245,245,245,.35); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px);
      opacity: 0; visibility: hidden; transition: opacity .35s, visibility 0s .35s; }
    .bd { position: fixed; z-index: 91; top: 12px; right: 12px; bottom: 12px; width: min(420px, calc(100vw - 24px)); display: grid; grid-template-rows: auto 1fr auto;
      border-radius: 24px; color: #0d0d0d; font: 400 14px/1.5 "Montserrat", system-ui, sans-serif;
      background: linear-gradient(115deg, rgba(255,255,255,.85), rgba(255,255,255,.4) 50%), rgba(245,245,245,.72);
      -webkit-backdrop-filter: blur(24px) saturate(120%); backdrop-filter: blur(24px) saturate(120%);
      border: 1px solid rgba(255,255,255,.95); box-shadow: inset 0 1px 0 #fff, 0 40px 90px -30px rgba(0,0,0,.4);
      transform: translateX(calc(100% + 24px)); transition: transform .6s ${ease}; }
    html.bd-open .bd-back { opacity: 1; visibility: visible; transition: opacity .35s; }
    html.bd-open .bd { transform: none; }
    .bd-h { display: flex; justify-content: space-between; align-items: center; padding: 22px 22px 16px 26px; border-bottom: 1px solid rgba(13,13,13,.08); }
    .bd-h b { font: 500 11px/1 "Montserrat", sans-serif; letter-spacing: .24em; text-transform: uppercase; }
    .bd-x { width: 38px; height: 38px; border-radius: 50%; border: 0; background: rgba(13,13,13,.06); cursor: pointer; display: grid; place-items: center; }
    .bd-x:hover { background: rgba(13,13,13,.12); }
    .bd-x svg { width: 10px; height: 10px; fill: none; stroke: #0d0d0d; stroke-width: 1.4; }
    .bd-list { overflow: auto; padding: 10px 14px; }
    .bd-it { display: grid; grid-template-columns: 74px 1fr auto; gap: 14px; align-items: center; padding: 10px 12px; border-radius: 16px; opacity: 0; transform: translateX(16px); }
    html.bd-open .bd-it { animation: bdIn .5s ${ease} forwards; animation-delay: calc(var(--i) * 50ms + 150ms); }
    @keyframes bdIn { to { opacity: 1; transform: none; } }
    .bd-it.new { background: rgba(255,255,255,.7); }
    .bd-it .ph { width: 74px; aspect-ratio: 1; border-radius: 12px; background: rgba(255,255,255,.8); padding: 8px; display: grid; place-items: center; }
    .bd-it img { width: 100%; height: 100%; object-fit: contain; }
    .bd-it .nm { font: 500 11px/1.35 "Montserrat", sans-serif; letter-spacing: .12em; text-transform: uppercase; }
    .bd-it small { display: block; color: #777; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; margin-top: 3px; }
    .bd-q { display: inline-flex; align-items: center; gap: 2px; margin-top: 8px; border: 1px solid rgba(13,13,13,.15); border-radius: 999px; padding: 2px; }
    .bd-q button { width: 26px; height: 26px; border: 0; border-radius: 50%; background: none; cursor: pointer; font-size: 14px; color: #0d0d0d; }
    .bd-q button:hover { background: rgba(13,13,13,.07); }
    .bd-q span { min-width: 18px; text-align: center; font-size: 12px; }
    .bd-it .pr { font-size: 13px; white-space: nowrap; align-self: start; padding-top: 4px; }
    .bd-empty { padding: 50px 20px; text-align: center; color: #555; }
    .bd-f { padding: 18px 22px 22px; border-top: 1px solid rgba(13,13,13,.08); }
    .bd-sum { display: flex; justify-content: space-between; font-size: 16px; letter-spacing: .03em; }
    .bd-f small { display: block; margin: 6px 0 16px; color: #6b6b6b; font-size: 11.5px; }
    .bd-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .bd-btns a { display: flex; justify-content: center; align-items: center; height: 52px; border-radius: 999px; border: 1px solid #0d0d0d; text-decoration: none;
      font: 500 10.5px/1 "Montserrat", sans-serif; letter-spacing: .22em; text-transform: uppercase; transition: background .25s, color .25s; }
    .bd-btns .ghost { color: #0d0d0d; } .bd-btns .ghost:hover { background: #0d0d0d; color: #fff; }
    .bd-btns .solid { background: #0d0d0d; color: #fff; } .bd-btns .solid:hover { background: #333; }
    @media (prefers-reduced-motion: reduce) { .bd, .bd-it { transition: none; animation: none; opacity: 1; transform: none; } html:not(.bd-open) .bd { visibility: hidden; } }
  </style>`);
  document.body.insertAdjacentHTML('beforeend', `<div class="bd-back" id="bdBack"></div>
    <aside class="bd" id="bd" role="dialog" aria-modal="true" aria-label="Your bag" tabindex="-1">
      <div class="bd-h"><b id="bdTitle">Bag</b><button class="bd-x" id="bdX" aria-label="Close bag"><svg viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8"/></svg></button></div>
      <div class="bd-list" id="bdList"></div>
      <div class="bd-f" id="bdFoot"></div>
    </aside>`);
  const root = document.documentElement, $ = id => document.getElementById(id);
  let fresh = null;
  const render = () => {
    const L = Object.entries(read()).filter(([k]) => G[k]);
    $('bdTitle').textContent = `Bag (${count()})`;
    if (!L.length) {
      $('bdList').innerHTML = `<div class="bd-empty">Your bag is empty.<br>Start with what he carries to the top.</div>`;
      $('bdFoot').innerHTML = `<div class="bd-btns" style="grid-template-columns:1fr"><a class="solid" href="index.html#shop">Shop the kit</a></div>`;
      return;
    }
    const sub = L.reduce((a, [k, n]) => a + num(G[k].price) * n, 0);
    $('bdList').innerHTML = L.map(([k, n], i) => `<div class="bd-it${k === fresh ? ' new' : ''}" style="--i:${i}">
        <a class="ph" href="product.html?p=${k}"><img src="products/${k}.webp" alt=""></a>
        <div><div class="nm">${G[k].name}</div><small>${G[k].what}</small>
          <span class="bd-q"><button data-k="${k}" data-q="-1" aria-label="One fewer">&minus;</button><span>${n}</span><button data-k="${k}" data-q="1" aria-label="One more">+</button></span></div>
        <div class="pr">${money(num(G[k].price) * n)}</div></div>`).join('');
    $('bdFoot').innerHTML = `<div class="bd-sum"><span>Subtotal</span><span>${money(sub)}</span></div>
      <small>Free delivery over $250 &middot; lifetime repairs on every piece</small>
      <div class="bd-btns"><a class="ghost" href="bag.html">View bag</a><a class="solid" href="bag.html#checkout">Checkout</a></div>`;
    $('bdList').querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      window.RimeBag.set(b.dataset.k, (read()[b.dataset.k] || 0) + +b.dataset.q);
      render(); $('bdList').querySelectorAll('.bd-it').forEach(el => { el.style.animation = 'none'; el.style.opacity = 1; el.style.transform = 'none'; });
    });
  };
  const open = id => {
    fresh = id || null; render();
    root.classList.remove('menu-open', 'fs-open');
    root.classList.add('bd-open'); setTimeout(() => $('bd').focus({ preventScroll: true }), 50);
  };
  const close = () => root.classList.remove('bd-open');
  window.RimeBag.open = open;
  $('bdBack').onclick = close; $('bdX').onclick = close;
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('bd-open')) close(); });
  // the Bag link opens the drawer (on the bag page itself it just goes there)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="bag.html"]');
    if (!a || onBagPage || a.closest('.bd')) return;
    e.preventDefault(); open();
  });
  addEventListener('storage', e => { if (e.key === KEY) paint(); });   // another tab changed the bag
})();
