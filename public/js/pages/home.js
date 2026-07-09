/* ==========================================================================
   HOME PAGE
   Hero carousel: autoplays through the admin-managed slides, with dot/arrow
   controls, pause-on-hover, and touch swipe. Respects prefers-reduced-motion
   by turning off autoplay (manual controls still work).
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;

  const slides = Array.from(heroSection.querySelectorAll('[data-hero-slide]'));
  if (slides.length === 0) return;

  const dots = Array.from(heroSection.querySelectorAll('[data-hero-dot]'));
  const prevBtn = heroSection.querySelector('[data-hero-prev]');
  const nextBtn = heroSection.querySelector('[data-hero-next]');

  let activeIndex = slides.findIndex(function (slide) {
    return slide.classList.contains('is-active');
  });
  if (activeIndex < 0) activeIndex = 0;

  const AUTOPLAY_DELAY = 6000;
  let autoplayTimer = null;

  function goToSlide(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === activeIndex) return;

    slides[activeIndex].classList.remove('is-active');
    slides[activeIndex].setAttribute('aria-hidden', 'true');

    slides[nextIndex].classList.add('is-active');
    slides[nextIndex].setAttribute('aria-hidden', 'false');

    if (dots[activeIndex]) {
      dots[activeIndex].classList.remove('is-active');
      dots[activeIndex].setAttribute('aria-selected', 'false');
    }
    if (dots[nextIndex]) {
      dots[nextIndex].classList.add('is-active');
      dots[nextIndex].setAttribute('aria-selected', 'true');
    }

    activeIndex = nextIndex;
  }

  function startAutoplay() {
    if (prefersReducedMotion || slides.length < 2) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(function () {
      goToSlide(activeIndex + 1);
    }, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  if (slides.length > 1) {
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToSlide(activeIndex - 1);
        startAutoplay(); // restart the countdown after a manual interaction
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goToSlide(activeIndex + 1);
        startAutoplay();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goToSlide(Number(dot.dataset.index));
        startAutoplay();
      });
    });

    // Pause on hover/focus so the copy doesn't change while someone's reading
    heroSection.addEventListener('mouseenter', stopAutoplay);
    heroSection.addEventListener('mouseleave', startAutoplay);
    heroSection.addEventListener('focusin', stopAutoplay);
    heroSection.addEventListener('focusout', startAutoplay);

    // Touch swipe support
    let touchStartX = null;
    heroSection.addEventListener(
      'touchstart',
      function (event) {
        touchStartX = event.touches[0].clientX;
        stopAutoplay();
      },
      { passive: true }
    );
    heroSection.addEventListener(
      'touchend',
      function (event) {
        if (touchStartX === null) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40) {
          goToSlide(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
        }
        touchStartX = null;
        startAutoplay();
      },
      { passive: true }
    );

    startAutoplay();
  }

})();