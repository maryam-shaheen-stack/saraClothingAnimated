/* ==========================================================================
   ADMIN — PRODUCTS
   API convention this file assumes (to be matched in productController.js):
     GET    /admin/products/:id      -> JSON, single product (for edit prefill)
     POST   /admin/products          -> create (multipart/form-data)
     PUT    /admin/products/:id      -> update (multipart/form-data)
     DELETE /admin/products/:id      -> delete
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal, setButtonLoading, showFeedback } = window.SaraUI;

  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const modalTitle = document.getElementById('productModalTitle');
  const submitBtn = document.getElementById('productSubmitBtn');
  const feedbackEl = document.getElementById('productFormFeedback');

  const openAddBtn = document.getElementById('openAddProductModal');

  const galleryPreviewEl = document.getElementById('existingGalleryPreview');
  const removeGalleryInput = document.getElementById('removeGalleryImages');
  const productImageRequiredHint = document.getElementById('productImageRequiredHint');

  function resetForm() {
    form.reset();
    document.getElementById('productId').value = '';
    removeGalleryInput.value = '[]';
    galleryPreviewEl.innerHTML = '';
    showFeedback(feedbackEl, '', null);
  }

  function renderGalleryPreview(galleryUrls) {
    galleryPreviewEl.innerHTML = '';
    let removedUrls = [];

    (galleryUrls || []).forEach(function (url) {
      const item = document.createElement('div');
      item.className = 'gallery-preview__item';
      item.innerHTML = '<img src="' + url + '" alt="Product photo">' +
        '<button type="button" class="gallery-preview__remove" aria-label="Remove this photo">&times;</button>';

      item.querySelector('.gallery-preview__remove').addEventListener('click', function () {
        removedUrls.push(url);
        removeGalleryInput.value = JSON.stringify(removedUrls);
        item.remove();
      });

      galleryPreviewEl.appendChild(item);
    });
  }

  if (openAddBtn) {
    openAddBtn.addEventListener('click', function () {
      resetForm();
      modalTitle.textContent = 'Add Product';
      if (productImageRequiredHint) productImageRequiredHint.hidden = false;
      openModal(modal);
    });
  }

  document.querySelectorAll('.edit-product-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const productId = btn.getAttribute('data-product-id');
      resetForm();
      modalTitle.textContent = 'Edit Product';
      if (productImageRequiredHint) productImageRequiredHint.hidden = true;

      try {
        const res = await fetch('/admin/products/' + productId);
        if (!res.ok) throw new Error('Could not load product details.');
        const product = await res.json();

        document.getElementById('productId').value = product._id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productDescription').value = product.description || '';

        const selectedSizes = product.sizes || [];
        document.querySelectorAll('#productSizesGroup input[type="checkbox"]').forEach(function (checkbox) {
          checkbox.checked = selectedSizes.includes(checkbox.value);
        });

        renderGalleryPreview(product.gallery);

        openModal(modal);
      } catch (err) {
        alert(err.message || 'Unable to load this product for editing.');
      }
    });
  });

  document.querySelectorAll('.delete-product-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const productId = btn.getAttribute('data-product-id');
      const row = btn.closest('tr');

      if (!confirm('Delete this product? This cannot be undone.')) return;

      try {
        const res = await fetch('/admin/products/' + productId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this product.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this product.');
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const productId = document.getElementById('productId').value;
      const isEdit = Boolean(productId);
      const mainImageInput = document.getElementById('productImage');

      if (!isEdit && !mainImageInput.files.length) {
        showFeedback(feedbackEl, 'A main product image is required.', 'error');
        return;
      }

      const formData = new FormData(form);

      setButtonLoading(submitBtn, true);
      showFeedback(feedbackEl, '', null);

      try {
        const res = await fetch('/admin/products' + (isEdit ? '/' + productId : ''), {
          method: isEdit ? 'PUT' : 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save this product.');

        showFeedback(feedbackEl, 'Product saved successfully.', 'success');
        setTimeout(function () {
          window.location.reload();
        }, 700);
      } catch (err) {
        showFeedback(feedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

})();