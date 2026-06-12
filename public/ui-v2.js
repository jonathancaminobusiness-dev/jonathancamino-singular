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

  /* ---------- Vídeo CTA: toca/pausa conforme o foco da seção ----------
     Em foco  → reproduz (mudo por padrão; usuário ativa o som).
     Fora     → pausa (corta o som).
     De volta → retoma automaticamente no mesmo estado de som. */
  var vsec = document.getElementById('video');
  var vid = vsec && vsec.querySelector('.vcta__video');
  if (vsec && vid) {
    var sndBtn = vsec.querySelector('.vcta__play');
    var userMuted = true;   // começa mudo; vira false após o 1º toque do usuário
    var inView = false;

    function reflect() {
      vsec.classList.toggle('snd-on', !vid.muted);
      vsec.classList.toggle('snd-off', vid.muted);
      if (sndBtn) {
        sndBtn.setAttribute('aria-label', vid.muted ? 'Ativar o som do vídeo' : 'Desativar o som do vídeo');
        sndBtn.setAttribute('aria-pressed', vid.muted ? 'false' : 'true');
      }
    }

    function play() {
      var p = vid.play();
      if (p && p.catch) {
        p.catch(function () {
          // reprodução com som bloqueada → muta e tenta novamente
          if (!vid.muted) { vid.muted = true; userMuted = true; reflect(); }
          var p2 = vid.play();
          if (p2 && p2.catch) p2.catch(function () {});
        });
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        inView = en.isIntersecting && en.intersectionRatio >= 0.5;
        if (inView) {
          vid.muted = userMuted;
          play();
        } else if (!vid.paused) {
          vid.pause();
        }
        reflect();
      });
    }, { threshold: [0, 0.5, 0.75] });
    io.observe(vsec.querySelector('.vcta__media') || vsec);

    if (sndBtn) {
      sndBtn.addEventListener('click', function () {
        vid.muted = !vid.muted;     // alterna o som
        userMuted = vid.muted;      // memoriza para as próximas entradas
        if (vid.paused) play();     // garante que está tocando
        reflect();
      });
    }

    vid.addEventListener('volumechange', reflect);
    reflect();
  }
})();
