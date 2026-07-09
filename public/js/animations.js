/* ==========================================================================
   SARA CLOTHING — ANIMATIONS.JS
   Reveal-on-scroll for any element marked [data-reveal].
   Respects prefers-reduced-motion (base.css already forces visibility
   for those users via CSS alone; this script simply doesn't run for them).
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealElements = document.querySelectorAll('[data-reveal]');

  if (prefersReducedMotion || revealElements.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach(function (el) {
    observer.observe(el);
  });

})();