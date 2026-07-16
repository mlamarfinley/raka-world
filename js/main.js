/* ============================================================
   RAKA WORLD — Shared behavior
   Gate, marquees, reveals, counters, nav, filters, forms, cursor
   ============================================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Enter gate (index only) ---------- */

  var gate = document.getElementById('gate');

  function openGate(instant) {
    if (!gate || gate.classList.contains('open') || gate.classList.contains('done')) return;
    sessionStorage.setItem('rakaEntered', '1');

    function reveal() {
      gate.classList.add('open');
      document.body.classList.add('entered');
      window.setTimeout(function () {
        gate.classList.add('done');
        gate.setAttribute('aria-hidden', 'true');
      }, 560);
    }

    if (instant || reducedMotion) {
      reveal();
      return;
    }

    gate.classList.add('cracking');
    window.setTimeout(reveal, 280);
  }

  if (gate) {
    if (sessionStorage.getItem('rakaEntered')) {
      gate.classList.add('done');
      gate.setAttribute('aria-hidden', 'true');
      document.body.classList.add('entered');
    } else {
      var boltPath = gate.querySelector('.gate-bolt path');
      if (boltPath) {
        var len = boltPath.getTotalLength();
        boltPath.style.strokeDasharray = len;
        boltPath.style.strokeDashoffset = len;
      }
      var enterBtn = gate.querySelector('.gate-enter');
      if (enterBtn) enterBtn.addEventListener('click', function () { openGate(false); });
      var skipBtn = gate.querySelector('.gate-skip');
      if (skipBtn) skipBtn.addEventListener('click', function () { openGate(true); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') openGate(true);
      });
    }
  } else {
    document.body.classList.add('entered');
  }

  /* ---------- Marquees (rAF so hover speed-up stays smooth) ---------- */

  function initMarquee(marquee) {
    var track = marquee.querySelector('.marquee-track');
    if (!track) return;

    // Skip hidden marquees (e.g. the gate marquee after the gate is dismissed):
    // scrollWidth is 0 there and the duplication loop would never terminate.
    if (track.scrollWidth === 0) return;

    // Duplicate content until it spans at least 2x the viewport (capped)
    var original = track.innerHTML;
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 2 && guard < 12) {
      track.innerHTML += original;
      guard++;
    }

    if (reducedMotion) return;

    var x = 0;
    var base = 0.6;
    var speed = base;
    var target = base;
    var half = track.scrollWidth / 2;

    marquee.addEventListener('mouseenter', function () { target = base * 1.8; });
    marquee.addEventListener('mouseleave', function () { target = base; });

    function tick() {
      speed += (target - speed) * 0.06;
      x -= speed;
      if (-x >= half) x += half;
      track.style.transform = 'translateX(' + x + 'px)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('.marquee, .gate-marquee').forEach(initMarquee);

  /* ---------- Scroll reveals ---------- */

  var revealables = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealables.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up stats ---------- */

  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';

    function run() {
      if (reducedMotion) { el.textContent = end + suffix; return; }
      var start = null;
      var duration = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { run(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(el);
    } else {
      run();
    }
  });

  /* ---------- Bolt divider draw-in ---------- */

  document.querySelectorAll('.bolt-divider').forEach(function (div) {
    var path = div.querySelector('.bolt-path');
    if (!path) return;
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = reducedMotion ? 0 : len;
    if (reducedMotion) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        path.style.transition = 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)';
        path.style.strokeDashoffset = 0;
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(div);
  });

  /* ---------- Mobile nav ---------- */

  var navToggle = document.querySelector('.nav-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (navToggle && mobileMenu) {
    var menuClose = mobileMenu.querySelector('.menu-close');
    navToggle.addEventListener('click', function () {
      mobileMenu.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
    });
    function closeMenu() {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- Talent filters ---------- */

  var filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    var talentCards = document.querySelectorAll('.talent-card');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var f = btn.getAttribute('data-filter');
        talentCards.forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-cat') === f;
          card.classList.toggle('hidden', !show);
        });
      });
    });
  }

  /* ---------- Forms (Formspree) ----------
     PLACEHOLDER: replace YOUR_FORM_ID in each form's action with the
     real Formspree endpoint. Until then, submissions are simulated so
     the success state can be reviewed. */

  document.querySelectorAll('form[data-raka-form]').forEach(function (form) {
    form.setAttribute('novalidate', 'true');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Inline validation
      var valid = true;
      var firstInvalid = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field');
        var ok = input.value.trim() !== '';
        if (ok && input.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        if (field) field.classList.toggle('invalid', !ok);
        if (!ok) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });
      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      function succeed() { form.classList.add('sent'); }

      function fail() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        var errBox = form.querySelector('.form-error');
        if (errBox) {
          errBox.hidden = false;
          errBox.setAttribute('role', 'alert');
        }
      }

      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        // No real endpoint yet — simulate success for review.
        console.warn('RAKA: Formspree ID not set; simulating submission.');
        window.setTimeout(succeed, 700);
        return;
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (res.ok) succeed(); else fail();
      }).catch(fail);
    });

    // Clear error state while retyping
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) field.classList.remove('invalid');
      });
    });
  });

  /* ---------- Sun/Moon theme toggle ----------
     Theme is applied before first paint by an inline <head> script;
     this just wires the orbit buttons. */

  var themeToggles = document.querySelectorAll('.theme-toggle');

  function themeLabel(theme) {
    return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('rakaTheme', theme); } catch (e) { /* private mode */ }
    themeToggles.forEach(function (btn) { btn.setAttribute('aria-label', themeLabel(theme)); });
  }

  if (themeToggles.length) {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    themeToggles.forEach(function (btn) { btn.setAttribute('aria-label', themeLabel(current)); });
    themeToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    });
  }

  /* ---------- Cursor dot (desktop only) ---------- */

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    var dx = -100, dy = -100, tx = -100, ty = -100;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function follow() {
      dx += (tx - dx) * 0.22;
      dy += (ty - dy) * 0.22;
      dot.style.transform = 'translate(' + (dx - 5) + 'px,' + (dy - 5) + 'px)';
      requestAnimationFrame(follow);
    })();
  }
})();
