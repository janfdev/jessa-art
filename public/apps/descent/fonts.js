// The typefaces being tried for THE DESCENT (all sans, all set in caps). Shared by index.html and fonts.html.
// key, name, note, CSS family, weight, where it's from ('g' Google Fonts / 'f' Fontshare), the request, extra CSS
window.DESCENT_FONTS = [
  ['clash', 'Clash Display', 'Sharp, confident cuts. Modern luxury, very clean.', "'Clash Display'", 700, 'f', 'clash-display@700', ''],
  ['panchang', 'Panchang', 'Extra wide and expensive, like a fashion house.', "'Panchang'", 800, 'f', 'panchang@800', 'letter-spacing:.01em'],
  ['unbounded', 'Unbounded', 'Round, wide and bubbly. The most playful, still polished.', "'Unbounded'", 900, 'g', 'Unbounded:wght@900', ''],
  ['syne', 'Syne', 'Artsy and odd in the best way. Gallery energy.', "'Syne'", 800, 'g', 'Syne:wght@800', ''],
  ['cabinet', 'Cabinet Grotesk', 'Chunky, friendly grotesk with personality.', "'Cabinet Grotesk'", 900, 'f', 'cabinet-grotesk@900', ''],
  ['chillax', 'Chillax', 'Soft, rounded corners. Calm and fun.', "'Chillax'", 700, 'f', 'chillax@700', ''],
  ['archivo', 'Archivo Expanded', 'Wide, heavy and solid. Museum signage.', "'Archivo'", 900, 'g', 'Archivo:wdth,wght@125,900', 'font-stretch:125%'],
  ['tanker', 'Tanker', 'Tall, loud and graphic. Poster type.', "'Tanker'", 400, 'f', 'tanker@400', 'letter-spacing:.02em'],
  ['satoshi', 'Satoshi Black', 'Clean geometric sans. Quiet and premium.', "'Satoshi'", 900, 'f', 'satoshi@900', ''],
  ['bricolage', 'Bricolage Grotesque', 'Quirky ink traps up close. Playful but designed.', "'Bricolage Grotesque'", 800, 'g', 'Bricolage+Grotesque:opsz,wght@12..96,800', ''],
  ['bigshoulders', 'Big Shoulders Display', 'Condensed and towering. Dramatic, industrial.', "'Big Shoulders Display'", 900, 'g', 'Big+Shoulders+Display:wght@900', ''],
];
window.DESCENT_DEFAULT = 'satoshi';   // the one on the landing
window.fontLink = f => { const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = f[5] === 'g' ? `https://fonts.googleapis.com/css2?family=${f[6]}&display=swap` : `https://api.fontshare.com/v2/css?f[]=${f[6]}&display=swap`;
  document.head.appendChild(l); };
