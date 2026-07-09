/* ==========================================================================
   ADMIN — USERS
   API convention (to be matched in adminController.js / authController.js):
     GET    /admin/users/:id
     POST   /admin/users
     PUT    /admin/users/:id     (password field optional — blank keeps current)
     DELETE /admin/users/:id
   ========================================================================== */

(function () {
  'use strict';

  const { openModal, closeModal, setButtonLoading, showFeedback } = window.SaraUI;

  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  const modalTitle = document.getElementById('userModalTitle');
  const submitBtn = document.getElementById('userSubmitBtn');
  const feedbackEl = document.getElementById('userFormFeedback');
  const openAddBtn = document.getElementById('openAddUserModal');
  const passwordInput = document.getElementById('userPassword');

  function resetForm() {
    form.reset();
    document.getElementById('userId').value = '';
    showFeedback(feedbackEl, '', null);
  }

  if (openAddBtn) {
    openAddBtn.addEventListener('click', function () {
      resetForm();
      modalTitle.textContent = 'Add User';
      passwordInput.required = true;
      openModal(modal);
    });
  }

  document.querySelectorAll('.edit-user-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const userId = btn.getAttribute('data-user-id');
      resetForm();
      modalTitle.textContent = 'Edit User';
      passwordInput.required = false;

      try {
        const res = await fetch('/admin/users/' + userId);
        if (!res.ok) throw new Error('Could not load user details.');
        const user = await res.json();

        document.getElementById('userId').value = user._id;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role || 'editor';

        openModal(modal);
      } catch (err) {
        alert(err.message || 'Unable to load this user for editing.');
      }
    });
  });

  document.querySelectorAll('.delete-user-btn').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      const userId = btn.getAttribute('data-user-id');
      const row = btn.closest('tr');

      if (!confirm('Delete this user? They will lose access immediately.')) return;

      try {
        const res = await fetch('/admin/users/' + userId, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not delete this user.');
        if (row) row.remove();
      } catch (err) {
        alert(err.message || 'Unable to delete this user.');
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const userId = document.getElementById('userId').value;
      const isEdit = Boolean(userId);

      const payload = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        role: document.getElementById('userRole').value,
      };
      if (passwordInput.value) {
        payload.password = passwordInput.value;
      }

      setButtonLoading(submitBtn, true);
      showFeedback(feedbackEl, '', null);

      try {
        const res = await fetch('/admin/users' + (isEdit ? '/' + userId : ''), {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Could not save this user.');

        showFeedback(feedbackEl, 'User saved successfully.', 'success');
        setTimeout(function () { window.location.reload(); }, 700);
      } catch (err) {
        showFeedback(feedbackEl, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

})();