/* ==========================================================================
   SARA CLOTHING — PERF-PAUSE.JS
   Purely a performance optimization, zero visual/behavioral change while
   the tab is open and active: when the browser tab is in the background
   (switched away from, minimized, screen locked), we pause the decorative
   CSS animations (ambient background drift/shine/orbs, hero stars/orbs).
   The instant the tab becomes visible again, everything resumes exactly
   as before — nothing is removed, reset, or re-triggered.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('visibilitychange', function () {
      document.body.classList.toggle('is-tab-hidden', document.hidden);
    });
  });
})();
