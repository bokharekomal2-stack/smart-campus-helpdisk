import {
  isGeminiConfigured,
  checkGeminiStatus,
  triageComplaint,
  draftResolution,
} from '../services/gemini.service.js';
import database from '../db/database.js';

/**
 * Check Google Gemini AI configuration & service status
 */
export const getAiStatus = async (req, res, next) => {
  try {
    const status = await checkGeminiStatus();
    return res.status(200).json({
      success: true,
      service: 'Google Gemini AI',
      ...status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Run Google Gemini AI triage on a student's problem description
 */
export const triageRequest = async (req, res, next) => {
  try {
    const { title, description, location } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required for AI analysis.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(200).json({
        success: true,
        configured: false,
        message:
          'Google Gemini API key is not configured in .env. To activate real-time AI triage and priority analysis, add GEMINI_API_KEY to your environment.',
        data: null,
      });
    }

    const triageResult = await triageComplaint({ title, description, location });
    return res.status(200).json({
      success: true,
      ...triageResult,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Run Google Gemini AI resolution drafting (Admins only)
 */
export const draftResolutionNote = async (req, res, next) => {
  try {
    const { requestId, adminActionNotes } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required.',
      });
    }

    const ticket = database.get(
      `SELECT r.*, u.name as student_name 
       FROM requests r 
       JOIN users u ON r.student_id = u.id 
       WHERE r.id = ?`,
      [requestId]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Request not found.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(200).json({
        success: true,
        configured: false,
        message:
          'Google Gemini API key is not configured. Add GEMINI_API_KEY to your .env file to enable AI resolution drafting.',
        data: null,
      });
    }

    const draft = await draftResolution({ ticket, adminActionNotes });
    return res.status(200).json({
      success: true,
      ...draft,
    });
  } catch (err) {
    next(err);
  }
};
