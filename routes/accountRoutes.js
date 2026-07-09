const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { showDashboard, confirmReceived } = require('../controllers/accountController');

router.use(requireAuth);

router.get('/', function (req, res) { res.redirect('/account/dashboard'); });
router.get('/dashboard', showDashboard);

// Customer confirms order received
router.post('/orders/:id/confirm-received', confirmReceived);

module.exports = router;
