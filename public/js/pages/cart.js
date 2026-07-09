/* ==========================================================================
   CART PAGE
   Quantity +/-, direct quantity edit, remove item — all call the real
   /cart/items API and patch the DOM + subtotal in place (no full reload).
   ========================================================================== */

(function () {
  'use strict';

  const cartItemsEl = document.getElementById('cartItems');
  if (!cartItemsEl) return;

  const subtotalEl = document.getElementById('cartSubtotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function formatRs(amount) {
    return 'Rs. ' + Number(amount).toLocaleString();
  }

  async function updateQuantity(itemId, quantity) {
    const res = await fetch('/cart/items/' + itemId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not update quantity.');
    return data;
  }

  async function removeItem(itemId) {
    const res = await fetch('/cart/items/' + itemId, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not remove this item.');
    return data;
  }

  cartItemsEl.querySelectorAll('.cart-item').forEach(function (row) {
    const itemId = row.getAttribute('data-cart-item-id');
    const qtyInput = row.querySelector('[data-qty-input]');
    const lineTotalEl = row.querySelector('.cart-item__line-total');
    const unitPrice = parseFloat(row.querySelector('.cart-item__unit-price').textContent.replace(/[^\d.]/g, ''));

    function applyQuantity(newQty) {
      qtyInput.value = newQty;
      lineTotalEl.textContent = formatRs(unitPrice * newQty);
    }

    async function handleQuantityChange(newQty) {
      const max = parseInt(qtyInput.max, 10) || 999;
      const clamped = Math.min(Math.max(newQty, 1), max);

      try {
        const data = await updateQuantity(itemId, clamped);
        applyQuantity(clamped);
        if (subtotalEl) subtotalEl.textContent = formatRs(data.subtotal);
        if (window.SaraUI && window.SaraUI.syncCartCount) window.SaraUI.syncCartCount();
      } catch (err) {
        alert(err.message || 'Could not update quantity.');
        qtyInput.value = qtyInput.defaultValue; // revert visually
      }
    }

    const decreaseBtn = row.querySelector('[data-qty-decrease]');
    const increaseBtn = row.querySelector('[data-qty-increase]');

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', function () {
        handleQuantityChange((parseInt(qtyInput.value, 10) || 1) - 1);
      });
    }
    if (increaseBtn) {
      increaseBtn.addEventListener('click', function () {
        handleQuantityChange((parseInt(qtyInput.value, 10) || 1) + 1);
      });
    }
    if (qtyInput) {
      qtyInput.addEventListener('change', function () {
        handleQuantityChange(parseInt(qtyInput.value, 10) || 1);
      });
    }

    const removeBtn = row.querySelector('[data-remove-item]');
    if (removeBtn) {
      removeBtn.addEventListener('click', async function () {
        try {
          const data = await removeItem(itemId);
          row.remove();
          if (subtotalEl) subtotalEl.textContent = formatRs(data.subtotal);
          if (window.SaraUI && window.SaraUI.syncCartCount) window.SaraUI.syncCartCount();

          if (!cartItemsEl.querySelector('.cart-item')) {
            window.location.reload(); // show the proper "cart is empty" state
          }
        } catch (err) {
          alert(err.message || 'Could not remove this item.');
        }
      });
    }
  });

  // Checkout flow isn't built yet — this is an honest placeholder rather
  // than a dead link, so it's obvious to replace once /checkout exists.
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      alert('Checkout is coming soon!');
    });
  }

})();
