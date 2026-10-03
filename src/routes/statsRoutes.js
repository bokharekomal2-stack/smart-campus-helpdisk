const express = require('express');
const Complaint = require('../models/Complaint');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats
router.get('/', requireAuth, (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      const stats = Complaint.getStats(null);
      return res.json({
        success: true,
        data: stats
      });
    } else {
      const stats = Complaint.getStats(req.user.id);
      return res.json({
        success: true,
        data: {
          overview: stats.overview
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
