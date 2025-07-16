const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const Review = require('../models/Review');

// Create a new product
const createProduct = async (req, res) => {
  try {
    console.log('DEBUG createProduct - req.user:', req.user);
    console.log('DEBUG createProduct - req.body:', req.body);
    const {
      name,
      description,
      category,
      subcategory,
      price,
      basePrice,
      unit,
      minOrderQuantity,
      maxOrderQuantity,
      quantity,
      organic,
      certifications,
      qualityGrade,
      harvestDate,
      expiryDate,
      shelfLife,
      farmName,
      farmLocation,
      availableLocations,
      deliveryRadius,
      deliveryTime,
      isFeatured,
      isSeasonal,
      tags,
      searchKeywords,
      farmer: farmerFromBody // <-- allow farmer to be passed in body
    } = req.body;

    // Require basePrice or fallback to price
    let finalBasePrice = basePrice;
    if (finalBasePrice === undefined && price !== undefined) {
      finalBasePrice = price;
    }
    if (finalBasePrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'basePrice is required.'
      });
    }

    let farmer;
    let creatorId = req.user._id;
    let representativeId;
    // If admin, allow specifying farmer in body
    if (req.user.role === 'admin') {
      if (!farmerFromBody) {
        return res.status(400).json({
          success: false,
          message: 'Admin must specify a farmer for the product'
        });
      }
      farmer = await User.findById(farmerFromBody);
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(400).json({
          success: false,
          message: 'Specified farmer does not exist or is not a farmer'
        });
      }
      representativeId = farmer._id;
    } else if (req.user.role === 'farmer') {
      farmer = await User.findById(req.user.id);
      if (!farmer) {
        return res.status(400).json({
          success: false,
          message: 'Farmer not found'
        });
      }
      representativeId = farmer._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only farmers or admins can create products'
      });
    }

    // Create the product
    const product = new Product({
      name,
      description,
      category,
      subcategory,
      basePrice: finalBasePrice,
      price, // keep for backward compatibility if needed
      unit,
      minOrderQuantity: minOrderQuantity || 1,
      maxOrderQuantity,
      quantity,
      organic: organic || false,
      certifications: certifications || [],
      qualityGrade: qualityGrade || 'Standard',
      harvestDate,
      expiryDate,
      shelfLife,
      farmer: farmer._id,
      farmName: farmName || farmer.farmName,
      farmLocation: farmLocation || farmer.farmLocation,
      availableLocations: availableLocations || [farmer.location],
      deliveryRadius: deliveryRadius || 50,
      deliveryTime: deliveryTime || 24,
      isFeatured: isFeatured || false,
      isSeasonal: isSeasonal || false,
      tags: tags || [],
      searchKeywords: searchKeywords || [],
      status: req.user.role === 'admin' ? 'active' : 'pending_approval',
      approvalStatus: req.user.role === 'admin' ? { status: 'approved' } : { status: 'pending' },
      creator: creatorId,
      representative: representativeId
    });

    await product.save();

    // Populate farmer information
    await product.populate('farmer', 'name email phone location farmName');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Get all products with filtering and pagination
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status = 'active',
      organic,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      farmer
    } = req.query;

    // Build query
    const query = {};

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Organic filter
    if (organic !== undefined) {
      query.organic = organic === 'true';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Farmer filter
    if (farmer) {
      query.farmer = farmer;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(query)
      .populate('farmer', 'name location farmName rating')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Map _id to id for frontend compatibility
    const mappedProducts = products.map(product => ({
      ...product,
      id: product._id,
      images: (product.images || []).map(img => ({
        ...img,
        id: img._id
      })),
      farmer: product.farmer ? {
        ...product.farmer,
        id: product.farmer._id
      } : product.farmer
    }));

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      products: mappedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get a single product by ID
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('farmer', 'name email phone location farmName rating joinDate')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Map _id to id for frontend compatibility
    const mappedProduct = {
      ...product,
      id: product._id,
      price: product.price !== undefined ? product.price : product.basePrice,
      basePrice: product.basePrice,
      quantity: product.quantity ?? 0,
      harvestDate: product.harvestDate,
      images: (product.images || []).map(img => ({
        ...img,
        id: img._id
      })),
      farmer: product.farmer ? {
        ...product.farmer,
        id: product.farmer._id
      } : product.farmer,
      qualityMetrics: product.qualityMetrics || null
    };

    // Increment view count (need to do this separately since we're using lean())
    await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.json({
      success: true,
      product: mappedProduct
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.farmer.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('farmer', 'name email phone location farmName');

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.farmer.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }

    // Delete product images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', 'uploads', 'products', path.basename(image.url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Update product status (for admin approval)
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update product status'
      });
    }

    // Find and update the product
    const product = await Product.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('farmer', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product status updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status',
      error: error.message
    });
  }
};

