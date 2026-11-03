// The toolbox's live stages: each tool card plays a tiny story of itself while it's on screen, then loops.
// Built like the app's own cards (the same little components as the "Save ideas of all forms" shelf on mochiboard.app).
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOD = /Win|Linux/.test(navigator.platform) ? 'Ctrl' : '⌘';
  const IMG = 'image/mochiboard/tx/';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pop = (el, on = true) => { el.classList.remove('tx-pin', 'tx-pout'); void el.offsetWidth; el.classList.add(on ? 'tx-pin' : 'tx-pout'); };
  const card = (cls, inner, style = '') => `<div class="c ${cls}" style="${style}"><i class="fr"></i>${inner}</div>`;
  const type = async (el, text, w, ms = 45) => { for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await w(ms); } };
  const CURSOR = '<svg class="t-cur" viewBox="0 0 24 24"><path d="M5 3l14 8-6.5 1.6L9.5 19z"/></svg>';
  const WAVE = [.91, .77, .75, .2, .95, .72, .69, .69, .73, .17, .92, .73, 1, .93, .33, .87, .89, .71, .75, .76, .72, .77, .71, .99, .91, .15, .73, .8, .78, .94, .73, .51, .68, .7, .8, .5];
  const SHAPES = { star: 'M50 3 L62 36 L97 37 L69 58 L79 93 L50 72 L21 93 L31 58 L3 37 L38 36 Z', heart: 'M50 92 C20 72 3 55 3 33 C3 15 17 4 31 4 C40 4 47 9 50 16 C53 9 60 4 69 4 C83 4 97 15 97 33 C97 55 80 72 50 92 Z',
    circle: 'M50 2 A48 48 0 1 1 49.9 2 Z', tri: 'M50 4 L97 94 L3 94 Z', rect: 'M12 4 H88 Q96 4 96 12 V88 Q96 96 88 96 H12 Q4 96 4 88 V12 Q4 4 12 4 Z' };
  const FILLS = ['#f8e08a', '#ffb8d2', '#a8e6c3', '#aed3ff', '#cdb8ff'];
  const STAMPS = ['mochi-happy.png', 'px-heart.png', 'mochi-party.png', 'px-thumbsup.png', 'px-strawberry.png', 'mochi-love.png', 'px-star.png', 'px-rainbow.png'];
  const FOLDER = '<svg viewBox="0 0 20 20"><path d="M2.5 5.5a1 1 0 0 1 1-1h4l1.8 2h7.2a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"/></svg>';
  const BOARD = '<svg viewBox="0 0 20 20"><rect x="3" y="3.5" width="14" height="13" rx="2.5"/><path d="M3 8h14"/></svg>';

  // what each stage looks like
  const T = {
    notes: () => card('sn n1', '“The fees feel hidden.”', 'left:18px;top:18px;rotate:-5deg')
      + card('sn n2', 'Skipped the tutorial, then got lost', 'left:186px;top:34px;rotate:4deg')
      + card('sn n3', 'Checks the app every morning', 'left:84px;top:122px;rotate:-2deg'),
    capture: () => `<div class="kb"><span class="key">${MOD}</span><span class="key">K</span></div>`
      + card('bar', '<span class="cap-plus">+</span><b class="q"></b><i class="t-caret"></i>', 'left:26px;top:70px;width:288px')
      + card('uns', '<div class="uh">Unsorted <em>2</em></div><i class="ul"></i><i class="ul"></i><i class="ul fresh"></i>', 'left:196px;top:136px;width:126px')
      + '<div class="fly">call the bakery</div>',
    collections: () => card('coll', '<div class="ch">Penny ideas <em>2</em></div>', 'left:14px;top:22px;width:236px;height:140px')
      + '<div class="mn m1" style="left:28px;top:70px">round-ups</div><div class="mn m2" style="left:100px;top:70px;rotate:2deg">a savings ring</div>'
      + `<div class="mn m3 loose">card freeze${CURSOR}</div>`,
    docs: () => card('doc', '<div class="dh"></div><i class="ln" style="--w:92%"></i><i class="ln" style="--w:80%"></i><div class="dm">Open Sundays, so it feels <mark>cozy</mark>.</div><i class="ln b" style="--w:62%"></i><i class="ln b" style="--w:70%"></i>', 'left:62px;top:16px;width:216px;height:236px;rotate:-2deg'),
    checklists: () => card('todo', '<div class="head">This week</div><ul><li><i class="cb"></i><span>Interview 5 first-job folks</span></li><li><i class="cb"></i><span>Sketch the savings ring</span></li><li><i class="cb"></i><span>Design the card freeze</span></li><li><i class="cb"></i><span>Share with the team</span></li></ul><div class="add">+ add</div>', 'left:50%;top:50%;width:244px;translate:-50% -50%;rotate:-2deg'),
    titles: () => '<div class="ttl"><span class="tt"></span><i class="t-caret"></i><i class="hd h1"></i><i class="hd h2"></i><i class="hd h3"></i><i class="hd h4"></i></div><div class="tsub">Little bakery · saved</div>',
    voice: () => card('audio', `<div class="au-top"><span class="au-dot"></span><b class="au-title">Recording…</b><span class="au-time">0:00</span></div><div class="au-live">${'<i></i>'.repeat(24)}</div><div class="au-row"><span class="au-play"><svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg></span><div class="au-wave">${WAVE.map(v => `<i style="height:${Math.max(10, v * 100)}%"></i>`).join('')}</div></div><div class="au-tx"></div>`, 'left:50%;top:50%;width:276px;translate:-50% -50%'),
    video: () => card('video', `<div class="vd-screen"><video src="${IMG}mochi-cam.mp4" poster="${IMG}mochi-cam.jpg" muted loop playsinline preload="none"></video><span class="vd-count"></span><span class="vd-start">● Start recording</span><span class="vd-play"><svg viewBox="0 0 10 10"><path d="M2.5 1.2v7.6L9 5z"/></svg></span></div><div class="vd-bar"><span class="vd-dot"></span><b class="vd-label">Ready</b><span class="vd-time">0:00</span></div>`, 'left:50%;top:50%;width:104px;translate:-50% -50%;rotate:-3deg'),
    links: () => card('lk-url', '<svg viewBox="0 0 20 20"><path d="M8.5 11.5a3.2 3.2 0 0 0 4.5 0l2.6-2.6a3.2 3.2 0 0 0-4.5-4.5l-1 1M11.5 8.5a3.2 3.2 0 0 0-4.5 0l-2.6 2.6a3.2 3.2 0 0 0 4.5 4.5l1-1"/></svg><b class="u"></b><i class="t-caret"></i>', 'left:34px;top:18px;width:272px')
      + card('lk', `<div class="lk-img"><img src="image/mochiboard/icon.png" alt=""></div><div class="lk-t"><b>Mochiboard</b><small>A cozy planning canvas with Mochi inside</small><span>mochiboard.app</span></div>`, 'left:48px;top:76px;width:244px;rotate:2deg'),
    images: () => card('im-ph p1', `<img src="${IMG}mochi-wave.png" alt="">`, 'left:40px;top:26px;rotate:-6deg;--bg:#ffe0ec')
      + card('im-ph p2', `<img src="${IMG}mochi-party.png" alt="">`, 'left:178px;top:44px;rotate:5deg;--bg:#dcedff')
      + `<div class="im-file"><img src="${IMG}mochi-wave.png" alt=""><span>+</span>${CURSOR}</div>`,
    colors: () => card('sw-card s1', '<i style="background:#ff9ec4"></i><b>Blush</b><span>#FF9EC4</span>', 'left:56px;top:20px;rotate:-8deg')
      + card('sw-card s2', '<i style="background:#f8e08a"></i><b>Butter</b><span>#F8E08A</span>', 'left:180px;top:36px;rotate:6deg')
      + '<div class="toast">Copied #FF9EC4 ✓</div>',
    shapes: () => '<svg viewBox="0 0 100 100" class="shape"><path d=""/></svg>',
    stamps: () => '<div class="stampx"></div>',
    draw: () => `<svg viewBox="0 0 340 230" class="dw-ink"><path class="hl" d="M44 62 C 112 52, 186 58, 286 50" stroke="#3fbf86"/><path d="M168 82 L 192 150 L 128 108 L 208 108 L 144 150 Z" stroke="#f27aa8"/><path class="mk" d="M50 186 C 80 166, 100 206, 130 186 S 180 166, 210 186 S 260 206, 290 182" stroke="#f3c84a"/><path d="M252 96 C 252 82, 272 80, 274 94 C 276 80, 298 82, 296 96 C 294 114, 274 124, 274 132 C 274 124, 252 114, 252 96 Z" stroke="#ff7f6b"/></svg><span class="pen-tip"><svg viewBox="0 0 20 20"><path d="M13.5 3.5l3 3L8 15l-4 1 1-4z"/></svg></span>`,
    connectors: () => '<svg class="wires" viewBox="0 0 340 230"><defs><marker id="txArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1l7 4-7 4" fill="none" stroke="#494848" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><path class="w1" d="M118 52 C 150 52, 160 46, 190 46"/><path class="w2" d="M246 70 C 250 110, 230 130, 196 150"/></svg>'
      + card('sn k1', 'Sign up', 'left:20px;top:30px;--f:#fff5c8')
      + card('sn k2', 'Set a goal', 'left:196px;top:24px;--f:#ffe0ec')
      + card('sn k3', 'First round-up ✦', 'left:62px;top:144px;--f:#dcf5e7'),
    wireframes: () => '<div class="phone-wf"><div class="wf-name">Welcome</div><div class="wf-body"><i class="p bar"></i><i class="p img"></i><i class="p h1"></i><i class="p t1"></i><i class="p t2"></i><i class="p btn"></i><i class="p btn2"></i></div></div>',
    folders: () => card('fl-side', `<div class="sh">All projects</div><div class="fd">${FOLDER}Penny<i class="chev"></i></div><div class="bd">${BOARD}Research</div><div class="bd">${BOARD}Flows</div><div class="bd fresh">${BOARD}Launch</div><div class="fd f2">${FOLDER}Little bakery</div>`, 'left:22px;top:14px;width:190px')
      + `<div class="fl-chip">${BOARD}Launch${CURSOR}</div>`,
    layers: () => card('sn y y1', 'Ideas', 'left:62px;top:28px;--f:#ffe0ec;z-index:1')
      + card('sn y y2', 'Flows', 'left:112px;top:62px;--f:#fff5c8;z-index:2')
      + card('sn y y3', 'Launch', 'left:162px;top:96px;--f:#dcf5e7;z-index:3')
      + '<div class="ly-menu"><b>Bring to front</b><span>' + MOD + ' ]</span></div>',
    templates: () => '<div class="tabs"><span>Affinity map</span><span>Journey</span><span>How might we</span></div><div class="tpl-land"></div>',
  };
  // what each template lands as (the template stage cycles through them)
  const TPL = [
    '<div class="aff">' + [['Money', '#ffe0ec', ['fees feel hidden', 'saves for a trip']], ['Habits', '#fff5c8', ['checks every morning', 'forgets to budget']], ['Feelings', '#dcf5e7', ['scared of overdraft', 'proud of payday']]]
      .map(([h, c, ns]) => `<div class="col"><b>${h}</b>${ns.map(n => `<i style="background:${c}">${n}</i>`).join('')}</div>`).join('') + '</div>',
    '<div class="jr"><i class="line"></i>' + ['Hears about it', 'Signs up', 'First paycheck', 'Sets a goal'].map((s, i) => `<div class="st" style="left:${13 + i * 24.67}%"><i></i><span>${s}</span><em>${['😐', '🙂', '😍', '🎉'][i]}</em></div>`).join('') + '</div>',
    '<div class="hmw"><b>How might we make saving feel like a game?</b>' + ['streaks with Mochi', 'round-up confetti', 'a savings ring'].map((s, i) => `<i style="background:${['#ffe0ec', '#fff5c8', '#dcedff'][i]};rotate:${[-3, 2, -1][i]}deg">${s}</i>`).join('') + '</div>',
  ];

  // how each stage plays
  const R = {
    async notes(el, live, w) {
      const ns = [...el.querySelectorAll('.sn')];
      while (live()) { for (const n of ns) { pop(n); await w(420); } await w(2600); ns.forEach(n => pop(n, false)); await w(600); }
    },
    async capture(el, live, w) {
      const keys = [...el.querySelectorAll('.key')], bar = el.querySelector('.bar'), q = el.querySelector('.q'), n = el.querySelector('.uh em'), nw = el.querySelector('.ul.fresh'), fly = el.querySelector('.fly');
      while (live()) {
        q.textContent = ''; n.textContent = '2'; nw.classList.remove('shown'); fly.className = 'fly'; bar.style.opacity = 0;
        await w(700); keys.forEach(k => k.classList.add('down')); await w(260); keys.forEach(k => k.classList.remove('down'));
        pop(bar); await w(350); await type(q, 'call the bakery about cupcakes', w, 42); await w(500);
        pop(bar, false); fly.classList.add('on'); await w(60); fly.classList.add('run'); await w(650);
        fly.className = 'fly'; n.textContent = '3'; nw.classList.add('shown'); await w(2400);
      }
    },
    async collections(el, live, w) {
      const loose = el.querySelector('.loose'), n = el.querySelector('.ch em');
      while (live()) {
        loose.classList.remove('shown', 'drag'); n.textContent = '2'; await w(1300);
        loose.classList.add('drag'); await w(900); loose.classList.add('shown'); await w(520); loose.classList.remove('drag'); n.textContent = '3'; await w(2600);
      }
    },
    async docs(el, live, w) {
      const doc = el.querySelector('.doc'), h = el.querySelector('.dh');
      while (live()) {
        doc.classList.remove('s1', 's2', 's3'); h.textContent = ''; await w(500);
        await type(h, 'Launch plan', w, 70); await w(250);
        doc.classList.add('s1'); await w(900); doc.classList.add('s2'); await w(900); doc.classList.add('s3'); await w(2600);
      }
    },
    async checklists(el, live, w) {
      const li = [...el.querySelectorAll('li')];
      while (live()) { li.forEach(l => l.classList.remove('done')); await w(900); for (const l of li) { l.classList.add('done'); await w(850); } await w(2000); }
    },
    async titles(el, live, w) {
      const box = el.querySelector('.ttl'), t = el.querySelector('.tt');
      while (live()) {
        box.classList.remove('sel', 'big'); t.textContent = ''; await w(500);
        await type(t, 'Little bakery plan', w, 65); await w(600);
        box.classList.add('sel'); await w(800); box.classList.add('big'); await w(2800);
      }
    },
    async voice(el, live, w) {
      const card = el.querySelector('.audio'), bars = [...el.querySelectorAll('.au-live i')], time = el.querySelector('.au-time'), title = el.querySelector('.au-title'), ws = [...el.querySelectorAll('.au-wave i')], tx = el.querySelector('.au-tx');
      const TX = 'Okay, idea for Penny. What if round-ups throw a little confetti when you hit a goal?';
      while (live()) {
        el.classList.remove('done'); title.textContent = 'Recording…'; time.textContent = '0:00'; tx.textContent = ''; ws.forEach(x => x.classList.remove('past')); pop(card);
        const t0 = Date.now(); let k = 0;
        while (Date.now() - t0 < 3600 && live()) { bars.forEach((b, i) => b.style.height = (14 + Math.abs(Math.sin(k * .7 + i * .9)) * 70 * WAVE[(k + i) % WAVE.length]) + '%'); time.textContent = '0:0' + Math.floor((Date.now() - t0) / 400); k++; await w(110); }
        el.classList.add('done'); title.textContent = 'Voice memo · Oct 22'; time.textContent = '0:09';
        for (let i = 0; i <= TX.length && live(); i += 2) { tx.textContent = TX.slice(0, i); await w(28); }
        for (let i = 0; i < ws.length && live(); i++) { ws[i].classList.add('past'); time.textContent = `0:0${Math.floor(i / ws.length * 9)} / 0:09`; await w(70); }
        await w(1600); pop(card, false); await w(500);
      }
    },
    // Start recording → 3, 2, 1 → Mochi waves on camera with a ticking timer → saved with a play button
    async video(el, live, w) {
      const v = el.querySelector('video'), count = el.querySelector('.vd-count'), dot = el.querySelector('.vd-dot'), label = el.querySelector('.vd-label'), time = el.querySelector('.vd-time');
      const set = (cls, txt, t) => { el.classList.remove('counting', 'rec', 'saved'); if (cls) el.classList.add(cls); label.textContent = txt; time.textContent = t; dot.classList.toggle('on', cls === 'rec'); };
      v.preload = 'auto';
      while (live()) {
        set('', 'Ready', '0:00'); v.currentTime = 0; v.play().catch(() => {}); await w(1600);
        set('counting', 'Starting…', '0:00');
        for (const n of [3, 2, 1]) { count.textContent = n; count.classList.remove('run'); void count.offsetWidth; count.classList.add('run'); await w(800); }
        v.currentTime = 0; set('rec', 'Recording', '0:00');
        for (let s = 1; s <= 5; s++) { await w(1000); time.textContent = `0:0${s}`; }
        v.pause(); set('saved', 'Hi from Mochi', '0:05'); await w(2600);
      }
    },
    async links(el, live, w) {
      const u = el.querySelector('.u'), lk = el.querySelector('.lk');
      while (live()) { u.textContent = ''; lk.style.opacity = 0; await w(600); await type(u, 'mochiboard.app', w, 70); await w(450); pop(lk); await w(3000); pop(lk, false); await w(400); }
    },
    async images(el, live, w) {
      const file = el.querySelector('.im-file'), ps = [...el.querySelectorAll('.im-ph')];
      while (live()) {
        ps.forEach(p => p.style.opacity = 0); file.className = 'im-file'; await w(500);
        file.classList.add('run'); await w(1100); file.classList.add('drop'); pop(ps[0]); await w(500);
        file.className = 'im-file'; await w(300); pop(ps[1]); await w(2800); ps.forEach(p => pop(p, false)); await w(450);
      }
    },
    async colors(el, live, w) {
      const toast = el.querySelector('.toast'), hex = ['#FF9EC4', '#F8E08A'];
      for (let i = 0; live(); i++) { await w(1800); toast.textContent = `Copied ${hex[i % 2]} ✓`; pop(toast); await w(1500); pop(toast, false); }
    },
    async shapes(el, live, w) {
      const svg = el.querySelector('.shape'), path = svg.querySelector('path'), K = Object.keys(SHAPES);
      for (let i = 0; live(); i++) { path.setAttribute('d', SHAPES[K[i % K.length]]); path.style.fill = FILLS[i % FILLS.length]; svg.style.rotate = [-8, 6, 0, -4, 5][i % 5] + 'deg'; svg.classList.remove('swap'); void svg.offsetWidth; svg.classList.add('swap'); await w(1300); }
    },
    async stamps(el, live, w) {
      const box = el.querySelector('.stampx');
      for (let i = 0; live(); i++) { box.innerHTML = `<img src="${IMG}${STAMPS[i % STAMPS.length]}" alt="">`; box.classList.remove('run'); void box.offsetWidth; box.classList.add('run'); await w(1100); }
    },
    async draw(el, live, w) {
      const ps = [...el.querySelectorAll('.dw-ink path')], tip = el.querySelector('.pen-tip'), svg = el.querySelector('.dw-ink'), stage = el.querySelector('.tx-in');
      while (live()) {
        ps.forEach(p => { p.style.transition = 'none'; p.style.strokeDasharray = p.getTotalLength(); p.style.strokeDashoffset = p.getTotalLength(); }); tip.style.opacity = 1;
        for (const p of ps) {
          const L = p.getTotalLength(), d = 900 + L * 2, t0 = performance.now();
          await new Promise(res => { const f = now => { const k = Math.min(1, (now - t0) / d), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            p.style.strokeDashoffset = L * (1 - e); const pt = p.getPointAtLength(L * e), r = stage.getBoundingClientRect(), sp = new DOMPoint(pt.x, pt.y).matrixTransform(svg.getScreenCTM()), s = r.width / 340;
            tip.style.left = (sp.x - r.left) / s + 'px'; tip.style.top = (sp.y - r.top) / s + 'px';
            k < 1 && live() ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
          await w(150);
        }
        tip.style.opacity = 0; await w(2200);
        ps.forEach(p => { p.style.transition = 'stroke-dashoffset .5s ease'; p.style.strokeDashoffset = p.getTotalLength(); }); await w(700);
      }
    },
    async connectors(el, live, w) {
      const ws = [...el.querySelectorAll('.wires path')], ns = [...el.querySelectorAll('.sn')];
      while (live()) {
        ws.forEach(p => { p.style.transition = 'none'; p.style.strokeDasharray = p.getTotalLength(); p.style.strokeDashoffset = p.getTotalLength(); p.removeAttribute('marker-end'); });
        ns.forEach(n => pop(n)); await w(900);
        for (const p of ws) { void p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset .8s cubic-bezier(.5, 0, .3, 1)'; p.style.strokeDashoffset = 0; await w(760); p.setAttribute('marker-end', 'url(#txArrow)'); await w(300); }
        await w(2400); ns.forEach(n => pop(n, false)); ws.forEach(p => p.removeAttribute('marker-end')); ws.forEach(p => { p.style.transition = 'stroke-dashoffset .3s'; p.style.strokeDashoffset = p.getTotalLength(); }); await w(500);
      }
    },
    async wireframes(el, live, w) {
      const ps = [...el.querySelectorAll('.wf-body .p')];
      while (live()) { ps.forEach(p => p.classList.remove('shown')); await w(500); for (const p of ps) { p.classList.add('shown'); await w(380); } await w(2600); }
    },
    async folders(el, live, w) {
      const side = el.querySelector('.fl-side'), chip = el.querySelector('.fl-chip');
      while (live()) {
        side.classList.remove('open', 'got'); chip.className = 'fl-chip'; await w(900);
        side.classList.add('open'); await w(1000); chip.classList.add('run'); await w(1100);
        chip.classList.add('gone'); side.classList.add('got'); await w(2600);
      }
    },
    async layers(el, live, w) {
      const ns = [...el.querySelectorAll('.y')], menu = el.querySelector('.ly-menu');
      const z = n => +n.style.zIndex;
      while (live()) {
        await w(1200);
        const back = ns.reduce((a, b) => z(a) < z(b) ? a : b), r = back.offsetLeft, t = back.offsetTop;
        back.classList.add('chosen'); menu.style.left = r + 70 + 'px'; menu.style.top = t + 12 + 'px'; pop(menu); await w(1000);
        pop(menu, false); ns.forEach(n => n.style.zIndex = z(n) - 1); back.style.zIndex = 3; back.classList.remove('hop'); void back.offsetWidth; back.classList.add('hop'); await w(700);
        back.classList.remove('chosen'); await w(900);
      }
    },
    async templates(el, live, w) {
      const tabs = [...el.querySelectorAll('.tabs span')], land = el.querySelector('.tpl-land');
      for (let i = 0; live(); i++) {
        const k = i % TPL.length; tabs.forEach((t, j) => t.classList.toggle('on', j === k));
        land.innerHTML = TPL[k]; land.querySelectorAll('i, .st, b').forEach((x, j) => { x.style.animationDelay = j * 110 + 'ms'; });
        land.classList.remove('run'); void land.offsetWidth; land.classList.add('run'); await w(3600);
      }
    },
  };

  document.querySelectorAll('.tx[data-tx]').forEach(el => {
    const key = el.dataset.tx; if (!T[key]) return;
    el.innerHTML = `<div class="tx-in c-${key}">${T[key]()}</div>`;
    const inner = el.firstChild, fit = () => el.style.setProperty('--k', el.clientWidth / 340);
    fit(); new ResizeObserver(fit).observe(el);
    if (calm) { inner.classList.add('still'); el.classList.add('done'); inner.querySelectorAll('.p').forEach(x => x.classList.add('shown')); return; }
    let token = 0;
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const my = ++token, live = () => token === my, w = async ms => { await wait(ms); if (!live()) throw 'stale'; }; R[key](el, live, w).catch(() => {}); } else token++;
    }), { threshold: .3 }).observe(el);
  });
})();
