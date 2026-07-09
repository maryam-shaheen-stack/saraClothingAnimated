const mongoose = require('mongoose');

/**
 * One Cart document per "cartId" (see middleware/cart.js — every visitor,
 * logged in or not, gets a long-lived cartId cookie). If they later log
 * in, we link `user` to their account so their cart survives across
 * devices/sessions too, but the cookie stays the lookup key either way —
 * this avoids losing a guest's cart on login (see note in cart.js about
 * why we didn't just use the express-session id).
 */

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // '' when the product has no sizes at all. Kept as a plain string
    // (not an enum) so a cart item never breaks if a product's available
    // sizes change later — validation of "is this size still valid"
    // happens at add-time in the controller, not here.
    size: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    cartId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

cartSchema.statics.findOrCreateByCartId = async function (cartId) {
  let cart = await this.findOne({ cartId });
  if (!cart) {
    cart = await this.create({ cartId, items: [] });
  }
  return cart;
};

module.exports = mongoose.model('Cart', cartSchema);
