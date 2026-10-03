const express = require('express');
const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

// GET /api/complaints
router.get('/', requireAuth, (req, res, next) => {
  try {
    const { status, category_id, priority, search } = req.query;

    if (req.user.role === 'ADMIN') {
      const complaints = Complaint.listAll({
        status,
        categoryId: category_id,
        priority,
        search
      });
      return res.json({
        success: true,
        count: complaints.length,
        data: complaints
      });
    } else {
      const complaints = Complaint.listByStudent(req.user.id, {
        status,
        search
      });
      return res.json({
        success: true,
        count: complaints.length,
        data: complaints
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/:id
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const complaint = Complaint.findById(Number(req.params.id));
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    // Role check: Only the student who submitted it or an admin can view it
    if (req.user.role !== 'ADMIN' && complaint.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own complaints.'
      });
    }

    return res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { title, description, categoryId, priority = 'MEDIUM', location } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A title of at least 3 characters is required.'
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A detailed description of at least 10 characters is required.'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.'
      });
    }

    const category = Category.findById(Number(categoryId));
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category specified.'
      });
    }

    const cleanPriority = String(priority).toUpperCase();
    if (!VALID_PRIORITIES.includes(cleanPriority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`
      });
    }

    const complaint = Complaint.create({
      title,
      description,
      categoryId: Number(categoryId),
      studentId: req.user.id,
      priority: cleanPriority,
      location: location ? String(location).trim() : null
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/complaints/:id/status
router.patch('/:id/status', requireAdmin, (req, res, next) => {
  try {
    const complaintId = Number(req.params.id);
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required.'
      });
    }

    const cleanStatus = String(status).toUpperCase();
    if (!VALID_STATUSES.includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const existing = Complaint.findById(complaintId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const updated = Complaint.updateStatus(complaintId, {
      status: cleanStatus,
      adminNotes: adminNotes !== undefined ? String(adminNotes).trim() : undefined
    });

    return res.json({
      success: true,
      message: `Complaint status updated to ${cleanStatus}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
