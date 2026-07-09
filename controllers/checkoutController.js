const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /checkout
const showCheckout = asyncHandler(async function (req, res) {
  const cart = await Cart.findOne({ cartId: req.cartId }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return res.redirect('/cart');
  }

  const lines = cart.items
    .filter(function (item) { return item.product; })
    .map(function (item) {
      const unitPrice = item.product.discountPrice || item.product.price;
      return {
        product: item.product,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  res.render('pages/checkout', {
    pageTitle: 'Checkout',
    pageCss: 'checkout',
    lines,
    subtotal,
  });
});

// POST /checkout — place order
const placeOrder = asyncHandler(async function (req, res) {
  const { name, phone, address, city, notes } = req.body;

  if (!name || !phone || !address || !city) {
    return res.redirect('/checkout');
  }

  const cart = await Cart.findOne({ cartId: req.cartId }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return res.redirect('/cart');
  }

  const orderItems = cart.items
    .filter(function (item) { return item.product; })
    .map(function (item) {
      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.image,
        price: item.product.discountPrice || item.product.price,
        size: item.size || '',
        quantity: item.quantity,
      };
    });

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    user: req.currentUser ? req.currentUser._id : null,
    items: orderItems,
    total,
    shippingAddress: { name, phone, address, city },
    notes: notes || '',
    status: 'pending',
  });

  // Clear cart
  cart.items = [];
  await cart.save();

  // Build WhatsApp notification message for admin
  const itemsList = orderItems.map(function(i) {
    return `• ${i.name}${i.size ? ' ('+i.size+')' : ''} × ${i.quantity} = Rs. ${(i.price * i.quantity).toLocaleString()}`;
  }).join('\n');

  const whatsappMessage = encodeURIComponent(
    `🛍️ *New Order Received!*\n\n` +
    `*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n` +
    `*Customer:* ${name}\n` +
    `*Phone:* ${phone}\n` +
    `*Address:* ${address}, ${city}\n` +
    `${notes ? '*Notes:* ' + notes + '\n' : ''}` +
    `\n*Items:*\n${itemsList}\n\n` +
    `*Total: Rs. ${total.toLocaleString()}*\n\n` +
    `Payment: Cash on Delivery`
  );

  const adminWhatsapp = process.env.ADMIN_WHATSAPP_NUMBER || '';
  const whatsappUrl = adminWhatsapp
    ? `https://wa.me/${adminWhatsapp}?text=${whatsappMessage}`
    : null;

  res.render('pages/order-success', {
    pageTitle: 'Order Placed!',
    name,
    whatsappUrl,
  });
});

module.exports = { showCheckout, placeOrder };
