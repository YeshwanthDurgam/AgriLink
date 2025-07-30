const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import controllers and middleware
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const {
  createProductValidation,
  updateProductValidation,
  getProductsValidation,
  getProductValidation,
  deleteProductValidation,
  updateProductStatusValidation,
  uploadProductImagesValidation,
  handleValidationErrors
} = require('../validators/productValidator');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Create uploads directory for reviews if it doesn't exist
const reviewUploadsDir = path.join(__dirname, '..', 'uploads', 'reviews');
if (!fs.existsSync(reviewUploadsDir)) {
  fs.mkdirSync(reviewUploadsDir, { recursive: true });
}

// Configure multer for review media uploads
const reviewStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, reviewUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'review-' + uniqueSuffix + ext);
  }
});

const reviewFileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const reviewUpload = multer({
  storage: reviewStorage,
  fileFilter: reviewFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 5 // Maximum 5 files
  }
});

// Public routes (no authentication required)
router.get('/', getProductsValidation, handleValidationErrors, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/farmer/:farmerId', productController.getFarmerProducts);
router.get('/:id', getProductValidation, handleValidationErrors, productController.getProduct);

// Public review route
router.get('/:id/reviews', productController.getProductReviews);
// Authenticated review route
router.post('/:id/reviews', auth, productController.addProductReview);
// Upload review media
router.post('/reviews/:reviewId/media', 
  auth, 
  reviewUpload.array('media', 5), // Maximum 5 files
  productController.uploadReviewMedia
);

// Protected routes (authentication required)
router.use(auth);

// Farmer routes (only farmers can access)
router.post('/', 
  roleCheck('farmer', 'admin'),
  createProductValidation, 
  handleValidationErrors, 
  productController.createProduct
);

router.put('/:id', 
  roleCheck('farmer', 'admin'),
  updateProductValidation, 
  handleValidationErrors, 
  productController.updateProduct
);

router.delete('/:id', 
  roleCheck('farmer', 'admin'),
  deleteProductValidation, 
  handleValidationErrors, 
  productController.deleteProduct
);

router.post('/:id/images', 
  roleCheck('farmer', 'admin'),
  uploadProductImagesValidation, 
  handleValidationErrors,
  upload.array('images', 5), // Maximum 5 images
  productController.uploadProductImages
);

router.delete('/:id/images/:imageId', 
  roleCheck('farmer', 'admin'),
  productController.deleteProductImage
);

router.put('/:id/images', 
  roleCheck('farmer', 'admin'),
  productController.updateProductImageUrls
);

// Admin routes (only admins can access)
router.patch('/:id/status', 
  roleCheck('admin', 'super_admin'),
  updateProductStatusValidation, 
  handleValidationErrors, 
  productController.updateProductStatus
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
});

module.exports = router; 