const Subscriber = require('../models/Subscriber');
const { asyncHandler } = require('../middleware/errorHandler');
const { EMAIL_PATTERN } = require('../middleware/validate');

/* ============================================================
   PUBLIC — Newsletter forms (footer + home banner, see public/js/main.js)
   ============================================================ */

// POST /newsletter/subscribe (application/json: { email })
const subscribe = asyncHandler(async function (req, res) {
  const { email } = req.body;

  if (!email || !EMAIL_PATTERN.test(String(email).trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await Subscriber.findOne({ email: normalizedEmail });

  if (existing) {
    // Not an error from the visitor's point of view — resubmitting an
    // already-subscribed email should still feel like success.
    return res.json({ message: 'You are subscribed. Welcome to Sara Clothing.' });
  }

  await Subscriber.create({ email: normalizedEmail });
  res.status(201).json({ message: 'You are subscribed. Welcome to Sara Clothing.' });
});

/* ============================================================
   ADMIN
   ============================================================ */

// GET /admin/subscribers
const listAdminSubscribers = asyncHandler(async function (req, res) {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });

  res.render('admin/subscribers', {
    layout: 'layouts/admin',
    pageTitle: 'Subscribers',
    pageStylesheet: 'subscribers',
    pageScript: 'subscribers',
    activeAdminPage: 'subscribers',
    subscribers,
  });
});

// DELETE /admin/subscribers/:id
const deleteSubscriber = asyncHandler(async function (req, res) {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
  if (!subscriber) {
    return res.status(404).json({ message: 'Subscriber not found.' });
  }
  res.json({ message: 'Subscriber removed.' });
});

module.exports = { subscribe, listAdminSubscribers, deleteSubscriber };
