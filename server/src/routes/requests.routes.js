import express from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  addNote,
} from '../controllers/requests.controller.js';
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = express.Router();

// All request routes require authentication
router.use(authenticate);

// Student submit complaint/request with optional file/image upload
router.post('/', requireStudent, uploadAttachment.single('attachment'), createRequest);

// List requests (Student views own, Admin views all, supports search/filter)
router.get('/', getRequests);

// Get single request details
router.get('/:id', getRequestById);

// Admin update request status & priority
router.patch('/:id/status', requireAdmin, updateRequestStatus);

// Add comment/note to request (Student or Admin)
router.post('/:id/notes', addNote);

export default router;
