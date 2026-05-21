/**
 * Cavient — Main JavaScript
 * Handles: nav scroll, scroll animations, pricing toggle, mobile menu
 */

'use strict';

(function () {

  // ── Utility ────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ── NAV: Scroll Sticky ──────────────────────────────────
  function initNav() {
    const nav = $('#mainNav');
    if (!nav) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          nav.classList.toggle('nav-scrolled', scrolled);
          nav.classList.toggle('nav-transparent', !scrolled);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  // ── NAV: Mobile Menu ───────────────────────────────────
  function initMobileNav() {
    const toggle   = $('#navToggle');
    const nav      = $('#mainNav');
    const body     = document.body;

    if (!toggle || !nav) return;

    let isOpen = false;

    function openMenu() {
      isOpen = true;
      nav.classList.add('nav-mobile-open', 'nav-scrolled');
      nav.classList.remove('nav-transparent');
      toggle.setAttribute('aria-expanded', 'true');
      body.style.overflow = 'hidden';
      // Animate hamburger to X
      const spans = $$('span', toggle);
      if (spans[0]) spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      if (spans[1]) spans[1].style.opacity = '0';
      if (spans[2]) spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    }

    function closeMenu() {
      isOpen = false;
      nav.classList.remove('nav-mobile-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
      // Reset hamburger
      const spans = $$('span', toggle);
      if (spans[0]) spans[0].style.transform = '';
      if (spans[1]) spans[1].style.opacity = '';
      if (spans[2]) spans[2].style.transform = '';
      // Re-apply scroll state
      const scrolled = window.scrollY > 20;
      nav.classList.toggle('nav-scrolled', scrolled);
      nav.classList.toggle('nav-transparent', !scrolled);
    }

    toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Close on overlay click (mobile nav links)
    $$('.nav-link', nav).forEach(link => {
      link.addEventListener('click', () => {
        if (isOpen) closeMenu();
      });
    });
  }

  // ── SCROLL ANIMATIONS ──────────────────────────────────
  function initScrollAnimations() {
    const elements = $$('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once visible, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    elements.forEach(el => observer.observe(el));
  }

  // ── PRICING TOGGLE ─────────────────────────────────────
  function initPricingToggle() {
    const toggleEl = $('#billingToggle');
    if (!toggleEl) return;

    const prices = {
      starter:  { monthly: 89,  annual: Math.round(89  * 0.8) },
      pro:      { monthly: 189, annual: Math.round(189 * 0.8) },
    };

    let isAnnual = false;

    function updatePrices() {
      const period = isAnnual ? 'annual' : 'monthly';
      const starterEl = $('#price-starter');
      const proEl     = $('#price-pro');
      if (starterEl) starterEl.textContent = prices.starter[period];
      if (proEl)     proEl.textContent     = prices.pro[period];
    }

    function toggle() {
      isAnnual = !isAnnual;
      toggleEl.classList.toggle('active', isAnnual);
      toggleEl.setAttribute('aria-checked', String(isAnnual));
      updatePrices();
    }

    toggleEl.addEventListener('click', toggle);
    toggleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  // ── SMOOTH SCROLL for anchor links ─────────────────────
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 74;
          const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ── NAV DROPDOWN: keyboard & a11y ──────────────────────
  function initDropdowns() {
    $$('.nav-item').forEach(item => {
      const trigger = item.querySelector('.nav-link[aria-haspopup]');
      const dropdown = item.querySelector('.nav-dropdown');
      if (!trigger || !dropdown) return;

      // Keyboard support
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
          $$('.nav-link[aria-expanded="true"]').forEach(t => t.setAttribute('aria-expanded', 'false'));
          trigger.setAttribute('aria-expanded', String(!isExpanded));
        }
        if (e.key === 'Escape') {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.focus();
        }
      });

      // Close when focus leaves the item
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // ── COUNTER ANIMATION (hero stats) ─────────────────────
  function initCounters() {
    const counters = $$('.hero-trust-value');
    if (!counters.length) return;

    const parseValue = (text) => {
      const match = text.match(/^([\d.]+)([KM+%]*)$/);
      if (!match) return { num: 0, suffix: '' };
      return { num: parseFloat(match[1]), suffix: match[2] || '' };
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const original = el.textContent.trim();
        const { num, suffix } = parseValue(original);
        if (!num) return;

        let start = 0;
        const duration = 1400;
        const startTime = performance.now();

        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(num * ease * 10) / 10;
          el.textContent = (current % 1 === 0 ? Math.round(current) : current) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  // ── PAGE-SPECIFIC: Hero bar glow on hover ──────────────
  function initHeroEffects() {
    const hero = $('.hero');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      // Subtle parallax on the mesh layer
      const mesh = hero.querySelector('.hero-mesh');
      if (mesh) {
        mesh.style.backgroundPosition = `${x * 0.05}% ${y * 0.05}%`;
      }
    });
  }

  // ── CARD TILT EFFECT ───────────────────────────────────
  function initCardTilt() {
    const cards = $$('.feature-card, .specialty-card, .pricing-card:not(.featured)');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((y - cy) / cy) * 3;
        const ry = ((x - cx) / cx) * -3;
        card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        card.style.transition = 'transform 0.1s linear';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.3s ease';
      });
    });
  }

  // ── INTEGRATION LOGOS: hover color ─────────────────────
  function initIntegrations() {
    const brandColors = [
      '#1a6baa', '#00b0c8', '#2dba6c', '#f59e0b',
      '#8b5cf6', '#ef4444', '#1a6baa', '#00b0c8',
      '#2dba6c', '#f59e0b', '#8b5cf6', '#ef4444',
    ];

    $$('.integration-logo').forEach((logo, i) => {
      logo.addEventListener('mouseenter', () => {
        logo.style.color = brandColors[i % brandColors.length];
        logo.style.borderColor = brandColors[i % brandColors.length];
        logo.style.backgroundColor = brandColors[i % brandColors.length] + '10';
      });
      logo.addEventListener('mouseleave', () => {
        logo.style.color = '';
        logo.style.borderColor = '';
        logo.style.backgroundColor = '';
      });
    });
  }

  // ── INIT ───────────────────────────────────────────────
  function init() {
    initNav();
    initMobileNav();
    initScrollAnimations();
    initPricingToggle();
    initSmoothScroll();
    initDropdowns();
    initCounters();
    initHeroEffects();
    initCardTilt();
    initIntegrations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ══════════════════════════════════════════════
//  RIPPLE EFFECT — fires on click for all btns
// ══════════════════════════════════════════════
function initRipple() {
  const btns = document.querySelectorAll(
    '.btn, .btn-outline-white, .btn-white, button.btn-outline-white'
  );
  btns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = x + 'px';
      ripple.style.top  = y + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

// ══════════════════════════════════════════════
//  DEMO MODAL
// ══════════════════════════════════════════════
const DEMO_EMBED = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1';

function buildDemoModal() {
  if (document.getElementById('demoModal')) return;
  const overlay = document.createElement('div');
  overlay.className = 'demo-modal-overlay';
  overlay.id = 'demoModal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Cavient Product Demo');
  overlay.innerHTML = `
    <div class="demo-modal">
      <div class="demo-modal-header">
        <span class="demo-modal-title">🎬 Cavient Platform Demo</span>
        <button class="demo-modal-close" onclick="closeDemoModal()" aria-label="Close demo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="demo-modal-video" id="demoVideoWrap">
        <!-- iframe injected on open to prevent autoplay before user clicks -->
      </div>
      <div class="demo-modal-footer">
        <span class="demo-modal-cta-text">Ready to see it live? <strong>Get a personalised walkthrough.</strong></span>
        <a href="https://cavient.com/register" class="btn btn-primary" target="_blank" rel="noopener" style="height:38px;padding:0 20px;font-size:0.85rem;">
          Start Free Trial
        </a>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDemoModal();
  });

  // Close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDemoModal();
  });
}

function openDemoModal() {
  buildDemoModal();
  const overlay = document.getElementById('demoModal');
  const wrap    = document.getElementById('demoVideoWrap');
  // Inject iframe now (triggers autoplay)
  if (!wrap.querySelector('iframe')) {
    wrap.innerHTML = `<iframe src="${DEMO_EMBED}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Cavient Demo Video"></iframe>`;
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDemoModal() {
  const overlay = document.getElementById('demoModal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  // Remove iframe to stop video
  setTimeout(() => {
    const wrap = document.getElementById('demoVideoWrap');
    if (wrap) wrap.innerHTML = '';
  }, 320);
}

// ══════════════════════════════════════════════
//  RE-INIT on page load (append to existing init)
// ══════════════════════════════════════════════
(function extendInit() {
  function extra() {
    initRipple();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extra);
  } else {
    extra();
  }
})();
