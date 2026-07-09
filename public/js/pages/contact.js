/* ==========================================================================
   CONTACT PAGE
   Validates each field, submits to POST /contact, and reflects
   loading/success/error states without a page reload.
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const { showFieldError, clearFieldError, showFeedback, setButtonLoading, EMAIL_PATTERN } = window.SaraUI;

  const fields = {
    name: { input: document.getElementById('contactName'), error: document.getElementById('contactNameError') },
    email: { input: document.getElementById('contactEmail'), error: document.getElementById('contactEmailError') },
    subject: { input: document.getElementById('contactSubject'), error: document.getElementById('contactSubjectError') },
    message: { input: document.getElementById('contactMessage'), error: document.getElementById('contactMessageError') },
  };

  const submitBtn = document.getElementById('contactSubmitBtn');
  const feedbackEl = document.getElementById('contactFormFeedback');

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

  // Validate on blur for immediate feedback
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
      phone: document.getElementById('contactPhone').value.trim(),
      subject: fields.subject.input.value.trim(),
      message: fields.message.input.value.trim(),
    };

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      showFeedback(feedbackEl, 'Your message has been sent. We will reply within 24 hours.', 'success');
      form.reset();
    } catch (err) {
      showFeedback(feedbackEl, err.message || 'Unable to send your message right now.', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

})();