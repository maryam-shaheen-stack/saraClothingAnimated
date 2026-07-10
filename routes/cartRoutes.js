const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');

// Cart is account-bound now: any visitor must log in before viewing or
// changing it.
//
// - GET / is a real page visit, so it uses the normal requireAuth guard:
//   redirects an unauthenticated browser straight to /login and remembers
//   /cart as `returnTo`, so after logging in they land back on their cart.
// - The rest (/count, /items) are only ever called via fetch() from the
//   page's own JS (cart badge sync, add/update/remove-from-cart). Those
//   need a plain 401 JSON response instead of an HTML redirect — fetch()
//   would otherwise silently follow the redirect to the login page and
//   then fail trying to parse that HTML as JSON.
function requireAuthJson(req, res, next) {
  if (req.session && req.session.userId && req.currentUser) {
    return next();
  }
  return res.status(401).json({ message: 'Please log in to continue.', loginUrl: '/login' });
}

router.get('/', requireAuth, cartController.showCart);
router.get('/count', requireAuthJson, cartController.getCartCount);
router.post('/items', requireAuthJson, cartController.addItem);
router.put('/items/:itemId', requireAuthJson, cartController.updateItem);
router.delete('/items/:itemId', requireAuthJson, cartController.removeItem);

module.exports = router;
