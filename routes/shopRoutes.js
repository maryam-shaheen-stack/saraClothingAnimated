const express = require('express');
const router = express.Router();

const { listShopProducts, getProductDetails } = require('../controllers/productController');

// GET /shop  (supports ?category=slug1,slug2&minPrice=&maxPrice=&sort=&page=)
router.get('/', listShopProducts);

// GET /shop/:id
router.get('/:id', getProductDetails);

module.exports = router;
