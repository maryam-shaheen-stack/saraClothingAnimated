/**
 * Lightweight, dependency-free request validation. package.json doesn't
 * include express-validator/joi/zod, so this is a small set of reusable
 * checks — good enough for this project's form shapes, returns the same
 * { message } JSON shape every admin form's showFeedback() already expects
 * on a non-2xx response.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/**
 * Builds a validation middleware from a rules object, e.g.:
 *   validate({
 *     name: { required: true },
 *     email: { required: true, email: true },
 *     rating: { required: true, min: 1, max: 5 },
 *   })
 *
 * Supported per-field rules: required, email, minLength, maxLength, min, max, oneOf.
 */
function validate(rules) {
  return function (req, res, next) {
    const errors = [];

    Object.keys(rules).forEach(function (field) {
      const rule = rules[field];
      const value = req.body[field];

      if (rule.required && isBlank(value)) {
        errors.push(`${rule.label || field} is required.`);
        return; // skip further checks on a missing field
      }

      if (isBlank(value)) return; // optional + not provided, nothing else to check

      if (rule.email && !EMAIL_PATTERN.test(String(value).trim())) {
        errors.push('Please enter a valid email address.');
      }

      if (rule.minLength && String(value).trim().length < rule.minLength) {
        errors.push(`${rule.label || field} must be at least ${rule.minLength} characters.`);
      }

      if (rule.maxLength && String(value).trim().length > rule.maxLength) {
        errors.push(`${rule.label || field} must be at most ${rule.maxLength} characters.`);
      }

      if (rule.min !== undefined && Number(value) < rule.min) {
        errors.push(`${rule.label || field} must be at least ${rule.min}.`);
      }

      if (rule.max !== undefined && Number(value) > rule.max) {
        errors.push(`${rule.label || field} must be at most ${rule.max}.`);
      }

      if (rule.oneOf && !rule.oneOf.includes(value)) {
        errors.push(`${rule.label || field} must be one of: ${rule.oneOf.join(', ')}.`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    next();
  };
}

module.exports = { validate, EMAIL_PATTERN, isBlank };
