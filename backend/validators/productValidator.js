const { body, param, query, validationResult } = require('express-validator');

// Validation rules for creating a product
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Seeds', 'Dairy', 'Other'])
    .withMessage('Invalid category'),
  
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be less than 50 characters'),
  
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('basePrice must be a positive number'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body().custom(body => {
    if (body.basePrice === undefined && body.price === undefined) {
      throw new Error('Either basePrice or price is required');
    }
    return true;
  }),
  
  body('unit')
    .isIn(['kg', 'gram', 'piece', 'dozen', 'box', 'bunch', 'liter', 'pack'])
    .withMessage('Invalid unit'),
  
  body('minOrderQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order quantity must be a positive number'),
  
  body('maxOrderQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum order quantity must be a positive number'),
  
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),
  
  body('organic')
    .optional()
    .isBoolean()
    .withMessage('Organic must be a boolean value'),
  
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  
  body('certifications.*')
    .optional()
    .isIn(['Organic', 'GAP', 'HACCP', 'ISO', 'FSSAI', 'Other'])
    .withMessage('Invalid certification type'),
  
  body('qualityGrade')
    .optional()
    .isIn(['Premium', 'Grade A', 'Grade B', 'Standard'])
    .withMessage('Invalid quality grade'),
  
  body('harvestDate')
    .isISO8601()
    .withMessage('Harvest date must be a valid date'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  
  body('shelfLife')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Shelf life must be a positive integer'),
  
  body('farmName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Farm name must be less than 100 characters'),
  
  body('farmLocation')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Farm location must be less than 200 characters'),
  
  body('availableLocations')
    .optional()
    .isArray()
    .withMessage('Available locations must be an array'),
  
  body('availableLocations.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  
  body('deliveryRadius')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Delivery radius must be a positive number'),
  
  body('deliveryTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Delivery time must be a positive number'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Is featured must be a boolean value'),
  
  body('isSeasonal')
    .optional()
    .isBoolean()
    .withMessage('Is seasonal must be a boolean value'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag must be between 1 and 50 characters'),
  
  body('searchKeywords')
    .optional()
    .isArray()
    .withMessage('Search keywords must be an array'),
  
  body('searchKeywords.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search keyword must be between 1 and 50 characters')
];

// Validation rules for updating a product
const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Seeds', 'Dairy', 'Other'])
    .withMessage('Invalid category'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'out_of_stock', 'pending_approval', 'rejected'])
    .withMessage('Invalid status'),
  
  body('organic')
    .optional()
    .isBoolean()
    .withMessage('Organic must be a boolean value'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Is featured must be a boolean value')
];

// Validation rules for product queries
const getProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn(['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Seeds', 'Dairy', 'Other'])
    .withMessage('Invalid category'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'out_of_stock', 'pending_approval', 'rejected', 'all'])
    .withMessage('Invalid status'),
  
  query('organic')
    .optional()
    .isBoolean()
    .withMessage('Organic must be a boolean value'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('sortBy')
    .optional()
    .isIn(['price', 'name', 'createdAt', 'harvestDate', 'rating', 'popularity'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

// Validation rules for getting a single product
const getProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
];

// Validation rules for deleting a product
const deleteProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
];

// Validation rules for updating product status
const updateProductStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('status')
    .isIn(['active', 'inactive', 'out_of_stock', 'pending_approval', 'rejected'])
    .withMessage('Invalid status'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

// Validation rules for uploading product images
const uploadProductImagesValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Debug log for validation errors
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

module.exports = {
  createProductValidation,
  updateProductValidation,
  getProductsValidation,
  getProductValidation,
  deleteProductValidation,
  updateProductStatusValidation,
  uploadProductImagesValidation,
  handleValidationErrors
}; 