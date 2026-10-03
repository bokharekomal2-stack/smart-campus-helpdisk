const express = require('express');
const Category = require('../models/Category');

const router = express.Router();

// GET /api/categories
router.get('/', (req, res, next) => {
  try {
    const categories = Category.getAll();
    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
