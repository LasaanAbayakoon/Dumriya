// Apply saved theme and language before first paint to avoid a flash. A file rather than an
// inline script so the Content-Security-Policy can stay `script-src 'self'` (public/_headers).
(function () {
  try {
    var t = localStorage.getItem('dumriya.theme');
    var dark = t === 'dark' || ((!t || t === 'system') && matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    var l = localStorage.getItem('dumriya.lang');
    if (l) document.documentElement.lang = l;
  } catch (e) {}
})();
