const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  size: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    shippingAddress: shippingAddressSchema,
    notes: { type: String, default: '' },
    status: {
      type: String,
      // 'delivered' = admin marked as delivered
      // 'received'  = customer confirmed they got it
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'received', 'cancelled'],
      default: 'pending',
    },
    customerConfirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
