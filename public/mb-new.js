// "Since launch" live pieces: Dress up Mochi (the app's real wardrobe, via mb-goo.js) and Mochi's music (the app's real loops).
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Dress up Mochi: hover to try things on, click to wear them ----------
  const du = document.querySelector('.du');
  if (du && window.MOCHI_WARDROBE) {
    const WARD = MOCHI_WARDROBE, PAL = MOCHI_PAL;
    const COLORS = { sky: ['#33c7ff', '#ccf5ff', '#1480db'], pink: ['#ff8fc2', '#ffe0ee', '#e0559a'], mint: ['#5fdba0', '#d9fbe9', '#2fae73'], lilac: ['#b49bff', '#ece5ff', '#7e5ee6'], butter: ['#ffd54f', '#fff4c4', '#e0a800'] };
    const TABS = [['hat', 'Hats'], ['face', 'Face'], ['neck', 'Neck'], ['held', 'Hold'], ['color', 'Color']];
    const NICE = ['so cute!', 'iconic', 'a look!', 'squish!', 'love it', 'fancy!', 'yes!!'];
    const tabsEl = du.querySelector('.du-tabs'), items = du.querySelector('.du-items'), say = du.querySelector('.du-say'), cv = du.querySelector('canvas');
    let fit = { hat: 'party' }, preview = null, tab = 'hat', sayT;
    const colors = k => { const c = COLORS[k] || COLORS.sky; return { B: c[0], S: c[1], D: c[2] }; };
    const goo = Goo(cv, { wearing: () => preview ? { ...fit, ...preview } : fit, colors: colors(fit.color) });
    const cheer = text => { if (!calm) goo.hop(); say.textContent = text || NICE[Math.floor(Math.random() * NICE.length)]; say.classList.add('on'); clearTimeout(sayT); sayT = setTimeout(() => say.classList.remove('on'), 1400); };
    const thumb = (kind, key) => {   // the piece as big as it fits, whole pixels only
      const c = document.createElement('canvas'), S = 96; c.width = c.height = S; const x = c.getContext('2d');
      const rows = WARD[kind][key][3], w = Math.max(...rows.map(r => r.length)), h = rows.length, cell = Math.max(2, Math.floor(Math.min(80 / w, 72 / h)));
      const ox = Math.round((S - w * cell) / 2), oy = Math.round((S - h * cell) / 2);
      x.shadowColor = 'rgba(110, 60, 100, .22)'; x.shadowOffsetY = Math.max(1, cell / 3);
      rows.forEach((r, yy) => [...r].forEach((ch, xx) => { if (ch !== '.' && PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(ox + xx * cell, oy + yy * cell, cell, cell); } }));
      return c;
    };
    const render = () => {
      tabsEl.innerHTML = TABS.map(([k, l]) => `<button type="button" data-t="${k}" class="${k === tab ? 'on' : ''}" aria-pressed="${k === tab}">${l}</button>`).join('');
      items.innerHTML = '';
      const add = (kind, key, label, visual) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'du-item' + ((fit[kind] || (kind === 'color' ? 'sky' : null)) === key ? ' on' : '');
        Object.assign(b.dataset, { kind, key }); b.title = label; b.setAttribute('aria-label', label); b.append(visual); items.append(b); };
      if (tab === 'color') Object.entries(COLORS).forEach(([k, c]) => { const sw = document.createElement('span'); sw.className = 'du-sw'; sw.style.background = `linear-gradient(160deg, ${c[1]} 0 22%, ${c[0]} 22% 78%, ${c[2]} 78%)`; add('color', k, k[0].toUpperCase() + k.slice(1), sw); });
      else Object.entries(WARD[tab]).forEach(([k, sp]) => add(tab, k, sp[0], thumb(tab, k)));
    };
    tabsEl.onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; render(); } };
    items.addEventListener('pointerover', e => { const b = e.target.closest('.du-item'); if (!b || e.pointerType === 'touch') return;
      if (b.dataset.kind === 'color') goo.setColors(colors(b.dataset.key)); else preview = { [b.dataset.kind]: b.dataset.key }; });
    items.addEventListener('pointerleave', () => { preview = null; goo.setColors(colors(fit.color)); });
    items.onclick = e => {
      const b = e.target.closest('.du-item'); if (!b) return; const { kind, key } = b.dataset;
      if (kind === 'color') fit.color = key; else fit[kind] = fit[kind] === key ? null : key;
      preview = null; goo.setColors(colors(fit.color)); render(); if (fit[kind]) cheer();
    };
    cv.onclick = () => cheer();
    render();
  }

  // ---------- What people are saying: a row you can swipe (or drag with a mouse); Mochi hops into a new outfit for each new comment ----------
  const track = document.querySelector('.lv-track'), lvc = document.querySelector('.lv-goo');
  if (track) {
    const cards = [...track.querySelectorAll('.lv')], prev = document.querySelector('.lv-prev'), next = document.querySelector('.lv-next');
    const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
    prev.onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' }); next.onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });
    const ends = () => { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4; };
    // drag to slide with a mouse, like swiping
    let d = null;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; d = { x: e.clientX, l: track.scrollLeft, moved: false }; });
    addEventListener('pointermove', e => { if (!d) return; if (Math.abs(e.clientX - d.x) > 4) { d.moved = true; track.classList.add('drag'); } track.scrollLeft = d.l - (e.clientX - d.x); });
    addEventListener('pointerup', () => { if (!d) return; const was = d.moved; d = null; track.classList.remove('drag');
      if (was) { const i = Math.round(track.scrollLeft / step()); track.scrollTo({ left: i * step(), behavior: 'smooth' }); } });
    if (lvc && window.Goo) {
      const FITS = [{ hat: 'party' }, { face: 'hearts' }, { hat: 'crown' }, { neck: 'bowtie', held: 'balloon' }, { hat: 'bow', face: 'cheeks' }, { face: 'star' }, { hat: 'witch', held: 'wand' }, { hat: 'daisy', held: 'heart' }, { hat: 'beanie', neck: 'scarf' }, { face: 'round', held: 'boba' }, { hat: 'chef' }, { hat: 'frog' }];
      let fit = FITS[0], at = 0; const g2 = Goo(lvc, { wearing: () => fit });
      track.addEventListener('scroll', () => { ends(); const i = Math.min(cards.length - 1, Math.round(track.scrollLeft / step())); if (i !== at) { at = i; fit = FITS[i % FITS.length]; if (!calm) g2.hop(); } }, { passive: true });
    } else track.addEventListener('scroll', ends, { passive: true });
    ends();
  }

  // ---------- Mochi's music: the app's three loops, looping right at the last bar like the app does ----------
  const mu = document.querySelector('.mu');
  if (mu) {
    const TRACKS = [
      { id: 'strawberry-milk-beats', name: 'Strawberry Milk Beats', vibe: 'Cozy, Mochi’s everyday groove', art: 'strawberry' },
      { id: 'cloud-desk', name: 'Cloud Desk', vibe: 'Calm, for focusing', art: 'rainbow' },
      { id: 'jelly-jog', name: 'Jelly Jog', vibe: 'Bouncy, for getting things done', art: 'cupcake' },
    ];
    const LOOP = 48;   // every song is 16 bars at 80 BPM
    const $ = s => mu.querySelector(s), now = $('.mu-now'), play = $('.mu-play'), list = $('.mu-list'), vol = $('.mu-vol input');
    const art = id => `image/mochiboard/tx/px-${TRACKS.find(t => t.id === id).art}.png`;
    let cur = TRACKS[0].id, ctx, gain, src, bufs = {}, playing = false, fallback;
    const paint = () => {
      const t = TRACKS.find(x => x.id === cur);
      now.dataset.track = cur; now.classList.toggle('on', playing); $('.mu-art').src = art(cur); $('.mu-meta b').textContent = t.name; $('.mu-meta small').textContent = t.vibe;
      play.classList.toggle('on', playing); play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      list.innerHTML = TRACKS.map(x => `<button type="button" class="mu-row${x.id === cur ? ' cur' : ''}" data-id="${x.id}"><img src="${art(x.id)}" alt=""><span><b>${x.name}</b><small>${x.vibe.split(',')[0]}</small></span></button>`).join('');
    };
    const load = id => bufs[id] || (bufs[id] = fetch(`image/mochiboard/music/${id}.mp3`).then(r => r.arrayBuffer()).then(a => ctx.decodeAudioData(a)));
    const stop = () => { try { src && src.stop(); } catch (e) {} src = null; if (fallback) fallback.pause(); };
    async function start() {
      stop();
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (!gain) { gain = ctx.createGain(); gain.connect(ctx.destination); }
        gain.gain.value = +vol.value; await ctx.resume();
        const id = cur, buf = await load(id); if (!playing || id !== cur) return;
        src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(LOOP, buf.duration); src.connect(gain); src.start();
      } catch (e) {   // no WebAudio: a plain looping audio tag
        fallback = fallback || Object.assign(new Audio(), { loop: true }); fallback.src = `image/mochiboard/music/${cur}.mp3`; fallback.volume = +vol.value; fallback.play().catch(() => {});
      }
    }
    play.onclick = () => { playing = !playing; paint(); playing ? start() : stop(); };
    list.onclick = e => { const b = e.target.closest('.mu-row'); if (!b) return; cur = b.dataset.id; playing = true; paint(); start(); };
    vol.oninput = () => { if (gain) gain.gain.value = +vol.value; if (fallback) fallback.volume = +vol.value; };
    // the music stops when the card scrolls far away, so it never follows someone around the page
    new IntersectionObserver(([e]) => { if (!e.isIntersecting && playing) { playing = false; stop(); paint(); } }, { rootMargin: '300px 0px' }).observe(mu);
    paint();
  }
})();
