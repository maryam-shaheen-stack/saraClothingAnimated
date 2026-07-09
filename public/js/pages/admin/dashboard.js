/* ==========================================================================
   ADMIN — DASHBOARD
   Two enhancements unique to this page:
     1. Stat card values count up from 0 on load (skipped entirely for
        prefers-reduced-motion — the final value is shown immediately).
     2. Recent message rows are clickable, jumping straight to that
        message on the full Messages screen.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Animated stat counters ---- */

  const statValues = document.querySelectorAll('.stat-card__value');

  statValues.forEach(function (el) {
    const target = parseInt(el.textContent.replace(/[^\d]/g, ''), 10);

    if (prefersReducedMotion || isNaN(target) || target === 0) {
      return;
    }

    const duration = 700;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    el.textContent = '0';
    requestAnimationFrame(tick);
  });

  /* ---- Clickable recent message rows ---- */

  const recentMessagesPanel = document.querySelector('.admin-panel');
  if (recentMessagesPanel) {
    recentMessagesPanel.querySelectorAll('tbody tr').forEach(function (row) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', function () {
        window.location.href = '/admin/messages';
      });
    });
  }

})();