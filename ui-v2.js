/* ============================================================
   SINGULAR v2 — ui-v2.js
   Menu mobile · carrosséis de cards com efeito de foco (mobile)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- Carrosséis de cards (mobile) ---------- */
  var mq = window.matchMedia('(max-width: 880px)');
  var cars = [];

  Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), function (el) {
    el.classList.add('car');
    var dots = document.createElement('div');
    dots.className = 'car-dots';
    el.parentNode.insertBefore(dots, el.nextSibling);
    var it = { el: el, dots: dots, slides: [] };
    buildDots(it);
    cars.push(it);

    var ticking = false;
    el.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(it); ticking = false; });
    }, { passive: true });
  });

  function buildDots(it) {
    it.dots.innerHTML = '';
    it.slides = Array.prototype.filter.call(it.el.children, function (s) {
      return getComputedStyle(s).display !== 'none';
    });
    it.slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir para o item ' + (i + 1));
      b.addEventListener('click', function () {
        it.el.scrollTo({
          left: s.offsetLeft - (it.el.clientWidth - s.offsetWidth) / 2,
          behavior: reduce ? 'auto' : 'smooth'
        });
      });
      it.dots.appendChild(b);
    });
  }

  function update(it) {
    if (!mq.matches) {
      it.slides.forEach(function (s) { s.style.transform = ''; s.style.opacity = ''; });
      return;
    }
    var center = it.el.scrollLeft + it.el.clientWidth / 2;
    var best = 0, bd = Infinity;
    it.slides.forEach(function (s, i) {
      var c = s.offsetLeft + s.offsetWidth / 2;
      var d = Math.abs(c - center);
      if (!reduce) {
        var t = Math.min(d / Math.max(it.el.clientWidth * 0.9, 1), 1);
        s.style.transform = 'scale(' + (1 - t * 0.07).toFixed(3) + ') translateY(' + (t * 6).toFixed(1) + 'px)';
        s.style.opacity = (1 - t * 0.42).toFixed(3);
      }
      if (d < bd) { bd = d; best = i; }
    });
    Array.prototype.forEach.call(it.dots.children, function (b, i) {
      b.classList.toggle('on', i === best);
    });
  }

  function refresh() {
    cars.forEach(function (it) { buildDots(it); update(it); });
  }
  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh);
  window.addEventListener('singular:tweak', function () { setTimeout(refresh, 60); });
  refresh();
  setTimeout(refresh, 350);
  setTimeout(refresh, 900);
})();
