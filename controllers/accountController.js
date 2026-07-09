const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /account/dashboard
const showDashboard = asyncHandler(async function (req, res) {
  const recentOrders = await Order.find({ user: req.currentUser._id })
    .sort({ createdAt: -1 })
    .limit(10);

  res.render('pages/account/dashboard', {
    pageTitle: 'My Account',
    pageCss: 'account',
    layout: 'layouts/main',
    recentOrders,
  });
});

// POST /account/orders/:id/confirm-received
// Customer confirms they received their order
const confirmReceived = asyncHandler(async function (req, res) {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.currentUser._id,
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  // Only allow if admin already marked as delivered
  if (order.status !== 'delivered') {
    return res.status(400).json({ message: 'Order has not been marked as delivered yet.' });
  }

  order.status = 'received';
  order.customerConfirmedAt = new Date();
  await order.save();

  res.json({ message: 'Thank you for confirming! Your order is marked as received.' });
});

module.exports = { showDashboard, confirmReceived };
