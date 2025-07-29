const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// GET /api/farmers - List all farmers with optional location/specialty/search/sort filtering
router.get('/', async (req, res) => {
  try {
    const { location, specialty, page = 1, limit = 20, search, sortBy = 'rating' } = req.query;
    const query = { role: 'farmer', accountStatus: 'active' };
    
    if (location) query['farmLocation'] = { $regex: location, $options: 'i' };
    if (specialty) query['specialties'] = { $regex: specialty, $options: 'i' }; // Changed from 'specialty' to 'specialties' to match schema
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { farmName: { $regex: search, $options: 'i' } },
        { farmLocation: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } } // Allow searching by specialties
      ];
    }

    const sortOptions = {};
    switch (sortBy) {
      case 'rating': sortOptions.averageRating = -1; break;
      case 'products': 
        // Sorting by product count needs to be done after fetching products
        // For now, we'll sort by rating as a fallback, or handle in frontend.
        // A proper backend solution would involve aggregation.
        sortOptions.averageRating = -1; // Fallback to rating for now
        break;
      case 'name': sortOptions.name = 1; break; // Example: sort alphabetically
      case 'newest': sortOptions.createdAt = -1; break; // Example: sort by newest farmers
      default: sortOptions.averageRating = -1; // Default sort by rating
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let farmers = await User.find(query)
      .select('name farmName farmLocation location avatar rating averageRating specialties')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Attach products for each farmer and do frontend sort by products if requested
    const farmerIds = farmers.map(f => f._id);
    const products = await Product.find({ farmer: { $in: farmerIds }, status: 'active' })
      .select('name category price quantity images farmer') // Include farmer to map back
      .lean();

    const productsByFarmer = {};
    products.forEach(p => {
      const fid = p.farmer.toString();
      if (!productsByFarmer[fid]) productsByFarmer[fid] = [];
      productsByFarmer[fid].push(p);
    });

    // Manually attach products and handle 'products' sort if it wasn't handled by MongoDB directly
    farmers = farmers.map(farmer => ({
      ...farmer,
      products: productsByFarmer[farmer._id.toString()] || []
    }));

    if (sortBy === 'products') {
      farmers.sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0));
    }

    res.json({ success: true, farmers: farmers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching farmers', error: error.message });
  }
});

module.exports = router; 