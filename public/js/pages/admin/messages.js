/* ==========================================================================
   ADMIN — MESSAGES
   API convention (to be matched in messageController.js):
     GET    /admin/messages/:id            -> JSON, also marks as read server-side
     DELETE /admin/messages/:id
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal } = window.SaraUI;

  const modal = document.getElementById('messageModal');
  const modalBody = document.getElementById('messageModalBody');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.querySelectorAll('.view-message-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const messageId = btn.getAttribute('data-message-id');
      const row = btn.closest('tr');

      modalBody.innerHTML = '<p>Loading message…</p>';
      openModal(modal);

      try {
        const res = await fetch('/admin/messages/' + messageId);
        if (!res.ok) throw new Error('Could not load this message.');
        const msg = await res.json();

        modalBody.innerHTML =
          '<p><strong>From:</strong> ' + escapeHtml(msg.name) + ' (' + escapeHtml(msg.email) + ')</p>' +
          (msg.phone ? '<p><strong>Phone:</strong> ' + escapeHtml(msg.phone) + '</p>' : '') +
          '<p><strong>Subject:</strong> ' + escapeHtml(msg.subject) + '</p>' +
          '<p><strong>Message:</strong></p><p>' + escapeHtml(msg.message) + '</p>';

        // Reflect the now-read status in the table without a full reload
        if (row) {
          row.classList.remove('admin-table__row--unread');
          const statusBadge = row.querySelector('.status-badge');
          if (statusBadge) {
            statusBadge.textContent = 'Read';
            statusBadge.classList.remove('status-badge--unread');
            statusBadge.classList.add('status-badge--read');
          }
        }
      } catch (err) {
        modalBody.innerHTML = '<p>' + escapeHtml(err.message || 'Unable to load this message.') + '</p>';
      }
    });
  });

  document.querySelectorAll('.delete-message-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const messageId = btn.getAttribute('data-message-id');
      const row = btn.closest('tr');

      if (!confirm('Delete this message? This cannot be undone.')) return;

      try {
        const res = await fetch('/admin/messages/' + messageId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this message.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this message.');
      }
    });
  });

})();