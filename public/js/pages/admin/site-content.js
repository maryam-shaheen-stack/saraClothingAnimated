/* ==========================================================================
   ADMIN — SITE CONTENT (hero slides + story section)
   API convention (matches siteContentController.js):
     POST   /admin/site-content/hero-slides             (multipart/form-data)
     PUT    /admin/site-content/hero-slides/reorder      { order: [id, id, ...] }
     PUT    /admin/site-content/hero-slides/:slideId     (multipart/form-data)
     DELETE /admin/site-content/hero-slides/:slideId
     PUT    /admin/site-content/story                    (multipart/form-data)
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal, setButtonLoading, showFeedback } = window.SaraUI;

  /* ---------------- Hero slides ---------------- */

  const slideModal = document.getElementById('slideModal');
  const slideForm = document.getElementById('slideForm');
  const slideModalTitle = document.getElementById('slideModalTitle');
  const slideSubmitBtn = document.getElementById('slideSubmitBtn');
  const slideFeedbackEl = document.getElementById('slideFormFeedback');
  const slideImageRequiredHint = document.getElementById('slideImageRequiredHint');
  const openAddSlideBtn = document.getElementById('openAddSlideModal');
  const slideGrid = document.getElementById('slideGrid');

  function resetSlideForm() {
    slideForm.reset();
    document.getElementById('slideId').value = '';
    showFeedback(slideFeedbackEl, '', null);
  }

  if (openAddSlideBtn) {
    openAddSlideBtn.addEventListener('click', function () {
      resetSlideForm();
      slideModalTitle.textContent = 'Add Hero Slide';
      if (slideImageRequiredHint) slideImageRequiredHint.hidden = false;
      openModal(slideModal);
    });
  }

  document.querySelectorAll('.edit-slide-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('.slide-card');
      resetSlideForm();
      slideModalTitle.textContent = 'Edit Hero Slide';
      if (slideImageRequiredHint) slideImageRequiredHint.hidden = true; // optional on edit

      document.getElementById('slideId').value = btn.getAttribute('data-slide-id');
      document.getElementById('slideHeadline').value = card.querySelector('.slide-card__headline').textContent.trim() === '(No headline)'
        ? ''
        : card.querySelector('.slide-card__headline').textContent.trim();
      const subtextEl = card.querySelector('.slide-card__subtext');
      document.getElementById('slideSubtext').value = subtextEl ? subtextEl.textContent.trim() : '';

      openModal(slideModal);
    });
  });

  document.querySelectorAll('.delete-slide-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const slideId = btn.getAttribute('data-slide-id');
      const card = btn.closest('.slide-card');

      if (!confirm('Delete this hero slide? This cannot be undone.')) return;

      try {
        const res = await fetch('/admin/site-content/hero-slides/' + slideId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this slide.');
        if (card) card.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this slide.');
      }
    });
  });

  document.querySelectorAll('.move-slide-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const slideId = btn.getAttribute('data-slide-id');
      const direction = btn.getAttribute('data-direction');
      const card = btn.closest('.slide-card');
      const sibling = direction === 'up' ? card.previousElementSibling : card.nextElementSibling;

      if (!sibling) return;

      // Reorder in the DOM immediately so the UI feels instant, then persist.
      if (direction === 'up') {
        slideGrid.insertBefore(card, sibling);
      } else {
        slideGrid.insertBefore(sibling, card);
      }

      const newOrder = Array.from(slideGrid.querySelectorAll('.slide-card')).map(function (el) {
        return el.getAttribute('data-slide-id');
      });

      try {
        const res = await fetch('/admin/site-content/hero-slides/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newOrder }),
        });
        if (!res.ok) throw new Error();
        window.location.reload(); // simplest way to refresh slide numbers + disabled states
      } catch (err) {
        alert('Could not save the new slide order. Please try again.');
        window.location.reload();
      }
    });
  });

  if (slideForm) {
    slideForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const slideId = document.getElementById('slideId').value;
      const isEdit = Boolean(slideId);
      const imageInput = document.getElementById('slideImage');
      const imageError = document.getElementById('slideImageError');

      if (!isEdit && !imageInput.files.length) {
        imageError.textContent = 'A slide image is required.';
        return;
      }
      imageError.textContent = '';

      const formData = new FormData(slideForm);
      setButtonLoading(slideSubmitBtn, true);
      showFeedback(slideFeedbackEl, '', null);

      try {
        const res = await fetch(
          '/admin/site-content/hero-slides' + (isEdit ? '/' + slideId : ''),
          { method: isEdit ? 'PUT' : 'POST', body: formData }
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save this slide.');

        showFeedback(slideFeedbackEl, 'Slide saved successfully.', 'success');
        setTimeout(function () { window.location.reload(); }, 700);
      } catch (err) {
        showFeedback(slideFeedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(slideSubmitBtn, false);
      }
    });
  }

  /* ---------------- Story section ---------------- */

  const storyForm = document.getElementById('storyForm');
  const storySubmitBtn = document.getElementById('storySubmitBtn');
  const storyFeedbackEl = document.getElementById('storyFormFeedback');
  const storyImagePreview = document.getElementById('storyImagePreview');
  const storyImageInput = document.getElementById('storyImage');

  if (storyImageInput) {
    storyImageInput.addEventListener('change', function () {
      if (storyImageInput.files && storyImageInput.files[0]) {
        storyImagePreview.src = URL.createObjectURL(storyImageInput.files[0]);
      }
    });
  }

  if (storyForm) {
    storyForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(storyForm);
      setButtonLoading(storySubmitBtn, true);
      showFeedback(storyFeedbackEl, '', null);

      try {
        const res = await fetch('/admin/site-content/story', { method: 'PUT', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save the story section.');

        showFeedback(storyFeedbackEl, 'Story section saved successfully.', 'success');
      } catch (err) {
        showFeedback(storyFeedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(storySubmitBtn, false);
      }
    });
  }

})();
