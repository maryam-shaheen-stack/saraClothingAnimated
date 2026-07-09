/* ==========================================================================
   ADMIN — SUBSCRIBERS
   API convention (to be matched in subscriberController.js):
     GET    /admin/subscribers/export   -> triggers a CSV file download
     DELETE /admin/subscribers/:id
   ========================================================================== */

(function () {
  'use strict';

  const exportBtn = document.getElementById('exportSubscribersBtn');

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      // A plain navigation (not fetch) so the browser handles the file download.
      window.location.href = '/admin/subscribers/export';
    });
  }

  document.querySelectorAll('.delete-subscriber-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const subscriberId = btn.getAttribute('data-subscriber-id');
      const row = btn.closest('tr');

      if (!confirm('Remove this subscriber from the mailing list?')) return;

      try {
        const res = await fetch('/admin/subscribers/' + subscriberId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not remove this subscriber.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to remove this subscriber.');
      }
    });
  });

})();