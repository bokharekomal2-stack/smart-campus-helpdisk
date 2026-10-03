import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

let genAIInstance = null;

/**
 * Returns the Google Generative AI client if configured
 */
const getClient = () => {
  if (!config.geminiApiKey) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAIInstance;
};

/**
 * Helper to check if the Google Gemini service is configured
 */
export const isGeminiConfigured = () => {
  return Boolean(config.geminiApiKey && config.geminiApiKey.length > 5);
};

/**
 * Validates Google Gemini connectivity when an API key is provided
 */
export const checkGeminiStatus = async () => {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      status: 'unconfigured',
      message: 'Google Gemini API key not found. Add GEMINI_API_KEY in your .env file to enable intelligent triage.',
    };
  }

  try {
    const ai = getClient();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('ping');
    const response = await result.response;
    return {
      configured: true,
      status: 'active',
      model: 'gemini-1.5-flash',
      message: 'Google Gemini AI Service is connected and ready.',
    };
  } catch (err) {
    return {
      configured: true,
      status: 'error',
      message: `Google Gemini API connection error: ${err.message}`,
    };
  }
};

/**
 * Real Google Gemini AI Incident Triage:
 * Analyzes the student's problem description to automatically detect:
 * - Suggested category
 * - Recommended priority
 * - Immediate self-service advice or FAQ guidance
 * - Safety hazards
 */
export const triageComplaint = async ({ title, description, location }) => {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      message:
        'Google Gemini API is not configured. Please supply a valid GEMINI_API_KEY in the server .env file to activate AI triage.',
      data: null,
    };
  }

  const ai = getClient();
  const model = ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `You are the Campus Helpdesk AI Triage Specialist for a university.
Analyze the following student complaint/service request:
- Title: "${title}"
- Description: "${description}"
- Location: "${location || 'Not specified'}"

Categories available:
- IT Services
- Facilities & Maintenance
- Hostel & Housing
- Academic Services
- Transportation
- Library
- Cafeteria
- Safety & Security
- Other

Priorities available:
- Low (cosmetic, minor convenience)
- Medium (routine repair or service question)
- High (disrupts learning, studying, or dorm living for multiple students)
- Urgent (safety hazard, active water leak, electrical spark, security risk, fire hazard)

Respond with a strictly valid JSON object matching this schema:
{
  "category": "one of the available categories",
  "priority": "one of Low, Medium, High, Urgent",
  "urgency_rationale": "Brief 1-sentence reason for chosen priority",
  "is_safety_hazard": true or false,
  "self_help_guidance": "2-3 practical, immediate troubleshooting tips or steps the student can take right now while waiting for campus staff",
  "summary": "Clear, concise 1-sentence summary of the core incident"
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return {
      configured: true,
      status: 'success',
      data: parsed,
    };
  } catch (err) {
    console.error('Google Gemini API call failed:', err);
    throw new Error(`Google Gemini service request failed: ${err.message}`);
  }
};

/**
 * Real Google Gemini AI Resolution Drafter:
 * Assists campus administrators and maintenance staff in generating
 * professional, empathetic resolution updates for students.
 */
export const draftResolution = async ({ ticket, adminActionNotes }) => {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      message:
        'Google Gemini API is not configured. Please set GEMINI_API_KEY in your .env file to draft AI resolutions.',
      data: null,
    };
  }

  const ai = getClient();
  const model = ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,
    },
  });

  const prompt = `You are a helpful and polite University Campus Helpdesk Admin.
Draft a concise, courteous notification message to the student regarding their campus service ticket.

Ticket Details:
- Ticket Number: ${ticket.ticket_number}
- Student Name: ${ticket.student_name || 'Student'}
- Title: ${ticket.title}
- Location: ${ticket.location}
- Issue Category: ${ticket.category}
- Action taken by technician: ${adminActionNotes || 'Service completed.'}

Draft a clear, friendly 2-3 paragraph update thanking the student, confirming the resolution, stating what was repaired or addressed, and welcoming them to reply if any further issues persist.`;

  try {
    const result = await model.generateContent(prompt);
    const draftText = result.response.text();

    return {
      configured: true,
      status: 'success',
      data: {
        draft: draftText.trim(),
      },
    };
  } catch (err) {
    console.error('Google Gemini resolution draft failed:', err);
    throw new Error(`Google Gemini draft generation failed: ${err.message}`);
  }
};
