/**
 * Central error handling. Two exports:
 *
 *  - asyncHandler: wraps async controller functions so a thrown/rejected
 *    error is forwarded to next(err) instead of crashing the process.
 *    Every controller in this project uses this instead of try/catch
 *    boilerplate in every single function.
 *
 *  - notFound + errorHandler: mounted at the bottom of server.js. notFound
 *    catches any request that didn't match a route; errorHandler is the
 *    Express 4-arg error middleware that formats the final response.
 *
 * Response shape depends on the request: admin/API calls that expect JSON
 * (fetch calls from the admin panel, contact form, newsletter) get JSON
 * back; normal page navigations get a rendered error page instead of a
 * raw stack trace, satisfying the "no broken states / no raw errors"
 * requirement from the design brief.
 */

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFound(req, res, next) {
  res.status(404);

  if (req.accepts('html')) {
    return res.render('pages/404', { pageTitle: 'Page Not Found' });
  }

  res.json({ message: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Something went wrong. Please try again.';

  // Mongoose validation errors -> readable single message + 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
  }

  // Mongoose bad ObjectId (e.g. /admin/products/not-a-real-id) -> 400, not 500
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID.';
  }

  // Duplicate key (unique index) -> 409
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `That ${field} is already in use.` : 'Duplicate value.';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  if (req.accepts('html') && !req.originalUrl.startsWith('/admin') && statusCode >= 500) {
    return res.status(statusCode).render('pages/500', { pageTitle: 'Something Went Wrong' });
  }

  res.status(statusCode).json({ message });
}

module.exports = { asyncHandler, notFound, errorHandler };
