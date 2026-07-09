const SiteContent = require('../models/SiteContent');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteCloudinaryImage } = require('../middleware/upload');

/* ============================================================
   HERO SLIDES + STORY SECTION — admin-managed homepage content.
   SiteContent is a singleton (see models/SiteContent.js), so every
   function here starts by loading that one document.
   ============================================================ */

// GET /admin/site-content — page showing hero slides + story editor
const showSiteContent = asyncHandler(async function (req, res) {
  const content = await SiteContent.getSingleton();

  res.render('admin/site-content', {
    layout: 'layouts/admin',
    pageTitle: 'Homepage Content',
    pageStylesheet: 'site-content',
    pageScript: 'site-content',
    activeAdminPage: 'site-content',
    content,
  });
});

// POST /admin/site-content/hero-slides (multipart/form-data, field "image")
const createHeroSlide = asyncHandler(async function (req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'A slide image is required.' });
  }

  const { headline, subtext, buttonText, buttonLink } = req.body;
  const content = await SiteContent.getSingleton();

  content.heroSlides.push({
    image: req.file.path,
    headline: headline || '',
    subtext: subtext || '',
    buttonText: buttonText || '',
    buttonLink: buttonLink || '',
    order: content.heroSlides.length, // new slides go to the end
  });

  await content.save();
  res.status(201).json(content.heroSlides[content.heroSlides.length - 1]);
});

// PUT /admin/site-content/hero-slides/:slideId (multipart/form-data, image optional)
const updateHeroSlide = asyncHandler(async function (req, res) {
  const content = await SiteContent.getSingleton();
  const slide = content.heroSlides.id(req.params.slideId);

  if (!slide) {
    return res.status(404).json({ message: 'Hero slide not found.' });
  }

  const { headline, subtext, buttonText, buttonLink, order } = req.body;

  if (headline !== undefined) slide.headline = headline;
  if (subtext !== undefined) slide.subtext = subtext;
  if (buttonText !== undefined) slide.buttonText = buttonText;
  if (buttonLink !== undefined) slide.buttonLink = buttonLink;
  if (order !== undefined) slide.order = Number(order);

  if (req.file) {
    const oldImage = slide.image;
    slide.image = req.file.path;
    deleteCloudinaryImage(oldImage);
  }

  await content.save();
  res.json(slide);
});

// DELETE /admin/site-content/hero-slides/:slideId
const deleteHeroSlide = asyncHandler(async function (req, res) {
  const content = await SiteContent.getSingleton();
  const slide = content.heroSlides.id(req.params.slideId);

  if (!slide) {
    return res.status(404).json({ message: 'Hero slide not found.' });
  }

  deleteCloudinaryImage(slide.image);
  slide.deleteOne();
  await content.save();

  res.json({ message: 'Hero slide deleted.' });
});

// PUT /admin/site-content/hero-slides/reorder
// Body: { order: [slideId, slideId, ...] } in the desired display order —
// this is what the admin's drag-and-drop reorder UI (Step 3) will call.
const reorderHeroSlides = asyncHandler(async function (req, res) {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ message: '"order" must be an array of slide ids.' });
  }

  const content = await SiteContent.getSingleton();

  order.forEach(function (slideId, index) {
    const slide = content.heroSlides.id(slideId);
    if (slide) slide.order = index;
  });

  await content.save();
  res.json({ message: 'Hero slides reordered.' });
});

// PUT /admin/site-content/story (multipart/form-data, image optional)
const updateStory = asyncHandler(async function (req, res) {
  const content = await SiteContent.getSingleton();
  const { heading, text } = req.body;

  if (heading !== undefined) content.story.heading = heading;
  if (text !== undefined) content.story.text = text;

  if (req.file) {
    const oldImage = content.story.image;
    content.story.image = req.file.path;
    deleteCloudinaryImage(oldImage);
  }

  await content.save();
  res.json(content.story);
});

module.exports = {
  showSiteContent,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  updateStory,
};
