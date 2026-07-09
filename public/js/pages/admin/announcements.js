/* ==========================================================================
   ADMIN — ANNOUNCEMENTS
   API convention (to be matched in announcementController.js):
     GET    /admin/announcements/:id
     POST   /admin/announcements
     PUT    /admin/announcements/:id
     DELETE /admin/announcements/:id
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal, setButtonLoading, showFeedback } = window.SaraUI;

  const modal = document.getElementById('announcementModal');
  const form = document.getElementById('announcementForm');
  const modalTitle = document.getElementById('announcementModalTitle');
  const submitBtn = document.getElementById('announcementSubmitBtn');
  const feedbackEl = document.getElementById('announcementFormFeedback');
  const openAddBtn = document.getElementById('openAddAnnouncementModal');

  function resetForm() {
    form.reset();
    document.getElementById('announcementId').value = '';
    document.getElementById('announcementActive').checked = true;
    showFeedback(feedbackEl, '', null);
  }

  if (openAddBtn) {
    openAddBtn.addEventListener('click', function () {
      resetForm();
      modalTitle.textContent = 'Add Announcement';
      openModal(modal);
    });
  }

  document.querySelectorAll('.edit-announcement-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const announcementId = btn.getAttribute('data-announcement-id');
      resetForm();
      modalTitle.textContent = 'Edit Announcement';

      try {
        const res = await fetch('/admin/announcements/' + announcementId);
        if (!res.ok) throw new Error('Could not load announcement details.');
        const announcement = await res.json();

        document.getElementById('announcementId').value = announcement._id;
        document.getElementById('announcementMessage').value = announcement.message || '';
        document.getElementById('announcementType').value = announcement.type || 'sale';
        document.getElementById('announcementLink').value = announcement.link || '';
        document.getElementById('announcementLinkText').value = announcement.linkText || '';
        document.getElementById('announcementActive').checked = Boolean(announcement.active);

        openModal(modal);
      } catch (err) {
        alert(err.message || 'Unable to load this announcement for editing.');
      }
    });
  });

  document.querySelectorAll('.delete-announcement-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const announcementId = btn.getAttribute('data-announcement-id');
      const row = btn.closest('tr');

      if (!confirm('Delete this announcement?')) return;

      try {
        const res = await fetch('/admin/announcements/' + announcementId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this announcement.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this announcement.');
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const announcementId = document.getElementById('announcementId').value;
      const isEdit = Boolean(announcementId);

      const payload = {
        message: document.getElementById('announcementMessage').value.trim(),
        type: document.getElementById('announcementType').value,
        link: document.getElementById('announcementLink').value.trim(),
        linkText: document.getElementById('announcementLinkText').value.trim(),
        active: document.getElementById('announcementActive').checked,
      };

      setButtonLoading(submitBtn, true);
      showFeedback(feedbackEl, '', null);

      try {
        const res = await fetch('/admin/announcements' + (isEdit ? '/' + announcementId : ''), {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save this announcement.');

        showFeedback(feedbackEl, 'Announcement saved successfully.', 'success');
        setTimeout(function () { window.location.reload(); }, 700);
      } catch (err) {
        showFeedback(feedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

})();
