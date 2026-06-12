/* ============================================================
   SINGULAR — motion.js
   Reveals · header sticky · contadores · trilhas · nav ativa
   (deteccao por scroll/rect — robusta em qualquer ambiente)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var inviewEls = Array.prototype.slice.call(document.querySelectorAll('[data-inview]'));
  var counters  = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    inviewEls.forEach(function (el) { el.classList.add('in-view'); });
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  function vh() { return window.innerHeight || document.documentElement.clientHeight; }
  function topOf(el) { return el.getBoundingClientRect().top; }
  function bottomOf(el) { return el.getBoundingClientRect().bottom; }

  /* ---------- Contadores ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduce || target === 0) { el.textContent = String(target); return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Header sticky / over-hero ---------- */
  var hdr = document.getElementById('hdr');
  var hero = document.querySelector('.hero');
  function updateHeader() {
    if (!hdr) return;
    var heroBottom = hero ? bottomOf(hero) : 0;
    var stuck = heroBottom <= 76;
    hdr.classList.toggle('is-stuck', stuck);
    var heroIsNavy = document.documentElement.getAttribute('data-hero') === 'navy';
    hdr.setAttribute('data-over', stuck ? 'light' : (heroIsNavy ? 'dark' : 'light'));
  }

  /* ---------- Nav ativa ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.hdr__nav a'));
  var navTargets = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function updateNav() {
    var mid = vh() * 0.4, best = -1, bestDist = Infinity;
    navTargets.forEach(function (s, i) {
      if (!s) return;
      var r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { var d = Math.abs(r.top - mid); if (d < bestDist) { bestDist = d; best = i; } }
    });
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === best); });
  }

  /* ---------- Loop de scroll ---------- */
  var heroSwoosh = document.querySelector('.hero .swoosh svg');
  function tick() {
    if (!reduce) {
      var trig = vh() * 0.9;
      for (var i = revealEls.length - 1; i >= 0; i--) {
        var el = revealEls[i];
        if (topOf(el) < trig && bottomOf(el) > 0) { el.classList.add('in'); revealEls.splice(i, 1); }
      }
      var jt = vh() * 0.86;
      for (var j = inviewEls.length - 1; j >= 0; j--) {
        var iv = inviewEls[j];
        if (topOf(iv) < jt && bottomOf(iv) > 0) { iv.classList.add('in-view'); inviewEls.splice(j, 1); }
      }
      var ct = vh() * 0.85;
      for (var k = counters.length - 1; k >= 0; k--) {
        var c = counters[k];
        if (topOf(c) < ct && bottomOf(c) > 0) { animateCount(c); counters.splice(k, 1); }
      }
      if (heroSwoosh) {
        var y = window.scrollY || window.pageYOffset;
        if (y < 900) heroSwoosh.style.transform = 'translateY(' + (y * 0.06) + 'px)';
      }
    }
    updateHeader();
    updateNav();
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { tick(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('singular:tweak', function () { setTimeout(tick, 30); });
  window.addEventListener('load', tick);
  // primeira passada (e algumas de seguranca enquanto fontes/layout assentam)
  tick();
  setTimeout(tick, 60);
  setTimeout(tick, 250);
  setTimeout(tick, 700);
})();
