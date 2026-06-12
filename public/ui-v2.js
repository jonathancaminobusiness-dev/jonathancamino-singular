/* ============================================================
   SINGULAR v2 — ui-v2.js
   Menu mobile · busca do hero
   (carrosséis migrados para Embla em src/carousel.js)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Menu mobile ---------- */
  var btn = document.getElementById('menuBtn');
  var mnav = document.getElementById('mnav');
  if (btn && mnav) {
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.forEach.call(mnav.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Busca do hero → WhatsApp ---------- */
  var hs = document.getElementById('heroSearch');
  if (hs) {
    hs.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = document.getElementById('heroQ');
      var q = (inp && inp.value || '').trim();
      var msg = q
        ? 'Olá Rodrigo, vim pelo site. Quero proteger: ' + q
        : 'Olá Rodrigo, vim pelo site e quero uma consultoria Singular.';
      window.open('https://wa.me/5521964135156?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  }
})();
