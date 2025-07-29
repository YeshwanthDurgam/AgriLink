const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const { param, body } = require('express-validator');
const { handleValidationErrors } = require('../validators/orderValidator'); // Reusing for product ID validation

// Get user's wishlist
router.get('/', auth, roleCheck('buyer'), wishlistController.getWishlist);

// Add product to wishlist
router.post('/',
  auth,
  roleCheck('buyer'),
  body('productId').isMongoId().withMessage('Invalid Product ID'),
  handleValidationErrors,
  wishlistController.addProductToWishlist
);

// Remove product from wishlist
router.delete('/:productId',
  auth,
  roleCheck('buyer'),
  param('productId').isMongoId().withMessage('Invalid Product ID'),
  handleValidationErrors,
  wishlistController.removeProductFromWishlist
);

module.exports = router; 