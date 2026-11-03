/* header glass: once the page scrolls, a frosted layer fades in behind the nav and the bar tightens a little,
   so the menu stays easy to read over photos, video and cards. Clear again at the very top. */
(() => {
  document.head.insertAdjacentHTML('beforeend', `<style>
    .top { transition: padding .45s cubic-bezier(.2,.8,.2,1); }
    .top::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0;
      background: linear-gradient(to bottom, rgba(245,245,245,.78), rgba(245,245,245,.6));
      -webkit-backdrop-filter: blur(18px) saturate(140%); backdrop-filter: blur(18px) saturate(140%);
      border-bottom: 1px solid rgba(13,13,13,.06); box-shadow: 0 10px 30px -24px rgba(0,0,0,.35);
      transition: opacity .45s ease; }
    .top.glass::before { opacity: 1; }
    .top.glass { padding-top: 18px; padding-bottom: 18px; }
    @media (max-width: 860px) { .top.glass { padding-top: 14px; padding-bottom: 14px; } }
    html.menu-open .top::before { opacity: 0; }   /* the phone menu sheet has its own glass */
  </style>`);
  const top = document.querySelector('.top');
  if (!top) return;
  const set = () => top.classList.toggle('glass', scrollY > 12);
  addEventListener('scroll', set, { passive: true }); set();
})();
