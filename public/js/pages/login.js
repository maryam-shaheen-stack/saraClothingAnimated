/* ==========================================================================
   LOGIN (unified — customers and staff both use this form)
   Submits to POST /login. On success the server returns { redirectTo },
   which is either wherever the person was trying to go before being
   bounced here (see requireAuth/requireStaff in middleware/auth.js), or
   their role-appropriate dashboard (/admin/dashboard vs /account/dashboard).
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  if (!form) return;

  // Defensive: if main.js failed to load/run for any reason, window.SaraUI
  // would be undefined, and destructuring it below would throw — which
  // would silently kill this whole script BEFORE form.addEventListener()
  // ever runs. That leaves the form with no JS handler at all, so a click
  // falls back to the browser's default (native) form submission: a GET
  // to the current page with no error shown, which looks exactly like
  // "it just loops back to the login page". We guard against that here.
  if (!window.SaraUI) {
    console.error('SaraUI helpers not found — /js/main.js may have failed to load. Check the Network tab for a 404 on main.js, or a JS error earlier in the console.');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const feedbackEl = document.getElementById('loginFormFeedback');
      if (feedbackEl) {
        feedbackEl.textContent = 'This page did not load correctly. Please refresh and try again.';
        feedbackEl.classList.add('is-error');
      }
    });
    return;
  }

  const { showFieldError, clearFieldError, showFeedback, setButtonLoading, EMAIL_PATTERN } = window.SaraUI;

  const fields = {
    email: { input: document.getElementById('loginEmail'), error: document.getElementById('loginEmailError') },
    password: { input: document.getElementById('loginPassword'), error: document.getElementById('loginPasswordError') },
  };

  const submitBtn = document.getElementById('loginSubmitBtn');
  const feedbackEl = document.getElementById('loginFormFeedback');

  function validateField(key) {
    const { input, error } = fields[key];
    const value = input.value.trim();

    if (!value) {
      showFieldError(input, error, 'This field is required.');
      return false;
    }

    if (key === 'email' && !EMAIL_PATTERN.test(value)) {
      showFieldError(input, error, 'Please enter a valid email address.');
      return false;
    }

    clearFieldError(input, error);
    return true;
  }

  Object.keys(fields).forEach(function (key) {
    fields[key].input.addEventListener('blur', function () {
      validateField(key);
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const results = Object.keys(fields).map(validateField);
    if (results.includes(false)) {
      showFeedback(feedbackEl, 'Please correct the highlighted fields.', 'error');
      return;
    }

    setButtonLoading(submitBtn, true);
    showFeedback(feedbackEl, '', null);

    const payload = {
      email: fields.email.input.value.trim(),
      password: fields.password.input.value,
    };

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      showFeedback(feedbackEl, 'Signed in. Redirecting...', 'success');
      window.location.href = data.redirectTo || '/account/dashboard';
    } catch (err) {
      showFeedback(feedbackEl, err.message || 'Unable to log in right now.', 'error');
      setButtonLoading(submitBtn, false);
    }
  });

})();