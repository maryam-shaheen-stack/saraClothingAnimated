const cookie = require('cookie');
const crypto = require('crypto');

/**
 * Why a separate cookie instead of reusing the express-session id?
 * authController.login() calls req.session.regenerate() on every login
 * (correct — prevents session-fixation attacks), which changes the
 * session id. If the cart were keyed on session id, every login would
 * silently orphan whatever was in the guest's cart. A dedicated,
 * long-lived cartId cookie survives login/logout, so "add to cart while
 * browsing, then log in at checkout" actually works like a real store.
 */

const CART_COOKIE_NAME = 'sara_cart_id';
const CART_COOKIE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function attachCartId(req, res, next) {
  const cookies = cookie.parse(req.headers.cookie || '');
  let cartId = cookies[CART_COOKIE_NAME];

  if (!cartId) {
    cartId = crypto.randomUUID();
    res.cookie(CART_COOKIE_NAME, cartId, {
      maxAge: CART_COOKIE_MAX_AGE_MS,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  req.cartId = cartId;
  next();
}

module.exports = { attachCartId, CART_COOKIE_NAME };
