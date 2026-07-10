const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { dashboardPathFor } = require('../middleware/auth');

/**
 * One login form for the whole site. There's no separate "admin login" —
 * database/seed.js creates the first admin, and existing admins can
 * promote a customer to admin/editor from /admin/users. Public
 * registration (POST /register) always creates role: 'customer' —
 * that's enforced here, never trusted from the request body.
 */

// GET /login
const showLoginPage = function (req, res) {
  // Same mechanism requireAuth already uses (session.returnTo) — this just
  // lets a plain link/redirect (e.g. "please log in to add to cart") set
  // it too, via ?returnTo=/some/page. Only accepts a same-site relative
  // path (must start with a single '/'), never a full URL, so this can't
  // be used to redirect someone off-site after login.
  const { returnTo } = req.query;
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    req.session.returnTo = returnTo;
  }

  res.render('pages/login', {
    pageTitle: 'Log In',
    pageCss: 'login',
    pageScript: 'login',
    layout: 'layouts/main',
  });
};

// POST /login
const login = asyncHandler(async function (req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter your email and password.' });
  }

  // password has `select: false` on the schema, so it must be explicitly requested
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // Regenerate the session on login to avoid session fixation, then
  // re-set the values that were lost when the old session was destroyed.
  const returnTo = req.session.returnTo;
  req.session.regenerate(function (err) {
    if (err) {
      return res.status(500).json({ message: 'Could not log you in. Please try again.' });
    }

    req.session.userId = user._id.toString();

    req.session.save(function (saveErr) {
      if (saveErr) {
        return res.status(500).json({ message: 'Could not log you in. Please try again.' });
      }
      // returnTo is only honored if it's safe (set by requireAuth/requireStaff
      // when bouncing an unauthenticated request) — otherwise send them to
      // the dashboard that matches their role.
      res.json({ redirectTo: returnTo || dashboardPathFor(user) });
    });
  });
});

// GET /register
const showRegisterPage = function (req, res) {
  res.render('pages/register', {
    pageTitle: 'Create Account',
    pageCss: 'login', // shares the same auth-card styling as the login page
    pageScript: 'register',
    layout: 'layouts/main',
  });
};

// POST /register — always creates a 'customer' account. Staff accounts
// (admin/editor) can only be created by an existing admin via /admin/users.
const register = asyncHandler(async function (req, res) {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists. Try logging in instead.' });
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: 'customer', // never taken from req.body — see comment above
  });

  // Auto-login immediately after registration, same session-regeneration
  // pattern as login() to avoid fixation.
  req.session.regenerate(function (err) {
    if (err) {
      return res.status(500).json({ message: 'Account created. Please log in.' });
    }

    req.session.userId = user._id.toString();

    req.session.save(function (saveErr) {
      if (saveErr) {
        return res.status(500).json({ message: 'Account created. Please log in.' });
      }
      res.status(201).json({ redirectTo: dashboardPathFor(user) });
    });
  });
});

// POST /logout — works for both customers and staff
const logout = function (req, res) {
  req.session.destroy(function () {
    res.clearCookie('sara.sid');
    res.redirect('/login');
  });
};

module.exports = { showLoginPage, login, showRegisterPage, register, logout };