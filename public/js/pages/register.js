/* ==========================================================================
   REGISTER
   Submits to POST /register. Always creates a 'customer' account (the
   server enforces this, ignores any role field even if one were sent).
   On success the server auto-logs the user in and returns { redirectTo }.
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('registerForm');
  if (!form) return;

  // See login.js for why this guard exists — prevents a silent script
  // crash from leaving the form with no submit handler at all.
  if (!window.SaraUI) {
    console.error('SaraUI helpers not found — /js/main.js may have failed to load. Check the Network tab for a 404 on main.js, or a JS error earlier in the console.');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const feedbackEl = document.getElementById('registerFormFeedback');
      if (feedbackEl) {
        feedbackEl.textContent = 'This page did not load correctly. Please refresh and try again.';
        feedbackEl.classList.add('is-error');
      }
    });
    return;
  }

  const { showFieldError, clearFieldError, showFeedback, setButtonLoading, EMAIL_PATTERN } = window.SaraUI;

  const fields = {
    name: { input: document.getElementById('registerName'), error: document.getElementById('registerNameError') },
    email: { input: document.getElementById('registerEmail'), error: document.getElementById('registerEmailError') },
    password: { input: document.getElementById('registerPassword'), error: document.getElementById('registerPasswordError') },
    confirmPassword: {
      input: document.getElementById('registerConfirmPassword'),
      error: document.getElementById('registerConfirmPasswordError'),
    },
  };

  const submitBtn = document.getElementById('registerSubmitBtn');
  const feedbackEl = document.getElementById('registerFormFeedback');

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

    if (key === 'password' && value.length < 8) {
      showFieldError(input, error, 'Password must be at least 8 characters.');
      return false;
    }

    if (key === 'confirmPassword' && value !== fields.password.input.value.trim()) {
      showFieldError(input, error, 'Passwords do not match.');
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
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      password: fields.password.input.value,
      confirmPassword: fields.confirmPassword.input.value,
    };

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Could not create your account.');
      }

      showFeedback(feedbackEl, 'Account created. Redirecting...', 'success');
      window.location.href = data.redirectTo || '/account/dashboard';
    } catch (err) {
      showFeedback(feedbackEl, err.message || 'Unable to register right now.', 'error');
      setButtonLoading(submitBtn, false);
    }
  });

})();