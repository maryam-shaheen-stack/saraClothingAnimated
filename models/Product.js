const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (value) { return value == null || value < this.price; },
        message: 'Discount price must be less than the regular price',
      },
    },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    fabric: { type: String, trim: true, default: '' },
    sizes: {
      type: [String],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Custom'],
      default: [],
    },
    image: { type: String, required: [true, 'A main product image is required'] },
    gallery: { type: [String], default: [] },
    gltfModel: { type: String, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
module.exports = mongoose.model('Product', productSchema);
