const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Public: Get active/public announcements (e.g., carousel, general)
router.get('/', async (req, res) => {
  try {
    const {
      type,
      status = 'active',
      limit = 10,
      sortBy = 'schedule.publishAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {
      visibility: 'public',
      status,
    };
    if (type) query.type = type;

    const announcements = await Announcement.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(Number(limit));

    res.json({ success: true, docs: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching announcements', error: error.message });
  }
});

module.exports = router; 