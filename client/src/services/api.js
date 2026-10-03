/**
 * Centralized API Service for Smart Campus Helpdesk
 */

const API_BASE = '/api';

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('sch_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (res) => {
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = { success: false, error: 'Failed to parse server response.' };
  }

  if (!res.ok) {
    if (res.status === 401) {
      // Clear token if expired or invalid
      const currentToken = localStorage.getItem('sch_token');
      if (currentToken) {
        localStorage.removeItem('sch_token');
        localStorage.removeItem('sch_user');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    const errorMsg = data.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  // Authentication
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Requests
  async getRequests(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/requests${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRequestById(id) {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createRequest(formData) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  async updateStatus(id, updatePayload) {
    const res = await fetch(`${API_BASE}/requests/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatePayload),
    });
    return handleResponse(res);
  },

  async addNote(id, noteText, isInternal = false) {
    const res = await fetch(`${API_BASE}/requests/${id}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note: noteText, is_internal: isInternal }),
    });
    return handleResponse(res);
  },

  // Statistics
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Google Gemini AI Services
  async getAiStatus() {
    const res = await fetch(`${API_BASE}/ai/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async triageRequest(requestData) {
    const res = await fetch(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });
    return handleResponse(res);
  },

  async draftResolution(requestId, adminActionNotes) {
    const res = await fetch(`${API_BASE}/ai/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ requestId, adminActionNotes }),
    });
    return handleResponse(res);
  },
};

export default api;
