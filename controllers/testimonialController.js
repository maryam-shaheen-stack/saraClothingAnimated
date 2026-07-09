const Testimonial = require('../models/Testimonial');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /admin/testimonials
const listAdminTestimonials = asyncHandler(async function (req, res) {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });

  res.render('admin/testimonials', {
    layout: 'layouts/admin',
    pageTitle: 'Testimonials',
    pageStylesheet: 'testimonials',
    pageScript: 'testimonials',
    activeAdminPage: 'testimonials',
    testimonials,
  });
});

// GET /admin/testimonials/:id — JSON, for the edit modal
const getTestimonial = asyncHandler(async function (req, res) {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ message: 'Testimonial not found.' });
  }
  res.json(testimonial);
});

// POST /admin/testimonials (application/json)
const createTestimonial = asyncHandler(async function (req, res) {
  const { name, location, rating, message, published } = req.body;

  const testimonial = await Testimonial.create({
    name,
    location,
    rating,
    message,
    published: Boolean(published),
  });

  res.status(201).json(testimonial);
});

// PUT /admin/testimonials/:id
const updateTestimonial = asyncHandler(async function (req, res) {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ message: 'Testimonial not found.' });
  }

  const { name, location, rating, message, published } = req.body;

  testimonial.name = name ?? testimonial.name;
  testimonial.location = location ?? testimonial.location;
  testimonial.rating = rating ?? testimonial.rating;
  testimonial.message = message ?? testimonial.message;
  testimonial.published = Boolean(published);

  await testimonial.save();
  res.json(testimonial);
});

// DELETE /admin/testimonials/:id
const deleteTestimonial = asyncHandler(async function (req, res) {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ message: 'Testimonial not found.' });
  }
  res.json({ message: 'Testimonial deleted.' });
});

module.exports = {
  listAdminTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
