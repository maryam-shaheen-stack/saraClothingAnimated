/* ==========================================================================
   SARA CLOTHING — MAIN.JS
   Global behavior loaded on every page: navbar, admin sidebar, newsletter
   forms, FAQ accordion, and shared UI helpers used by page-specific scripts.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Shared UI helpers — exposed globally so page-specific scripts
     (shop.js, contact.js, admin/*.js) don't duplicate this logic.
     ------------------------------------------------------------------ */

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setButtonLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
  }

  function showFieldError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('is-invalid');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('is-invalid');
    if (errorEl) errorEl.textContent = '';
  }

  function showFeedback(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-success', 'is-error');
    if (type) el.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = false;
    const firstField = modalEl.querySelector('input, select, textarea, button');
    if (firstField) firstField.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
  }

  window.SaraUI = {
    EMAIL_PATTERN,
    setButtonLoading,
    showFieldError,
    clearFieldError,
    showFeedback,
    openModal,
    closeModal,
  };

  /* ------------------------------------------------------------------
     Mobile navbar toggle
     ------------------------------------------------------------------ */

  const navToggle = document.getElementById('navbarToggle');
  const navMenu = document.getElementById('navbarMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navMenu.classList.toggle('is-open', !isOpen);
    });

    // Close menu when a link is clicked (mobile)
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      });
    });
  }

  /* ------------------------------------------------------------------
     Navbar search bar toggle
     ------------------------------------------------------------------ */

  const searchToggle = document.getElementById('navbarSearchToggle');
  const searchBar = document.getElementById('navbarSearchBar');

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', function () {
      const isOpen = searchToggle.getAttribute('aria-expanded') === 'true';
      searchToggle.setAttribute('aria-expanded', String(!isOpen));
      searchBar.hidden = isOpen;
      if (!isOpen) {
        const input = searchBar.querySelector('input');
        if (input) input.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Cart count badge — reflects the localStorage wishlist/cart written
     by product-details.js. Runs on every page load so the badge stays
     correct as the visitor moves around the site.
     ------------------------------------------------------------------ */

  async function syncCartCount() {
    const badge = document.querySelector('[data-cart-count]');
    if (!badge) return;

    try {
      const res = await fetch('/cart/count');
      const data = await res.json();
      const count = data.count || 0;
      badge.textContent = String(count);
      badge.hidden = count === 0;
    } catch (err) {
      // Network hiccup — leave whatever the badge already showed rather
      // than wiping it to 0, which would look like the cart emptied.
    }
  }

  window.SaraUI.syncCartCount = syncCartCount;
  syncCartCount();

  /* ------------------------------------------------------------------
     Announcement bar — dismiss and remember per-announcement so a
     closed banner doesn't reappear on the next page load.
     ------------------------------------------------------------------ */

  document.querySelectorAll('.announcement-bar__item').forEach(function (item) {
    const closeBtn = item.querySelector('.announcement-bar__close');
    const id = item.getAttribute('data-announcement-id');
    if (!closeBtn || !id) return;

    let dismissed = [];
    try {
      dismissed = JSON.parse(localStorage.getItem('saraClothingDismissedAnnouncements') || '[]');
    } catch (err) {
      dismissed = [];
    }

    if (dismissed.includes(id)) {
      item.remove();
      return;
    }

    closeBtn.addEventListener('click', function () {
      dismissed.push(id);
      localStorage.setItem('saraClothingDismissedAnnouncements', JSON.stringify(dismissed));
      item.remove();
    });
  });

  /* ------------------------------------------------------------------
     Admin sidebar toggle (mobile)
     ------------------------------------------------------------------ */

  const adminSidebarToggle = document.getElementById('adminSidebarToggle');
  const adminSidebar = document.querySelector('.admin-sidebar');

  if (adminSidebarToggle && adminSidebar) {
    adminSidebarToggle.addEventListener('click', function () {
      const isOpen = adminSidebarToggle.getAttribute('aria-expanded') === 'true';
      adminSidebarToggle.setAttribute('aria-expanded', String(!isOpen));
      adminSidebar.classList.toggle('is-open', !isOpen);
    });
  }

  /* ------------------------------------------------------------------
     Newsletter forms (footer + home banner) — same behavior, different IDs
     ------------------------------------------------------------------ */

  document.querySelectorAll('.newsletter-form').forEach(function (form) {
    const messageEl = form.parentElement.querySelector('.newsletter-form__message');
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      if (!EMAIL_PATTERN.test(email)) {
        showFeedback(messageEl, 'Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
      }

      setButtonLoading(submitBtn, true);
      showFeedback(messageEl, '', null);

      try {
        const res = await fetch('/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Something went wrong. Please try again.');
        }

        showFeedback(messageEl, 'You are subscribed. Welcome to Sara Clothing.', 'success');
        form.reset();
      } catch (err) {
        showFeedback(messageEl, err.message || 'Unable to subscribe right now.', 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  });

  /* ------------------------------------------------------------------
     FAQ accordion (generic — works for any .faq-item on any page)
     ------------------------------------------------------------------ */

  document.querySelectorAll('.faq-item__question').forEach(function (button) {
    button.addEventListener('click', function () {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(button.getAttribute('aria-controls'));

      button.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  /* ------------------------------------------------------------------
     Generic modal close (overlay click, X button, Cancel button)
     Any element with [data-close-modal] closes its nearest .modal.
     ------------------------------------------------------------------ */

  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', function () {
      const modal = el.closest('.modal');
      closeModal(modal);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    }
  });

})();