const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products.product'); // Populate product details

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: 'Wishlist is empty',
        wishlist: { products: [] }
      });
    }

    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
};

// Add product to wishlist
const addProductToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Product ID'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      // Create a new wishlist if one doesn't exist for the user
      wishlist = new Wishlist({
        user: req.user.id,
        products: [{ product: productId }]
      });
    } else {
      // Add product if not already in wishlist
      const productExists = wishlist.products.some(
        (item) => item.product.toString() === productId
      );
      if (productExists) {
        return res.status(409).json({
          success: false,
          message: 'Product already in wishlist'
        });
      }
      wishlist.products.push({ product: productId });
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist
    });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product to wishlist',
      error: error.message
    });
  }
};

// Remove product from wishlist
const removeProductFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Product ID'
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found or empty'
      });
    }

    // Filter out the product to be removed
    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(
      (item) => item.product.toString() !== productId
    );

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist
    });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing product from wishlist',
      error: error.message
    });
  }
};

module.exports = {
  getWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
}; 