// Live Mochiboard numbers from GitHub: total app downloads (every release) and stars.
// Fills any [data-mb="downloads"] / [data-mb="stars"] / [data-mb="version"]. Remembers the last numbers for an hour,
// and the numbers already in the page stay put if GitHub can't be reached.
(() => {
  const KEY = 'mb-stats', REPO = 'https://api.github.com/repos/jessawolfe-ux/mochiboard';
  const fmt = n => n >= 10000 ? Math.round(n / 1000) + 'k' : n.toLocaleString('en-US');
  const show = s => { for (const k of ['downloads', 'stars', 'version']) if (s[k] != null) document.querySelectorAll(`[data-mb="${k}"]`).forEach(el => el.textContent = typeof s[k] === 'number' ? fmt(s[k]) : s[k]); };
  let cached = null; try { cached = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (cached) show(cached);
  if (cached && Date.now() - cached.at < 3600e3) return;
  Promise.all([fetch(REPO + '/releases?per_page=100').then(r => r.ok ? r.json() : Promise.reject()), fetch(REPO).then(r => r.ok ? r.json() : Promise.reject())])
    .then(([rel, repo]) => {
      const s = { downloads: rel.reduce((n, r) => n + r.assets.reduce((m, a) => m + a.download_count, 0), 0), stars: repo.stargazers_count, version: (rel[0]?.tag_name || '').replace(/^v/, ''), at: Date.now() };
      show(s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    }).catch(() => {});
})();
