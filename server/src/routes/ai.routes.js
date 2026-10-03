import express from 'express';
import { getAiStatus, triageRequest, draftResolutionNote } from '../controllers/ai.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Service status
router.get('/status', getAiStatus);

// Smart triage for students submitting requests
router.post('/triage', triageRequest);

// Smart resolution drafting for admins
router.post('/draft', requireAdmin, draftResolutionNote);

export default router;
