const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Category = require('../models/Category');
const Testimonial = require('../models/Testimonial');
const SiteContent = require('../models/SiteContent');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Public pages that don't belong to a single-purpose controller (shop/
 * contact/auth already have their own route files). Home pulls live data
 * from three models; about now also pulls the story image/text from
 * SiteContent (same source as home's story section); faq/privacy/terms
 * remain fully static per their views (checked — no dynamic fields
 * beyond the pageTitle/lastUpdated defaults already built into those
 * .ejs files).
 *
 * NOTE — Instagram feed: home.ejs renders an `instagramPosts` grid, but
 * there's no Instagram model/API integration wired up yet (would need
 * either the Instagram Graph API + a token in .env, or a small manually-
 * curated model like Announcement). Passing an empty array for now so
 * the section just doesn't render (home.ejs already guards on
 * `instagramPosts.length > 0`) instead of breaking the page.
 */

// GET /
router.get(
  '/',
  asyncHandler(async function (req, res) {
    const [featuredProducts, latestProducts, categories, testimonials, siteContent] = await Promise.all([
      Product.find().populate('category', 'name slug').sort({ createdAt: -1 }).limit(3),
      Product.find().populate('category', 'name slug').sort({ createdAt: -1 }).skip(3).limit(3),
      Category.find().sort({ name: 1 }),
      Testimonial.find({ published: true }).sort({ createdAt: -1 }).limit(6),
      SiteContent.getSingleton(),
    ]);

    // Hero carousel needs at least one slide to render. If the admin
    // hasn't added any yet (fresh install, or all deleted), fall back to
    // one default slide instead of showing an empty hero section.
    const heroSlides =
      siteContent.heroSlides.length > 0
        ? [...siteContent.heroSlides].sort((a, b) => a.order - b.order)
        : [
            {
              image: '/images/hero/hero-main.jpg',
              headline: 'Elegance, Tailored for the Modern Woman',
              subtext: "Discover Sara Clothing's latest collection — crafted with intention, worn with confidence.",
              buttonText: 'Shop the Collection',
              buttonLink: '/shop',
            },
          ];

    res.render('pages/home', {
      pageTitle: 'Home',
      pageCss: 'home',
      pageScript: 'home',
      featuredProducts,
      latestProducts,
      categories,
      testimonials,
      heroSlides,
      story: siteContent.story,
      instagramPosts: [], // see note above
    });
  })
);

// GET /about
router.get(
  '/about',
  asyncHandler(async function (req, res) {
    const siteContent = await SiteContent.getSingleton();
    res.render('pages/about', {
      pageTitle: 'Our Story',
      pageCss: 'about',
      story: siteContent.story,
    });
  })
);

// GET /faq
router.get('/faq', function (req, res) {
  res.render('pages/faq', { pageTitle: 'FAQ', pageCss: 'faq' });
});

// GET /privacy
router.get('/privacy', function (req, res) {
  res.render('pages/privacy', { pageTitle: 'Privacy Policy', pageCss: 'privacy', lastUpdated: 'July 2026' });
});

// GET /terms
router.get('/terms', function (req, res) {
  res.render('pages/terms', { pageTitle: 'Terms & Conditions', pageCss: 'terms', lastUpdated: 'July 2026' });
});

module.exports = router;