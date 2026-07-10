const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { requireAuth } = require('../middleware/auth');

// Same requirement as /cart: checkout must not be reachable while logged
// out. Without this, someone who logged in, added items, then logged out
// could still hit /checkout directly and place an order — the cart cookie
// (sara_cart_id) is deliberately long-lived and separate from the login
// session, so it survives logout too.
router.use(requireAuth);

router.get('/', checkoutController.showCheckout);
router.post('/', checkoutController.placeOrder);

module.exports = router;
