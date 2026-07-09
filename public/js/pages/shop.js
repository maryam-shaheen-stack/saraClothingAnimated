/* ==========================================================================
   SHOP PAGE
   Filters are applied by rebuilding the query string and letting the
   server re-render /shop with the new filters (matches the pagination
   links already used in shop.ejs, so there's one consistent data flow).
   ========================================================================== */

(function () {
  'use strict';

  const applyBtn = document.getElementById('applyFilters');
  const clearBtn = document.getElementById('clearFilters');
  const sortSelect = document.getElementById('sortSelect');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');

  function buildQueryAndNavigate() {
    const params = new URLSearchParams();

    const checkedCategories = Array.from(categoryCheckboxes)
      .filter(function (cb) { return cb.checked && cb.value !== 'all'; })
      .map(function (cb) { return cb.value; });

    if (checkedCategories.length > 0) {
      params.set('category', checkedCategories.join(','));
    }

    if (minPriceInput.value) params.set('minPrice', minPriceInput.value);
    if (maxPriceInput.value) params.set('maxPrice', maxPriceInput.value);
    if (sortSelect.value) params.set('sort', sortSelect.value);

    window.location.href = '/shop' + (params.toString() ? '?' + params.toString() : '');
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', buildQueryAndNavigate);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      window.location.href = '/shop';
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', buildQueryAndNavigate);
  }

  // Reflect current URL filters back into the form controls on page load
  (function syncFormWithUrl() {
    const params = new URLSearchParams(window.location.search);

    const activeCategories = (params.get('category') || '').split(',').filter(Boolean);
    if (activeCategories.length > 0) {
      categoryCheckboxes.forEach(function (cb) {
        if (cb.value !== 'all') {
          cb.checked = activeCategories.includes(cb.value);
        } else {
          cb.checked = false;
        }
      });
    }

    if (params.get('minPrice')) minPriceInput.value = params.get('minPrice');
    if (params.get('maxPrice')) maxPriceInput.value = params.get('maxPrice');
    if (params.get('sort')) sortSelect.value = params.get('sort');
  })();

})();