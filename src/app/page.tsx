'use client';

import { useEffect, useRef, useState } from 'react';

const SONGS: Record<string, [string, number]> = {
  '0SeMmdPt7Ksu1fIAgnPIOG': ['Raconte-Moi Une Histoire · M83', 244093],
  '5FhR3iMNhjkDDJYvS6e2wP': ['Osaka Loop Line · Discovery', 241733],
  '4G21jWo0Cm6lOIUNnZ2mUI': ['Such Great Heights · The Postal Service', 266506],
  '4LF1dMlOHe8VfmMut7YiIs': ['Transatlanticism · Death Cab for Cutie', 475093],
  '2IvNxLl01CTAfCOA103Tgx': ["No One's Gonna Love You · Band of Horses", 217333],
  '35KiiILklye1JRRctaLUb4': ['Holocene · Bon Iver', 336613],
  '57zPzYQf43mAewduTJPJLp': ['Oceans Niagara · M83', 271656],
  '0yQPpUq5BJyqah5m2Q5Stt': ['Hoppípolla · Sigur Rós', 268706],
  '0rg69E3wqGu7cGZCIkHvdS': ['Man on Fire · Edward Sharpe & The Magnetic Zeros', 259079],
  '2nzWQEjNlTsOkNfZ0n6gE4': ['58500 · Enfant Sauvage', 316400],
  '7dwCUb3OXadzAMWj5tzqyP': ['So Here We Are · Bloc Party', 232400],
  '1Tr7e3ieztG87RTG3vGLp7': ['Tiderays · Volcano Choir', 297306],
  '1odU6ORtuHt4GqVYbtfzQN': ['So Insane · Discovery', 192533],
  '3l14MJpQB4tFFgKLqUqtV3': ['The District Sleeps Alone Tonight · The Postal Service', 283746],
  '4QDlcd4wAmmXXtKryfTxnO': ['Skeletons · Yeah Yeah Yeahs', 302160],
  '766EIreId79ZFBkiDO1Ial': ['Our Swords · Band of Horses', 146306],
  '7CIKMtUUz31yX6MNX2nGbB': ['Towers · Bon Iver', 188040],
  '7mpUknu2kArAJe9GMTQscr': ['Ash/Black Veil · Apparat', 344320],
  '68hYdj3GepWm2R202KhJT7': ['1901 · Phoenix', 193106],
  '6ffHgE67bfcvaab8QUUcDI': ['All Wash Out · Edward Sharpe & The Magnetic Zeros', 280920],
};

