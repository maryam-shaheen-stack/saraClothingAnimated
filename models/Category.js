const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name. The admin form (categories.ejs) has no
// slug field — home.ejs/shop.ejs route by category.slug, so this has to
// happen invisibly on save rather than be typed by the client.
categorySchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();

  const baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  // Ensure uniqueness in case two categories share a name-derived slug
  while (
    await mongoose.models.Category.findOne({ slug, _id: { $ne: this._id } })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  this.slug = slug;
  next();
});

// Virtual: how many products belong to this category (used by admin/categories.ejs)
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

categorySchema.set('toObject', { virtuals: true });
categorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);
