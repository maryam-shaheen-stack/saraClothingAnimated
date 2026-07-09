/* ==========================================================================
   SARA CLOTHING — HERO-STARS.JS
   Purely additive visual layer for the homepage hero:
     1. Generates twinkling star dots inside the existing .hero-3d-bg layer.
     2. Watches the hero slides for the is-active class change (which the
        carousel in pages/home.js already toggles on every arrow/dot/swipe/
        autoplay transition) and triggers a brief "pulse" on the stars.
   This file does NOT read or modify anything in pages/home.js — it only
   observes the DOM from the outside, so the carousel's existing behavior
   (autoplay timing, indices, dots, swipe, accessibility attributes) is
   completely unaffected. If this script fails to load, the hero still
   works exactly as before — the stars container just stays empty.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const starsContainer = document.querySelector('[data-hero-stars]');
    const heroBg = document.querySelector('[data-hero-3d-bg]');
    const heroSlides = document.querySelector('.hero__slides');

    if (!starsContainer || !heroBg || !heroSlides) return;

    generateStars(starsContainer);
    watchForSlideChanges(heroBg, heroSlides);
  });

  /**
   * Scatters small twinkling dots across the hero background.
   * Actual animation (fade in/out timing) is CSS-driven via custom
   * properties set here — keeps this script tiny and keeps the
   * prefers-reduced-motion handling in one place (home.css).
   */
  function generateStars(container) {
    const isNarrow = window.innerWidth < 700;
    const count = isNarrow ? 26 : 48;
    const goldAccent = '#c9a15a';
    const creamWhite = '#fff8ec';

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'hero-star';

      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = (1 + Math.random() * 2).toFixed(1); // 1px – 3px
      const duration = (2 + Math.random() * 3).toFixed(2); // 2s – 5s
      const delay = (Math.random() * 4).toFixed(2); // 0s – 4s
      const maxOpacity = (0.5 + Math.random() * 0.4).toFixed(2); // 0.5 – 0.9
      // Roughly 1 in 6 stars picks up the brand gold tint instead of cream.
      const color = Math.random() < 0.16 ? goldAccent : creamWhite;

      star.style.setProperty('--star-x', x + '%');
      star.style.setProperty('--star-y', y + '%');
      star.style.setProperty('--star-size', size + 'px');
      star.style.setProperty('--star-duration', duration + 's');
      star.style.setProperty('--star-delay', delay + 's');
      star.style.setProperty('--star-max-opacity', maxOpacity);
      star.style.setProperty('--star-color', color);

      fragment.appendChild(star);
    }

    container.appendChild(fragment);
  }

  /**
   * Every time the carousel swaps which slide has `is-active` (arrow click,
   * dot click, swipe, or autoplay tick — all already handled by
   * pages/home.js), briefly brighten the stars for a "twinkle burst" that
   * reads as part of the transition.
   */
  function watchForSlideChanges(heroBg, heroSlides) {
    let pulseTimer = null;

    const observer = new MutationObserver(() => {
      heroBg.classList.add('is-pulsing');
      if (pulseTimer) window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(() => {
        heroBg.classList.remove('is-pulsing');
      }, 550);
    });

    observer.observe(heroSlides, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  }
})();
