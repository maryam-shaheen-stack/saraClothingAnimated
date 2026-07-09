/* ==========================================================================
   SARA CLOTHING — 3D-EFFECTS.JS
   Implements 3D card tilt hovers, Hero mouse parallax, and details page 3D.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initCard3DTilt();
    initHero3DParallax();
    initProduct3DViewer();
    initScrollDepthParallax();
  });

  /**
   * 1. 3D Tilt Effect on Product & Category Cards
   */
  function initCard3DTilt() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Handle product cards (tilting the inner link)
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card) => {
      const link = card.querySelector('.product-card__link');
      if (!link) return;
      setupTilt(card, link);
    });

    // Handle category cards (tilting the card itself)
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach((card) => {
      setupTilt(card, card);
    });

    function setupTilt(parent, target) {
      parent.addEventListener('mouseenter', () => {
        // Remove transitions on hover to make movement instantly follow the cursor
        target.style.transition = 'none';
      });

      parent.addEventListener('mousemove', (e) => {
        const rect = parent.getBoundingClientRect();
        
        // Cursor positions relative to the card dimensions
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate shine/glare percentages (0% to 100%)
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        parent.style.setProperty('--glare-x', `${glareX}%`);
        parent.style.setProperty('--glare-y', `${glareY}%`);

        // Center offsets
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Rotation degrees (18 degrees for clear 3D)
        const rotateX = ((centerY - y) / centerY) * 18;
        const rotateY = ((x - centerX) / centerX) * -18; // Invert so it tilts towards the mouse

        // Apply 3D transforms to target element
        target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      parent.addEventListener('mouseleave', () => {
        // Add transition back to snap the card back smoothly
        target.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        target.style.transform = 'rotateX(0deg) rotateY(0deg)';
        parent.style.setProperty('--glare-x', `50%`);
        parent.style.setProperty('--glare-y', `50%`);
      });
    }
  }

  /**
   * 2. 3D Mouse Parallax on Homepage Hero Banner
   */
  function initHero3DParallax() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate shift offsets (drift elements in opposite directions)
      const moveX = ((x - centerX) / centerX) * 25; // Max 25px drift
      const moveY = ((y - centerY) / centerY) * 18;

      const activeImage = hero.querySelector('.hero__slide.is-active .hero__image img');
      const activeContent = hero.querySelector('.hero__slide.is-active .hero__content');
      const orbs = hero.querySelectorAll('.hero-3d-orb');

      if (activeImage) {
        // Image drifts slowly in opposite direction (deeper background feel)
        activeImage.style.transform = `scale(1.06) translate(${moveX * -0.4}px, ${moveY * -0.4}px)`;
        activeImage.style.transition = 'transform 0.1s ease-out';
      }

      if (activeContent) {
        // Text/content drifts forward in same direction (foreground feel)
        activeContent.style.transform = `translate(${moveX * 0.4}px, ${moveY * 0.4}px)`;
        activeContent.style.transition = 'transform 0.1s ease-out';
      }

      // Parallax shifts for background 3D orbs
      orbs.forEach((orb, index) => {
        const factor = (index + 1) * 12; // Deeper orbs move less/more
        const orbX = ((x - centerX) / centerX) * factor;
        const orbY = ((y - centerY) / centerY) * factor;
        orb.style.transition = 'transform 0.1s ease-out';
        orb.style.transform = `translate3d(${orbX}px, ${orbY}px, ${(index + 1) * -40}px)`;
      });
    });

    hero.addEventListener('mouseleave', () => {
      const activeImage = hero.querySelector('.hero__slide.is-active .hero__image img');
      const activeContent = hero.querySelector('.hero__slide.is-active .hero__content');
      const orbs = hero.querySelectorAll('.hero-3d-orb');

      if (activeImage) {
        activeImage.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        activeImage.style.transform = 'scale(1) translate(0px, 0px)';
      }
      if (activeContent) {
        activeContent.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        activeContent.style.transform = 'translate(0px, 0px)';
      }
      
      orbs.forEach((orb, index) => {
        orb.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        orb.style.transform = `translate3d(0px, 0px, ${(index + 1) * -40}px)`;
      });
    });
  }

  /**
   * 3. Product Details Page 3D Model Toggle
   */
  function initProduct3DViewer() {
    const toggleBtn = document.getElementById('toggle3DViewerBtn');
    const mainImgWrapper = document.querySelector('.product-details__main-image');
    const modelContainer = document.getElementById('productModelViewerContainer');
    
    if (!toggleBtn || !mainImgWrapper || !modelContainer) return;

    const mainImg = mainImgWrapper.querySelector('img');
    const modelViewer = modelContainer.querySelector('model-viewer');

    toggleBtn.addEventListener('click', () => {
      const is3DActive = modelContainer.classList.contains('is-active');

      if (!is3DActive) {
        // Switch to 3D Viewer
        if (mainImg) mainImg.style.display = 'none';
        modelContainer.classList.add('is-active');
        modelContainer.style.display = 'block';
        toggleBtn.innerHTML = '<span class="btn__label"><i class="fas fa-image"></i> View 2D Image</span>';
        toggleBtn.classList.add('btn--active');
        
        // Force model-viewer to recalculate size and layout
        if (modelViewer) {
          modelViewer.dismissPoster();
        }
      } else {
        // Switch to 2D Image
        if (mainImg) mainImg.style.display = 'block';
        modelContainer.classList.remove('is-active');
        modelContainer.style.display = 'none';
        toggleBtn.innerHTML = '<span class="btn__label"><i class="fas fa-cubes"></i> View in 3D</span>';
        toggleBtn.classList.remove('btn--active');
      }
    });

    // Wire thumbnail clicks to automatically close 3D mode
    const thumbs = document.querySelectorAll('.product-details__thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (modelContainer.classList.contains('is-active')) {
          if (mainImg) mainImg.style.display = 'block';
          modelContainer.classList.remove('is-active');
          modelContainer.style.display = 'none';
          toggleBtn.innerHTML = '<span class="btn__label"><i class="fas fa-cubes"></i> View in 3D</span>';
          toggleBtn.classList.remove('btn--active');
        }
      });
    });
  }

  /**
   * 4. Scroll-linked depth parallax on category/product images.
   * As each card scrolls through the viewport, its image drifts a few
   * pixels — a subtle depth cue that keeps the 3D feeling going past the
   * hero, without needing the mouse. Runs on rAF so it never blocks
   * scrolling, and does nothing for reduced-motion users.
   */
  function initScrollDepthParallax() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const targets = Array.from(
      document.querySelectorAll('.category-card img, .product-card__image-wrapper')
    );
    if (targets.length === 0) return;

    let ticking = false;

    function updateParallax() {
      const viewportH = window.innerHeight;

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Progress: -1 (just above viewport) to 1 (just below viewport),
        // 0 when centered in the viewport.
        const centerOffset = rect.top + rect.height / 2 - viewportH / 2;
        const progress = Math.max(-1, Math.min(1, centerOffset / viewportH));
        const drift = progress * -16; // up to 16px of drift either way

        el.style.setProperty('--scroll-depth', `${drift}px`);
      });

      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );

    updateParallax();
  }

})();
