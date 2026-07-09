/* ==========================================================================
   ADMIN — TESTIMONIALS
   API convention (to be matched in testimonialController.js):
     GET    /admin/testimonials/:id
     POST   /admin/testimonials
     PUT    /admin/testimonials/:id
     DELETE /admin/testimonials/:id
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal, setButtonLoading, showFeedback } = window.SaraUI;

  const modal = document.getElementById('testimonialModal');
  const form = document.getElementById('testimonialForm');
  const modalTitle = document.getElementById('testimonialModalTitle');
  const submitBtn = document.getElementById('testimonialSubmitBtn');
  const feedbackEl = document.getElementById('testimonialFormFeedback');
  const openAddBtn = document.getElementById('openAddTestimonialModal');

  function resetForm() {
    form.reset();
    document.getElementById('testimonialId').value = '';
    showFeedback(feedbackEl, '', null);
  }

  if (openAddBtn) {
    openAddBtn.addEventListener('click', function () {
      resetForm();
      modalTitle.textContent = 'Add Testimonial';
      openModal(modal);
    });
  }

  document.querySelectorAll('.edit-testimonial-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const testimonialId = btn.getAttribute('data-testimonial-id');
      resetForm();
      modalTitle.textContent = 'Edit Testimonial';

      try {
        const res = await fetch('/admin/testimonials/' + testimonialId);
        if (!res.ok) throw new Error('Could not load testimonial details.');
        const testimonial = await res.json();

        document.getElementById('testimonialId').value = testimonial._id;
        document.getElementById('testimonialName').value = testimonial.name || '';
        document.getElementById('testimonialLocation').value = testimonial.location || '';
        document.getElementById('testimonialRating').value = testimonial.rating || 5;
        document.getElementById('testimonialMessage').value = testimonial.message || '';
        document.getElementById('testimonialPublished').checked = Boolean(testimonial.published);

        openModal(modal);
      } catch (err) {
        alert(err.message || 'Unable to load this testimonial for editing.');
      }
    });
  });

  document.querySelectorAll('.delete-testimonial-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const testimonialId = btn.getAttribute('data-testimonial-id');
      const row = btn.closest('tr');

      if (!confirm('Delete this testimonial?')) return;

      try {
        const res = await fetch('/admin/testimonials/' + testimonialId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this testimonial.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this testimonial.');
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const testimonialId = document.getElementById('testimonialId').value;
      const isEdit = Boolean(testimonialId);

      const payload = {
        name: document.getElementById('testimonialName').value.trim(),
        location: document.getElementById('testimonialLocation').value.trim(),
        rating: Number(document.getElementById('testimonialRating').value),
        message: document.getElementById('testimonialMessage').value.trim(),
        published: document.getElementById('testimonialPublished').checked,
      };

      setButtonLoading(submitBtn, true);
      showFeedback(feedbackEl, '', null);

      try {
        const res = await fetch('/admin/testimonials' + (isEdit ? '/' + testimonialId : ''), {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save this testimonial.');

        showFeedback(feedbackEl, 'Testimonial saved successfully.', 'success');
        setTimeout(function () { window.location.reload(); }, 700);
      } catch (err) {
        showFeedback(feedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

})();