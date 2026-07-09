const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteCloudinaryImage } = require('../middleware/upload');

const PRODUCTS_PER_PAGE = 12;

/* ============================================================
   PUBLIC STOREFRONT
   ============================================================ */

// GET /shop — filter by category (comma-separated slugs), price range,
// and sort, matching the query string shop.js builds on the client.
const listShopProducts = asyncHandler(async function (req, res) {
  const { category, minPrice, maxPrice, sort, page } = req.query;

  const filter = {};

  if (category) {
    const slugs = category.split(',').filter(Boolean);
    if (slugs.length > 0) {
      const categoryDocs = await Category.find({ slug: { $in: slugs } }).select('_id');
      filter.category = { $in: categoryDocs.map((c) => c._id) };
    }
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 }; // 'newest' default
  if (sort === 'price-asc') sortOption = { price: 1 };
  if (sort === 'price-desc') sortOption = { price: -1 };
  // No popularity/view-count field exists on Product yet, so "popular"
  // falls back to newest rather than silently ignoring the sort choice.
  if (sort === 'popular') sortOption = { createdAt: -1 };

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const totalCount = await Product.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE));

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortOption)
    .skip((currentPage - 1) * PRODUCTS_PER_PAGE)
    .limit(PRODUCTS_PER_PAGE);

  const categories = await Category.find().sort({ name: 1 });

  res.render('pages/shop', {
    pageTitle: 'Shop',
    pageCss: 'shop',
    pageScript: 'shop',
    products,
    categories,
    totalPages,
    currentPage,
  });
});

// GET /shop/:id
const getProductDetails = asyncHandler(async function (req, res) {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');

  if (!product) {
    return res.status(404).render('pages/404', { pageTitle: 'Product Not Found' });
  }

  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  }).limit(3);

  res.render('pages/product-details', {
    pageTitle: product.name,
    pageCss: 'product-details',
    pageScript: 'product-details',
    product,
    relatedProducts,
  });
});

/* ============================================================
   ADMIN
   ============================================================ */

// GET /admin/products — render the management table
const listAdminProducts = asyncHandler(async function (req, res) {
  const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 });
  const categories = await Category.find().sort({ name: 1 });

  res.render('admin/products', {
    layout: 'layouts/admin',
    pageTitle: 'Products',
    pageStylesheet: 'products',
    pageScript: 'products',
    activeAdminPage: 'products',
    products,
    categories,
  });
});

// GET /admin/products/:id — JSON, used to prefill the edit modal
const getProduct = asyncHandler(async function (req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  res.json(product);
});

// POST /admin/products (multipart/form-data, fields "image" + "gallery")
const createProduct = asyncHandler(async function (req, res) {
  const { name, category, price, discountPrice, stock, description, fabric, sizes } = req.body;

  const mainImageFile = req.files && req.files.image && req.files.image[0];
  const galleryFiles = (req.files && req.files.gallery) || [];

  if (!mainImageFile) {
    return res.status(400).json({ message: 'A product image is required.' });
  }

  const product = await Product.create({
    name,
    category,
    price,
    discountPrice: discountPrice || undefined,
    stock,
    description,
    fabric,
    sizes: sizes ? [].concat(sizes) : [],
    image: mainImageFile.path,
    gallery: galleryFiles.map((file) => file.path),
  });

  res.status(201).json(product);
});

// PUT /admin/products/:id (multipart/form-data, fields "image" + "gallery" optional)
const updateProduct = asyncHandler(async function (req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const { name, category, price, discountPrice, stock, description, fabric, sizes, removeGalleryImages } = req.body;

  product.name = name ?? product.name;
  product.category = category ?? product.category;
  product.price = price ?? product.price;
  product.discountPrice = discountPrice || undefined;
  product.stock = stock ?? product.stock;
  product.description = description ?? product.description;
  product.fabric = fabric ?? product.fabric;
  if (sizes !== undefined) product.sizes = [].concat(sizes);

  // Existing gallery photos the admin clicked "remove" on — sent as a JSON
  // array of image URLs. Delete them from Cloudinary and drop them from
  // the array before anything new gets added.
  if (removeGalleryImages) {
    const urlsToRemove = JSON.parse(removeGalleryImages);
    urlsToRemove.forEach(deleteCloudinaryImage);
    product.gallery = (product.gallery || []).filter((url) => !urlsToRemove.includes(url));
  }

  const mainImageFile = req.files && req.files.image && req.files.image[0];
  const galleryFiles = (req.files && req.files.gallery) || [];

  if (mainImageFile) {
    const oldImage = product.image;
    product.image = mainImageFile.path;
    deleteCloudinaryImage(oldImage);
  }

  if (galleryFiles.length > 0) {
    product.gallery = [...(product.gallery || []), ...galleryFiles.map((file) => file.path)];
  }

  await product.save();
  res.json(product);
});

// DELETE /admin/products/:id
const deleteProduct = asyncHandler(async function (req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  deleteCloudinaryImage(product.image);
  (product.gallery || []).forEach(deleteCloudinaryImage);

  res.json({ message: 'Product deleted.' });
});

module.exports = {
  listShopProducts,
  getProductDetails,
  listAdminProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};