export default function JessaPortfolioPage() {
  const siteRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const musicBtnRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [trackTitle, setTrackTitle] = useState('Press play');
  const [isMarquee, setIsMarquee] = useState(false);
  const [marqueeDur, setMarqueeDur] = useState('12s');

  // 1. Pixel Pusher title decoding animation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const BASE = 'Jessa Wolfe · ';
    const WORDS = ['Pixel Pusher', 'Dreamer', 'Creator', 'Tired', 'Builder'];
    let wi = 0;
    let WORD = WORDS[0];
    const GLYPHS = '░▒▓█▚▞▟▟▛▜■▪◆✦';
    const g = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const show = (k: number) => {
      document.title = BASE + [...WORD].map((c, i) => (c === ' ' || i < k ? c : g())).join('');
    };

    let k = 0;
    let phase: 'in' | 'hold' | 'out' = 'in';
    let flick = 0;
    let until = 0;
    let timerId: NodeJS.Timeout;

    const tick = () => {
      if (phase === 'in') {
        show(k);
        if (++flick >= 2) {
          flick = 0;
          k++;
        }
        if (k > WORD.length) {
          phase = 'hold';
          until = Date.now() + 5000;
          document.title = BASE + WORD;
        }
      } else if (phase === 'hold') {
        if (Date.now() > until) {
          phase = 'out';
          k = WORD.length;
        }
      } else {
        show(k);
        k -= 2;
        if (k < 0) {
          phase = 'in';
          k = 0;
          wi = (wi + 1) % WORDS.length;
          WORD = WORDS[wi];
        }
      }
      timerId = setTimeout(tick, phase === 'hold' ? 500 : 70);
    };

    timerId = setTimeout(tick, 600);
    return () => clearTimeout(timerId);
  }, []);

  // 2. Hash and iframe routing synchronization
  useEffect(() => {
    const site = siteRef.current;
    if (!site) return;

    const want = window.location.hash.slice(1);
    const bust = (u: string) => {
      const [p, hash] = u.split('#');
      return p + (p.includes('?') ? '&' : '?') + 'r=' + Date.now() + (hash ? '#' + hash : '');
    };

    site.src = bust(want.includes('.html') ? want : '/app.html' + (want ? '#' + want : ''));

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'jw-night') {
        document.documentElement.classList.toggle('night', !!e.data.on);
      }
      if (e.data && e.data.type === 'host:nav') {
        const u = e.data.url.replace(/^\/?app\.html/, '');
        window.history.replaceState(null, '', '#' + (u.startsWith('#') ? u.slice(1) : u));
      }
    };

    const handleHashChange = () => {
      const h = window.location.hash.slice(1);
      try {
        const cur = (
          (site.contentWindow?.location.pathname.split('/').pop() || '') +
          (site.contentWindow?.location.hash || '')
        ).replace(/^app\.html/, '');
        if (h !== cur.replace(/^#/, '')) {
          site.src = bust(h.includes('.html') ? h : '/app.html' + (h ? '#' + h : ''));
        }
      } catch {
        site.src = bust(h.includes('.html') ? h : '/app.html' + (h ? '#' + h : ''));
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('hashchange', handleHashChange);

    // Initial night mode restore
    try {
      if (
        localStorage.getItem('jw-night') === '1' ||
        (!localStorage.getItem('jw-night') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('night');
      }
    } catch {}

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // 3. Spotify Embed API integration
  useEffect(() => {
    let nowUri = '';
    const updateTitle = (t: string) => {
      setTrackTitle(t);
      if (t.length > 20) {
        setIsMarquee(true);
        setMarqueeDur(Math.round(t.length * 0.3 + 3) + 's');
      } else {
        setIsMarquee(false);
      }
    };

    (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
      const spotEl = document.getElementById('spot');
      if (!spotEl) return;
      IFrameAPI.createController(
        spotEl,
        { uri: 'spotify:playlist:0WlrQzwx5cEkDV2QAPoD9h', width: '100%', height: 152 },
        (controller: any) => {
          controller.addListener('playback_update', (e: any) => {
            const d = e?.data || {};
            setIsPlaying(!d.isPaused);
            const key = (d.playingURI || '') + '|' + Math.round((d.duration || 0) / 1000);
            if ((d.playingURI || d.duration) && key !== nowUri) {
              nowUri = key;
              const [, , id] = String(d.playingURI || '').split(':');
              if (SONGS[id]) {
                updateTitle(SONGS[id][0]);
              } else {
                updateTitle('Now playing');
              }
            }
          });
        }
      );
    };

    // Load Spotify script
    const sc = document.createElement('script');
    sc.src = 'https://open.spotify.com/embed/iframe-api/v1';
    sc.async = true;
    document.head.appendChild(sc);

    const closeOnClickOutside = (e: MouseEvent) => {
      const musicEl = document.getElementById('music');
      if (musicEl && !musicEl.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', closeOnClickOutside);

    return () => {
      document.removeEventListener('click', closeOnClickOutside);
    };
  }, []);

  return (
    <main>
      <iframe
        ref={siteRef}
        className="site"
        id="site"
        title="Jessa Wolfe's studio"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />

      <div className={`music ${isPlaying ? 'playing' : ''} ${isOpen ? 'open' : ''}`} id="music">
        <div ref={panelRef} className="panel" id="panel">
          <div id="spot" />
          <div className="cap">
            <span>what I’m listening to</span>
            <a href="https://open.spotify.com/playlist/0WlrQzwx5cEkDV2QAPoD9h" target="_blank" rel="noopener noreferrer">
              open in Spotify ↗
            </a>
          </div>
        </div>
        <button
          ref={musicBtnRef}
          className="btn"
          id="musicBtn"
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          title={trackTitle}
        >
          <span className="bars">
            <i />
            <i />
            <i />
          </span>
          <span className={`lbl ${isMarquee ? 'run' : ''}`}>
            <span className="mq" style={{ animationDuration: marqueeDur }}>
              {isMarquee ? `${trackTitle}  ✦  ${trackTitle}  ✦ ` : trackTitle}
            </span>
          </span>
        </button>
      </div>
    </main>
  );
}
