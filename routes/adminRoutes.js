const express = require('express');
const router = express.Router();

const { requireStaff, requireRole } = require('../middleware/auth');
const { uploadProductImages, uploadCategoryImage, uploadHeroImage, uploadStoryImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');

const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const testimonialController = require('../controllers/testimonialController');
const messageController = require('../controllers/messageController');
const subscriberController = require('../controllers/subscriberController');
const siteContentController = require('../controllers/siteContentController');

/**
 * Everything in this router lives under /admin and requires a logged-in
 * account with role 'admin' or 'editor' (requireStaff). Login/register/
 * logout are all handled by authRoutes.js, mounted at '/' in server.js —
 * there is no separate /admin/login anymore, everyone signs in at /login
 * and gets routed here (or to /account) based on their role.
 */
router.use(requireStaff);

// GET /admin -> dashboard
router.get('/', function (req, res) {
  res.redirect('/admin/dashboard');
});

router.get('/dashboard', adminController.showDashboard);

/* ---------------- Products ---------------- */

router.get('/products', productController.listAdminProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', uploadProductImages, productController.createProduct);
router.put('/products/:id', uploadProductImages, productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

/* ---------------- Categories ---------------- */

router.get('/categories', categoryController.listAdminCategories);
router.get('/categories/:id', categoryController.getCategory);
router.post('/categories', uploadCategoryImage, categoryController.createCategory);
router.put('/categories/:id', uploadCategoryImage, categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

/* ---------------- Testimonials ---------------- */

router.get('/testimonials', testimonialController.listAdminTestimonials);
router.get('/testimonials/:id', testimonialController.getTestimonial);
router.post(
  '/testimonials',
  validate({
    name: { required: true, label: 'Name' },
    rating: { required: true, min: 1, max: 5, label: 'Rating' },
    message: { required: true, label: 'Testimonial message' },
  }),
  testimonialController.createTestimonial
);
router.put('/testimonials/:id', testimonialController.updateTestimonial);
router.delete('/testimonials/:id', testimonialController.deleteTestimonial);

/* ---------------- Announcements ---------------- */

router.get('/announcements', adminController.listAdminAnnouncements);
router.get('/announcements/:id', adminController.getAnnouncement);
router.post(
  '/announcements',
  validate({ message: { required: true, label: 'Message' } }),
  adminController.createAnnouncement
);
router.put('/announcements/:id', adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

/* ---------------- Messages (read-only inbox + delete) ---------------- */

router.get('/messages', messageController.listAdminMessages);
router.get('/messages/:id', messageController.getMessage);
router.delete('/messages/:id', messageController.deleteMessage);

/* ---------------- Subscribers (read-only list + delete) ---------------- */

router.get('/subscribers', subscriberController.listAdminSubscribers);
router.delete('/subscribers/:id', subscriberController.deleteSubscriber);

/* ---------------- Site Content (hero slides + story section) ---------------- */

router.get('/site-content', siteContentController.showSiteContent);
router.post('/site-content/hero-slides', uploadHeroImage, siteContentController.createHeroSlide);
router.put('/site-content/hero-slides/reorder', siteContentController.reorderHeroSlides);
router.put('/site-content/hero-slides/:slideId', uploadHeroImage, siteContentController.updateHeroSlide);
router.delete('/site-content/hero-slides/:slideId', siteContentController.deleteHeroSlide);
router.put('/site-content/story', uploadStoryImage, siteContentController.updateStory);

/* ---------------- Users (admin role only) ---------------- */

/* ---------------- Orders ---------------- */
router.get('/orders', adminController.listAdminOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

router.get('/users', requireRole('admin'), adminController.listAdminUsers);
router.get('/users/:id', requireRole('admin'), adminController.getUser);
router.post(
  '/users',
  requireRole('admin'),
  validate({
    name: { required: true, label: 'Name' },
    email: { required: true, email: true, label: 'Email' },
    role: { required: true, oneOf: ['admin', 'editor'], label: 'Role' },
    password: { required: true, minLength: 8, label: 'Password' },
  }),
  adminController.createUser
);
router.put('/users/:id', requireRole('admin'), adminController.updateUser);
router.delete('/users/:id', requireRole('admin'), adminController.deleteUser);

module.exports = router;