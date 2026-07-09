/* ==========================================================================
   ADMIN — CATEGORIES
   API convention (to be matched in categoryController.js):
     GET    /admin/categories/:id
     POST   /admin/categories          (multipart/form-data)
     PUT    /admin/categories/:id      (multipart/form-data)
     DELETE /admin/categories/:id
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal, setButtonLoading, showFeedback } = window.SaraUI;

  const modal = document.getElementById('categoryModal');
  const form = document.getElementById('categoryForm');
  const modalTitle = document.getElementById('categoryModalTitle');
  const submitBtn = document.getElementById('categorySubmitBtn');
  const feedbackEl = document.getElementById('categoryFormFeedback');
  const openAddBtn = document.getElementById('openAddCategoryModal');

  function resetForm() {
    form.reset();
    document.getElementById('categoryId').value = '';
    showFeedback(feedbackEl, '', null);
  }

  if (openAddBtn) {
    openAddBtn.addEventListener('click', function () {
      resetForm();
      modalTitle.textContent = 'Add Category';
      openModal(modal);
    });
  }

  document.querySelectorAll('.edit-category-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const categoryId = btn.getAttribute('data-category-id');
      resetForm();
      modalTitle.textContent = 'Edit Category';

      try {
        const res = await fetch('/admin/categories/' + categoryId);
        if (!res.ok) throw new Error('Could not load category details.');
        const category = await res.json();

        document.getElementById('categoryId').value = category._id;
        document.getElementById('categoryName').value = category.name || '';

        openModal(modal);
      } catch (err) {
        alert(err.message || 'Unable to load this category for editing.');
      }
    });
  });

  document.querySelectorAll('.delete-category-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const categoryId = btn.getAttribute('data-category-id');
      const row = btn.closest('tr');

      if (!confirm('Delete this category? Products in this category will remain, but uncategorized.')) return;

      try {
        const res = await fetch('/admin/categories/' + categoryId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this category.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this category.');
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const categoryId = document.getElementById('categoryId').value;
      const isEdit = Boolean(categoryId);
      const formData = new FormData(form);

      setButtonLoading(submitBtn, true);
      showFeedback(feedbackEl, '', null);

      try {
        const res = await fetch('/admin/categories' + (isEdit ? '/' + categoryId : ''), {
          method: isEdit ? 'PUT' : 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save this category.');

        showFeedback(feedbackEl, 'Category saved successfully.', 'success');
        setTimeout(function () { window.location.reload(); }, 700);
      } catch (err) {
        showFeedback(feedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

})();