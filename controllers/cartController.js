const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Builds the data the cart page (and the JSON endpoints) actually need:
 * each raw cart item plus its live product info, a per-line total, and
 * whether it's still actually purchasable (product deleted, out of
 * stock, or a size that's no longer offered) — a real store always
 * re-checks this at cart-view time, not just at add-to-cart time, since
 * stock/availability can change while something sits in someone's cart.
 */
async function buildCartView(cart) {
  await cart.populate('items.product');

  const lines = cart.items
    .filter(function (item) {
      return item.product; // product may have been deleted since it was added
    })
    .map(function (item) {
      const product = item.product;
      const inStock = product.stock > 0;
      const validSize = product.sizes.length === 0 || product.sizes.includes(item.size);
      const isAvailable = inStock && validSize;
      const unitPrice = product.discountPrice || product.price;

      return {
        itemId: item._id,
        product,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        isAvailable,
        availabilityMessage: !inStock ? 'Out of stock' : !validSize ? 'Size no longer available' : null,
        maxQuantity: Math.max(product.stock, 0),
      };
    });

  const subtotal = lines.reduce(function (sum, line) {
    return sum + (line.isAvailable ? line.lineTotal : 0);
  }, 0);

  const itemCount = lines.reduce(function (sum, line) {
    return sum + line.quantity;
  }, 0);

  return { lines, subtotal, itemCount, hasUnavailableItems: lines.some((l) => !l.isAvailable) };
}

// GET /cart
const showCart = asyncHandler(async function (req, res) {
  const cart = await Cart.findOrCreateByCartId(req.cartId);
  const cartView = await buildCartView(cart);

  res.render('pages/cart', {
    pageTitle: 'Your Cart',
    pageCss: 'cart',
    pageScript: 'cart',
    cart: cartView,
  });
});

// GET /cart/count — tiny JSON endpoint the navbar badge polls on every
// page load (replaces the old localStorage-based counter).
const getCartCount = asyncHandler(async function (req, res) {
  const cart = await Cart.findOne({ cartId: req.cartId }).select('items');
  const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  res.json({ count });
});

// POST /cart/items  { productId, size, quantity }
const addItem = asyncHandler(async function (req, res) {
  const { productId, size, quantity } = req.body;
  const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'This product could not be found.' });
  }

  if (product.sizes.length > 0 && !product.sizes.includes(size)) {
    return res.status(400).json({ message: 'Please select a valid size.' });
  }

  if (product.stock < 1) {
    return res.status(400).json({ message: 'This product is currently out of stock.' });
  }

  const cart = await Cart.findOrCreateByCartId(req.cartId);
  const existingItem = cart.items.find(function (item) {
    return item.product.toString() === productId && item.size === (size || '');
  });

  const newQuantity = (existingItem ? existingItem.quantity : 0) + requestedQty;
  if (newQuantity > product.stock) {
    return res.status(400).json({
      message: `Only ${product.stock} left in stock — you already have ${existingItem ? existingItem.quantity : 0} in your cart.`,
    });
  }

  if (existingItem) {
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, size: size || '', quantity: requestedQty });
  }

  if (req.currentUser && !cart.user) {
    cart.user = req.currentUser._id;
  }

  await cart.save();
  const cartView = await buildCartView(cart);
  res.status(201).json({ message: 'Added to cart.', itemCount: cartView.itemCount });
});

// PUT /cart/items/:itemId  { quantity }
const updateItem = asyncHandler(async function (req, res) {
  const { quantity } = req.body;
  const requestedQty = parseInt(quantity, 10);

  const cart = await Cart.findOrCreateByCartId(req.cartId);
  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ message: 'This cart item no longer exists.' });
  }

  if (!requestedQty || requestedQty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  const product = await Product.findById(item.product);
  if (product && requestedQty > product.stock) {
    return res.status(400).json({ message: `Only ${product.stock} left in stock.` });
  }

  item.quantity = requestedQty;
  await cart.save();

  const cartView = await buildCartView(cart);
  res.json({ message: 'Cart updated.', subtotal: cartView.subtotal, itemCount: cartView.itemCount });
});

// DELETE /cart/items/:itemId
const removeItem = asyncHandler(async function (req, res) {
  const cart = await Cart.findOrCreateByCartId(req.cartId);
  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ message: 'This cart item no longer exists.' });
  }

  item.deleteOne();
  await cart.save();

  const cartView = await buildCartView(cart);
  res.json({ message: 'Item removed.', subtotal: cartView.subtotal, itemCount: cartView.itemCount });
});

module.exports = {
  showCart,
  getCartCount,
  addItem,
  updateItem,
  removeItem,
};
