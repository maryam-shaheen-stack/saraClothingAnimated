require('dotenv').config();

const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/db');
const sessionMiddleware = require('./config/session');
const { attachCurrentUser } = require('./middleware/auth');
const { attachCartId } = require('./middleware/cart');
const { notFound, errorHandler, asyncHandler } = require('./middleware/errorHandler');
const Announcement = require('./models/Announcement');

const indexRoutes = require('./routes/index');
const shopRoutes = require('./routes/shopRoutes');
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel (and most hosting platforms) terminate HTTPS at their edge/proxy
// and forward requests to this app over plain HTTP internally, adding an
// `X-Forwarded-Proto: https` header. Without telling Express to trust
// that proxy, req.secure / req.protocol report the wrong thing, which
// can interfere with secure-cookie handling (session + cart cookies both
// use `secure: NODE_ENV === 'production'`). Safe to enable — no effect
// on local dev, since there's no proxy there.
app.set('trust proxy', 1);

connectDB().catch(function () {
  // Already logged inside connectDB(). Swallowed here only so an
  // unhandled rejection doesn't show up as an unrelated crash — the next
  // request will retry the connection via connectDB()'s own caching.
});

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ---- Static assets ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- Body parsing ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Sessions + current user (available in every view as `currentUser`) ----
app.use(sessionMiddleware);
app.use(attachCurrentUser);
app.use(attachCartId);

// ---- Active announcements banner (public pages only — the admin layout
// doesn't include announcement-bar.ejs, so this only matters there) ----
app.use(
  asyncHandler(async function (req, res, next) {
    if (!req.path.startsWith('/admin')) {
      res.locals.announcements = await Announcement.find({ active: true }).sort({ createdAt: -1 });
    }
    next();
  })
);

/* ============================================================
   ROUTES
   ============================================================ */

// One unified login/register for the whole site — /login, /register,
// /logout. Role-based redirect after login happens in authController.
app.use('/', authRoutes);

// Customer-only area — order history, profile (requireAuth inside the router)
app.use('/account', accountRoutes);

// Staff-only area — requireStaff inside adminRoutes now (not just requireAuth),
// so a logged-in customer hitting /admin/* gets a 403, not the login page.
app.use('/admin', adminRoutes);

app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/shop', shopRoutes);
app.use('/', contactRoutes); // /contact + /newsletter/subscribe
app.use('/', indexRoutes); // home, about, faq, privacy, terms

/* ============================================================
   404 + ERROR HANDLING (must be last)
   ============================================================ */

app.use(notFound);
app.use(errorHandler);

// Vercel's Node builder needs the Express app exported so it can wrap it
// as a serverless function. app.listen() below still runs locally (npm
// start/dev) — on Vercel this file is required, not executed as a normal
// long-running server, so only the export matters there.
module.exports = app;

app.listen(PORT, function () {
  console.log(`\n  Sara Clothing server running at http://localhost:${PORT}\n`);
});