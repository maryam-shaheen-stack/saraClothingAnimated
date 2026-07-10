/* ==========================================================================
   PRODUCT DETAILS PAGE
   Gallery thumbnail swap, size selection, quantity stepper, and a real
   add-to-cart call to POST /cart/items.
   ========================================================================== */

(function () {
  'use strict';

  const mainImage = document.getElementById('mainProductImage');
  const thumbButtons = document.querySelectorAll('.product-details__thumb');
  const sizeButtons = document.querySelectorAll('.size-selector__option');
  const sizeError = document.getElementById('sizeSelectorError');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const cartFeedback = document.getElementById('cartFeedback');
  const quantityInput = document.getElementById('quantityInput');
  const quantityDecrease = document.getElementById('quantityDecrease');
  const quantityIncrease = document.getElementById('quantityIncrease');

  let selectedSize = null;

  /* ---- Gallery thumbnails ---- */

  thumbButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const newSrc = btn.getAttribute('data-image');
      if (mainImage && newSrc) {
        mainImage.src = newSrc;
      }
    });
  });

  /* ---- Size selection (single-select radio group) ---- */

  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      sizeButtons.forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
      btn.setAttribute('aria-checked', 'true');
      selectedSize = btn.getAttribute('data-size');
      if (sizeError) sizeError.textContent = '';
      window.SaraUI.showFeedback(cartFeedback, '', null);
    });
  });

  /* ---- Quantity stepper ---- */

  function clampQuantity() {
    if (!quantityInput) return;
    const max = parseInt(quantityInput.max, 10) || 999;
    let value = parseInt(quantityInput.value, 10) || 1;
    value = Math.min(Math.max(value, 1), max);
    quantityInput.value = value;
  }

  if (quantityInput) {
    quantityInput.addEventListener('change', clampQuantity);
  }
  if (quantityDecrease) {
    quantityDecrease.addEventListener('click', function () {
      quantityInput.value = (parseInt(quantityInput.value, 10) || 1) - 1;
      clampQuantity();
    });
  }
  if (quantityIncrease) {
    quantityIncrease.addEventListener('click', function () {
      quantityInput.value = (parseInt(quantityInput.value, 10) || 1) + 1;
      clampQuantity();
    });
  }

  /* ---- Add to cart ---- */

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async function () {
      if (sizeButtons.length > 0 && !selectedSize) {
        if (sizeError) sizeError.textContent = 'Please select a size before adding to cart.';
        window.SaraUI.showFeedback(cartFeedback, '', null);
        return;
      }

      const productId = addToCartBtn.getAttribute('data-product-id');
      const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;

      window.SaraUI.setButtonLoading(addToCartBtn, true);
      window.SaraUI.showFeedback(cartFeedback, '', null);

      try {
        const res = await fetch('/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, size: selectedSize || '', quantity }),
        });
        const data = await res.json();

        if (res.status === 401) {
          window.SaraUI.showFeedback(cartFeedback, 'Please log in to add items to your cart. Redirecting…', 'error');
          window.setTimeout(function () {
            window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.pathname);
          }, 900);
          return;
        }

        if (!res.ok) throw new Error(data.message || 'Could not add this item to your cart.');

        window.SaraUI.showFeedback(cartFeedback, 'Added to your cart.', 'success');
        if (window.SaraUI.syncCartCount) window.SaraUI.syncCartCount();
      } catch (err) {
        window.SaraUI.showFeedback(cartFeedback, err.message || 'Could not add this item. Please try again.', 'error');
      } finally {
        window.SaraUI.setButtonLoading(addToCartBtn, false);
      }
    });
  }

})();
