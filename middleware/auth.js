const User = require('../models/User');
const { asyncHandler } = require('./errorHandler');

/**
 * Session-based auth for the WHOLE site — one login, two kinds of accounts.
 *
 * attachCurrentUser: runs on every request so `currentUser` is available
 * in every EJS view (navbar shows Login vs My Account vs Admin) without
 * every single controller having to look it up and pass it manually.
 *
 * requireAuth: any logged-in account (customer OR staff). Used for
 * /account/* (order history, addresses, profile).
 *
 * requireStaff: logged-in AND role is 'admin' or 'editor'. Used for all
 * of /admin/*. A logged-in customer hitting /admin/* gets a 403, not the
 * login page (they ARE authenticated, they're just not allowed here).
 *
 * requireRole: extra check on top of requireStaff for admin-only actions
 * (e.g. managing other Users, promoting a customer to admin).
 */

const attachCurrentUser = asyncHandler(async function (req, res, next) {
  if (req.session && req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      req.currentUser = user;
      res.locals.currentUser = user;
    }
  }
  next();
});

// Where a successful login should send someone, based on their role.
function dashboardPathFor(user) {
  return user.isStaff() ? '/admin/dashboard' : '/account/dashboard';
}

function requireAuth(req, res, next) {
  if (req.session && req.session.userId && req.currentUser) {
    return next();
  }

  if (req.accepts('html') && !req.xhr) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  return res.status(401).json({ message: 'Please log in to continue.' });
}

function requireStaff(req, res, next) {
  if (!req.currentUser) {
    if (req.accepts('html') && !req.xhr) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/login');
    }
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  if (!req.currentUser.isStaff()) {
    if (req.accepts('html') && !req.xhr) {
      return res.status(403).render('pages/403', {
        layout: 'layouts/admin',
        pageTitle: 'Access Denied',
      });
    }
    return res.status(403).json({ message: 'You do not have permission to do that.' });
  }

  return next();
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.currentUser) {
      return res.status(401).json({ message: 'Please log in to continue.' });
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      if (req.accepts('html') && !req.xhr) {
        return res.status(403).render('pages/403', {
          layout: 'layouts/admin',
          pageTitle: 'Access Denied',
        });
      }
      return res.status(403).json({ message: 'You do not have permission to do that.' });
    }

    next();
  };
}

// Used only on /login and /register — bounces an already-logged-in user
// straight to their dashboard instead of showing them the form again.
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId && req.currentUser) {
    return res.redirect(dashboardPathFor(req.currentUser));
  }
  next();
}

module.exports = {
  attachCurrentUser,
  requireAuth,
  requireStaff,
  requireRole,
  redirectIfAuthenticated,
  dashboardPathFor,
};