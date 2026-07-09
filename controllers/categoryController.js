const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteCloudinaryImage } = require('../middleware/upload');

// GET /admin/categories
const listAdminCategories = asyncHandler(async function (req, res) {
  // productCount is a virtual populate defined on the schema (used to warn
  // admins before they delete a category that's still in use).
  const categories = await Category.find().populate('productCount').sort({ name: 1 });

  res.render('admin/categories', {
    layout: 'layouts/admin',
    pageTitle: 'Categories',
    pageStylesheet: 'categories',
    pageScript: 'categories',
    activeAdminPage: 'categories',
    categories,
  });
});

// GET /admin/categories/:id — JSON, for the edit modal
const getCategory = asyncHandler(async function (req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }
  res.json(category);
});

// POST /admin/categories (multipart/form-data, field "image" optional)
const createCategory = asyncHandler(async function (req, res) {
  const { name } = req.body;

  const category = await Category.create({
    name,
    image: req.file ? req.file.path : '',
  });

  res.status(201).json(category);
});

// PUT /admin/categories/:id
const updateCategory = asyncHandler(async function (req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  category.name = req.body.name ?? category.name;

  if (req.file) {
    const oldImage = category.image;
    category.image = req.file.path;
    deleteCloudinaryImage(oldImage);
  }

  await category.save();
  res.json(category);
});

// DELETE /admin/categories/:id — blocked if products still reference it,
// so deleting a category can never leave products with a dangling
// category reference (shop.ejs/product-card.ejs assume category always resolves).
const deleteCategory = asyncHandler(async function (req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return res.status(409).json({
      message: `Cannot delete "${category.name}" — ${productCount} product(s) still use this category. Move or delete them first.`,
    });
  }

  await category.deleteOne();
  deleteCloudinaryImage(category.image);

  res.json({ message: 'Category deleted.' });
});

module.exports = { listAdminCategories, getCategory, createCategory, updateCategory, deleteCategory };
