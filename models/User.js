const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Unified account model for the whole site.
 *
 * role: 'customer' | 'editor' | 'admin'
 *  - 'customer' — anyone who registers via the public /register form.
 *    Default role. Can place orders, has a cart + saved addresses.
 *  - 'editor'   — staff account, can manage products/categories/etc.
 *    in /admin but not manage other Users.
 *  - 'admin'    — full access, including promoting/demoting other users
 *    (see PUT /admin/users/:id/role).
 *
 * One login form (POST /login) is used for everyone; authController
 * checks the logged-in user's role after success and redirects:
 *   admin/editor -> /admin/dashboard
 *   customer     -> /account/dashboard
 */

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' }, // "Home", "Work", etc.
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Pakistan' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

// Embedded cart line — snapshot-free (always resolves live against Product
// at checkout so price/stock are always current, not stale at add-to-cart time)
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true, timestamps: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: ['customer', 'editor', 'admin'],
      default: 'customer',
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    cart: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving, but only if it changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Convenience used by middleware/auth.js to decide where a role belongs
userSchema.methods.isStaff = function () {
  return this.role === 'admin' || this.role === 'editor';
};

module.exports = mongoose.model('User', userSchema);