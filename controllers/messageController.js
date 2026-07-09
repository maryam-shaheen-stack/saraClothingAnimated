const Message = require('../models/Message');
const { asyncHandler } = require('../middleware/errorHandler');

/* ============================================================
   PUBLIC — Contact page
   ============================================================ */

// POST /contact (application/json — see public/js/contact.js)
const submitContactForm = asyncHandler(async function (req, res) {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  await Message.create({ name, email, phone, subject, message });

  res.status(201).json({ message: 'Your message has been sent. We will reply within 24 hours.' });
});

/* ============================================================
   ADMIN
   ============================================================ */

// GET /admin/messages
const listAdminMessages = asyncHandler(async function (req, res) {
  const messages = await Message.find().sort({ createdAt: -1 });

  res.render('admin/messages', {
    layout: 'layouts/admin',
    pageTitle: 'Messages',
    pageStylesheet: 'messages',
    pageScript: 'messages',
    activeAdminPage: 'messages',
    messages,
  });
});

// GET /admin/messages/:id — JSON, also marks the message read the first
// time an admin opens it (per the comment in models/Message.js).
const getMessage = asyncHandler(async function (req, res) {
  const message = await Message.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  if (!message.read) {
    message.read = true;
    await message.save();
  }

  res.json(message);
});

// DELETE /admin/messages/:id
const deleteMessage = asyncHandler(async function (req, res) {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }
  res.json({ message: 'Message deleted.' });
});

module.exports = { submitContactForm, listAdminMessages, getMessage, deleteMessage };
