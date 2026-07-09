const express = require('express');
const router = express.Router();

const { submitContactForm } = require('../controllers/messageController');
const { subscribe } = require('../controllers/subscriberController');
const { validate } = require('../middleware/validate');

// GET /contact
router.get('/contact', function (req, res) {
  res.render('pages/contact', { pageTitle: 'Contact Us', pageCss: 'contact', pageScript: 'contact' });
});

// POST /contact (application/json — public/js/contact.js)
router.post(
  '/contact',
  validate({
    name: { required: true, label: 'Name' },
    email: { required: true, email: true, label: 'Email' },
    subject: { required: true, label: 'Subject' },
    message: { required: true, label: 'Message' },
  }),
  submitContactForm
);

// POST /newsletter/subscribe (application/json — public/js/main.js, used by
// both the footer and home-page newsletter forms)
router.post(
  '/newsletter/subscribe',
  validate({ email: { required: true, email: true, label: 'Email' } }),
  subscribe
);

module.exports = router;
