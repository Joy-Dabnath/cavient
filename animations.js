/**
 * Cavient — Animation Engine v2.0
 * ─────────────────────────────────────────────────────────────────
 *  1. Fade In Up
 *  2. Blur Reveal
 *  3. Parallax Scroll
 *  4. Magnetic Hover
 *  5. Mouse Follow Effect
 *  6. Text Reveal Animation
 *  7. Floating Elements
 *  8. Infinite Background Motion
 *  9. Glassmorphism Hover
 * 10. 3D Tilt Card
 * 11. Smooth Page Transition
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

(function () {

  const IS_TOUCH   = window.matchMedia('(hover: none)').matches;
  const REDUCED    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raf        = requestAnimationFrame;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ═══════════════════════════════════════════════════════════════
     1. FADE IN UP
     Elements with .fade-up animate from y+40 + opacity 0 → visible
  ═══════════════════════════════════════════════════════════════ */
  function initFadeUp() {
    const els = $$('.fade-up, .animate-on-scroll');
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          const delay = parseFloat(e.target.dataset.delay || 0) * 1000;
          setTimeout(() => {
            e.target.classList.add('visible', 'fu-visible');
          }, delay);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    els.forEach((el, i) => {
      if (!el.dataset.delay) el.dataset.delay = (i % 6) * 0.07;
      io.observe(el);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     2. BLUR REVEAL
     Elements with .blur-reveal transition from blur(10px) to clear
  ═══════════════════════════════════════════════════════════════ */
  function initBlurReveal() {
    const els = $$('.blur-reveal');
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseFloat(e.target.dataset.delay || 0) * 1000;
          setTimeout(() => e.target.classList.add('blur-visible'), delay);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    els.forEach(el => io.observe(el));
  }

  /* ═══════════════════════════════════════════════════════════════
     3. PARALLAX SCROLL
     Hero backgrounds + decorative layers scroll at different rates
  ═══════════════════════════════════════════════════════════════ */
  function initParallax() {
    if (IS_TOUCH || REDUCED) return;

    const layers = [
      { sel: '.hero-mesh, .page-hero-bg',   speed: 0.35 },
      { sel: '.hero-visual, .page-hero-grid', speed: 0.18 },
      { sel: '.parallax-slow',              speed: 0.25 },
      { sel: '.parallax-fast',              speed: 0.55 },
    ];

    let scrollY = 0, ticking = false;

    function applyParallax() {
      layers.forEach(({ sel, speed }) => {
        $$(sel).forEach(el => {
          const rect = el.closest('section')?.getBoundingClientRect() || el.getBoundingClientRect();
          const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * speed;
          el.style.transform = `translateY(${offset}px)`;
        });
      });
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
      if (!ticking) { raf(applyParallax); ticking = true; }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     4. MAGNETIC HOVER
     Buttons with .magnetic gently attract toward the cursor
  ═══════════════════════════════════════════════════════════════ */
  function initMagnetic() {
    if (IS_TOUCH || REDUCED) return;

    $$('.magnetic, .btn-primary, .btn-accent').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const dx = (e.clientX - cx) * 0.28;
        const dy = (e.clientY - cy) * 0.28;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
        el.style.transition = 'transform 0.15s ease';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.5,0.64,1)';
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     5. MOUSE FOLLOW EFFECT
     A radial glow orb that follows the cursor with lag
  ═══════════════════════════════════════════════════════════════ */
  function initMouseFollow() {
    if (IS_TOUCH || REDUCED) return;

    const cursor = $('#cv-cursor');
    if (!cursor) return;

    let cx = window.innerWidth  / 2;
    let cy = window.innerHeight / 2;
    let tx = cx, ty = cy;
    let rafId;

    document.addEventListener('mousemove', e => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    function loop() {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      cursor.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
      rafId = raf(loop);
    }
    loop();

    // Expand on hoverable elements
    const hoverEls = 'a, button, .btn, .feature-card, .pricing-card, .specialty-card';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverEls)) cursor.classList.add('cv-cursor--hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverEls)) cursor.classList.remove('cv-cursor--hover');
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     6. TEXT REVEAL ANIMATION
     .text-reveal elements: words slide up & fade in sequentially
  ═══════════════════════════════════════════════════════════════ */
  function initTextReveal() {
    $$('.text-reveal').forEach(el => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = '1';

      // Split inner HTML into word spans (preserve inner tags)
      const text  = el.innerHTML;
      const words = text.trim().split(/(\s+)/);
      el.innerHTML = words.map((w, i) =>
        /\s+/.test(w)
          ? w
          : `<span class="tr-word" style="transition-delay:${i * 0.045}s">${w}</span>`
      ).join('');
    });

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('tr-active');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    $$('.text-reveal').forEach(el => io.observe(el));
  }

  /* ═══════════════════════════════════════════════════════════════
     7. FLOATING ELEMENTS
     .floating — gentle infinite up-down sine motion
  ═══════════════════════════════════════════════════════════════ */
  function initFloating() {
    if (REDUCED) return;

    $$('.floating, .floating-badge, .hero-trust-item').forEach((el, i) => {
      el.style.animation = `cv-float ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite alternate`;
    });

    // Also animate hero stat bubbles / compliance badges
    $$('.compliance-badge, .hero-badge, .section-label').forEach((el, i) => {
      el.style.animation = `cv-float-subtle ${4 + i * 0.5}s ease-in-out ${i * 0.2}s infinite alternate`;
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     8. INFINITE BACKGROUND MOTION
     Hero sections: animated gradient mesh that drifts continuously
  ═══════════════════════════════════════════════════════════════ */
  function initBgMotion() {
    if (REDUCED) return;

    $$('.hero, .page-hero').forEach(hero => {
      // Inject an animated orb layer if not already present
      if (hero.querySelector('.cv-bg-orbs')) return;
      const orbs = document.createElement('div');
      orbs.className = 'cv-bg-orbs';
      orbs.setAttribute('aria-hidden', 'true');
      orbs.innerHTML = `
        <div class="cv-orb cv-orb-1"></div>
        <div class="cv-orb cv-orb-2"></div>
        <div class="cv-orb cv-orb-3"></div>`;
      hero.insertBefore(orbs, hero.firstChild);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     9. GLASSMORPHISM HOVER
     .glass-hover cards get a blurred glass overlay on hover
  ═══════════════════════════════════════════════════════════════ */
  function initGlassmorphism() {
    $$('.glass-hover, .testimonial-card, .testimonial-mini').forEach(el => {
      el.addEventListener('mouseenter', () => el.classList.add('glass-active'));
      el.addEventListener('mouseleave', () => el.classList.remove('glass-active'));
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     10. 3D TILT CARD
     .tilt-card responds to mouse with smooth 3D perspective tilt
  ═══════════════════════════════════════════════════════════════ */
  function initTiltCard() {
    if (IS_TOUCH || REDUCED) return;

    const MAX_TILT = 10;

    $$('.tilt-card, .pricing-card, .feature-card, .specialty-card, .feature-alt-card').forEach(card => {
      card.style.transformStyle  = 'preserve-3d';
      card.style.perspective     = '800px';
      card.style.willChange      = 'transform';

      card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const x  = (e.clientX - r.left) / r.width  - 0.5;   // -0.5 → 0.5
        const y  = (e.clientY - r.top)  / r.height - 0.5;
        const rx = -y * MAX_TILT;
        const ry =  x * MAX_TILT;
        card.style.transform   = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`;
        card.style.transition  = 'transform 0.1s linear';
        card.style.boxShadow   = `${ry * -1.5}px ${rx * 1.5}px 32px rgba(26,107,170,0.18)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform  = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.5s ease';
        card.style.boxShadow  = '';
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     11. SMOOTH PAGE TRANSITION
     Fade-out overlay on navigation, fade-in on new page load
  ═══════════════════════════════════════════════════════════════ */
  function initPageTransition() {
    if (REDUCED) return;

    const overlay = $('#page-transition');
    if (!overlay) return;

    // Fade in on load
    overlay.classList.add('pt-in');
    raf(() => {
      overlay.classList.add('pt-clear');
      setTimeout(() => overlay.classList.remove('pt-in', 'pt-clear'), 500);
    });

    // Fade out on same-origin link click
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || a.target === '_blank') return;
      e.preventDefault();
      overlay.classList.add('pt-out');
      setTimeout(() => { window.location.href = href; }, 380);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════ */
  function init() {
    if (REDUCED) {
      // Even with reduced motion, still do accessible reveals
      $$('.fade-up, .animate-on-scroll, .blur-reveal').forEach(el => {
        el.classList.add('visible', 'fu-visible', 'blur-visible');
      });
      return;
    }

    initFadeUp();
    initBlurReveal();
    initParallax();
    initMagnetic();
    initMouseFollow();
    initTextReveal();
    initFloating();
    initBgMotion();
    initGlassmorphism();
    initTiltCard();
    initPageTransition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