// Upload product images
const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Allow if user is the farmer or an admin
    if (product.farmer.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can add images to your product only'
      });
    }

    // Process uploaded images
    const imageUrls = [];
    for (const file of files) {
      const imageUrl = `/uploads/products/${file.filename}`;
      imageUrls.push({
        url: imageUrl,
        alt: file.originalname,
        isPrimary: product.images.length === 0 // First image is primary
      });
    }

    // Add new images to product
    product.images.push(...imageUrls);
    await product.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images: imageUrls
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// Delete product image
const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Allow if user is the farmer or an admin
    if (product.farmer.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can delete images from your product only'
      });
    }

    // Find the image
    const image = product.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete image from filesystem
    const imagePath = path.join(__dirname, '..', 'uploads', 'products', path.basename(image.url));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove image from product
    product.images.pull(imageId);
    await product.save();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// Get farmer's products
const getFarmerProducts = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 12, status } = req.query;

    const query = { farmer: farmerId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('farmer', 'name location farmName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Map _id to id for frontend compatibility
    const mappedProducts = products.map(product => ({
      ...product,
      id: product._id,
      images: (product.images || []).map(img => ({
        ...img,
        id: img._id
      })),
      farmer: product.farmer ? {
        ...product.farmer,
        id: product.farmer._id
      } : product.farmer
    }));

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      products: mappedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching farmer products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching farmer products',
      error: error.message
    });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const products = await Product.find({
      status: 'active',
      isFeatured: true,
      quantity: { $gt: 0 }
    })
      .populate('farmer', 'name location farmName rating')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Map _id to id for frontend compatibility
    const mappedProducts = products.map(product => ({
      ...product,
      id: product._id,
      images: (product.images || []).map(img => ({
        ...img,
        id: img._id
      })),
      farmer: product.farmer ? {
        ...product.farmer,
        id: product.farmer._id
      } : product.farmer
    }));

    res.json({
      success: true,
      products: mappedProducts
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q, category, organic, minPrice, maxPrice, sortBy = 'relevance' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    const query = {
      status: 'active',
      quantity: { $gt: 0 },
      $text: { $search: q }
    };

    if (category) query.category = category;
    if (organic !== undefined) query.organic = organic === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1 };
        break;
      default:
        sort = { score: { $meta: 'textScore' } };
    }

    const products = await Product.find(query)
      .populate('farmer', 'name location farmName rating')
      .sort(sort)
      .limit(20)
      .lean();

    // Map _id to id for frontend compatibility
    const mappedProducts = products.map(product => ({
      ...product,
      id: product._id,
      images: (product.images || []).map(img => ({
        ...img,
        id: img._id
      })),
      farmer: product.farmer ? {
        ...product.farmer,
        id: product.farmer._id
      } : product.farmer
    }));

    res.json({
      success: true,
      products: mappedProducts,
      query: q
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ product: id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};

// Add a review to a product
const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Prevent duplicate reviews by the same user for the same product
    const existing = await Review.findOne({ product: id, user: userId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = new Review({
      product: id,
      user: userId,
      rating,
      comment,
      verified: true // You can add logic to verify purchase
    });
    await review.save();
    
    // Populate user info for response
    await review.populate('user', 'name avatar');
    
    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
};

// Upload review media (images/videos)
const uploadReviewMedia = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { mediaType } = req.body; // 'image' or 'video'
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload media for your own reviews'
      });
    }

    const uploadedMedia = [];

    for (const file of files) {
      const mediaUrl = `/uploads/reviews/${file.filename}`;
      
      if (mediaType === 'image') {
        review.images.push({
          url: mediaUrl,
          alt: file.originalname,
          uploadedAt: new Date()
        });
      } else if (mediaType === 'video') {
        review.videos.push({
          url: mediaUrl,
          title: file.originalname,
          uploadedAt: new Date()
        });
      }

      uploadedMedia.push({
        url: mediaUrl,
        filename: file.filename,
        originalName: file.originalname
      });
    }

    await review.save();
    await review.populate('user', 'name avatar');

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      review,
      uploadedMedia
    });
  } catch (error) {
    console.error('Error uploading review media:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading media',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductImages,
  deleteProductImage,
  getFarmerProducts,
  getFeaturedProducts,
  searchProducts,
  getProductReviews,
  addProductReview,
  uploadReviewMedia
}; 