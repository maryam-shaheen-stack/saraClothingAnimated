const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Message = require('../models/Message');
const Subscriber = require('../models/Subscriber');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/* ============================================================
   DASHBOARD
   ============================================================ */

// GET /admin/dashboard
const showDashboard = asyncHandler(async function (req, res) {
  const [productCount, categoryCount, unreadMessageCount, subscriberCount, recentMessages] =
    await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Message.countDocuments({ read: false }),
      Subscriber.countDocuments(),
      Message.find().sort({ createdAt: -1 }).limit(5),
    ]);

  res.render('admin/dashboard', {
    layout: 'layouts/admin',
    pageTitle: 'Dashboard',
    activeAdminPage: 'dashboard',
    stats: { productCount, categoryCount, unreadMessageCount, subscriberCount },
    recentMessages,
  });
});

/* ============================================================
   ANNOUNCEMENTS
   ============================================================ */

// GET /admin/announcements
const listAdminAnnouncements = asyncHandler(async function (req, res) {
  const announcements = await Announcement.find().sort({ createdAt: -1 });

  res.render('admin/announcements', {
    layout: 'layouts/admin',
    pageTitle: 'Announcements',
    pageStylesheet: 'announcements',
    pageScript: 'announcements',
    activeAdminPage: 'announcements',
    announcements,
  });
});

// GET /admin/announcements/:id — JSON, for the edit modal
const getAnnouncement = asyncHandler(async function (req, res) {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ message: 'Announcement not found.' });
  }
  res.json(announcement);
});

// POST /admin/announcements (application/json)
const createAnnouncement = asyncHandler(async function (req, res) {
  const { message, type, link, linkText, active } = req.body;

  const announcement = await Announcement.create({
    message,
    type,
    link,
    linkText,
    active: Boolean(active),
  });

  res.status(201).json(announcement);
});

// PUT /admin/announcements/:id
const updateAnnouncement = asyncHandler(async function (req, res) {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ message: 'Announcement not found.' });
  }

  const { message, type, link, linkText, active } = req.body;

  announcement.message = message ?? announcement.message;
  announcement.type = type ?? announcement.type;
  announcement.link = link ?? announcement.link;
  announcement.linkText = linkText ?? announcement.linkText;
  announcement.active = Boolean(active);

  await announcement.save();
  res.json(announcement);
});

// DELETE /admin/announcements/:id
const deleteAnnouncement = asyncHandler(async function (req, res) {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    return res.status(404).json({ message: 'Announcement not found.' });
  }
  res.json({ message: 'Announcement deleted.' });
});

/* ============================================================
   USERS  (routes/adminRoutes.js restricts these to role: 'admin')
   ============================================================ */

// GET /admin/users
const listAdminUsers = asyncHandler(async function (req, res) {
  const users = await User.find().sort({ createdAt: -1 });

  res.render('admin/users', {
    layout: 'layouts/admin',
    pageTitle: 'Users',
    pageStylesheet: 'users',
    pageScript: 'users',
    activeAdminPage: 'users',
    users,
    currentUser: req.currentUser,
  });
});

// GET /admin/users/:id — JSON, for the edit modal
const getUser = asyncHandler(async function (req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json(user);
});

// POST /admin/users (application/json)
const createUser = asyncHandler(async function (req, res) {
  const { name, email, role, password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const user = await User.create({ name, email, role, password });
  const safeUser = user.toObject();
  delete safeUser.password;

  res.status(201).json(safeUser);
});

// PUT /admin/users/:id — password field is optional; leaving it blank
// keeps the current password (per the hint text in views/admin/users.ejs).
const updateUser = asyncHandler(async function (req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const { name, email, role, password } = req.body;

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.role = role ?? user.role;

  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    user.password = password;
  }

  await user.save();
  const safeUser = user.toObject();
  delete safeUser.password;

  res.json(safeUser);
});

// DELETE /admin/users/:id
const deleteUser = asyncHandler(async function (req, res) {
  if (req.params.id === req.currentUser._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account while logged in.' });
  }

  const target = await User.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last remaining admin.' });
    }
  }

  await target.deleteOne();
  res.json({ message: 'User deleted.' });
});


/* ============================================================
   ORDERS
   ============================================================ */

const listAdminOrders = asyncHandler(async function (req, res) {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  res.render('admin/orders', {
    layout: 'layouts/admin',
    pageTitle: 'Orders',
    activeAdminPage: 'orders',
    orders,
  });
});

const updateOrderStatus = asyncHandler(async function (req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  order.status = req.body.status;
  await order.save();
  res.json({ message: 'Status updated.' });
});

module.exports = {
  showDashboard,
  listAdminAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listAdminUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listAdminOrders,
  updateOrderStatus,
};
