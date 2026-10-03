// Smart Campus Helpdesk - API Client

const API_BASE = '/api';

class ApiClient {
  static getToken() {
    return localStorage.getItem('auth_token');
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include'
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth Endpoints
  static auth = {
    login: async (email, password) => {
      const res = await ApiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.token) ApiClient.setToken(res.token);
      return res;
    },

    register: async (userData) => {
      const res = await ApiClient.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (res.token) ApiClient.setToken(res.token);
      return res;
    },

    logout: async () => {
      try {
        await ApiClient.request('/auth/logout', { method: 'POST' });
      } finally {
        ApiClient.setToken(null);
      }
    },

    me: async () => {
      return ApiClient.request('/auth/me');
    }
  };

  // Categories
  static categories = {
    list: async () => {
      return ApiClient.request('/categories');
    }
  };

  // Complaints
  static complaints = {
    list: async (filters = {}) => {
      const query = new URLSearchParams();
      if (filters.status) query.append('status', filters.status);
      if (filters.category_id) query.append('category_id', filters.category_id);
      if (filters.priority) query.append('priority', filters.priority);
      if (filters.search) query.append('search', filters.search);

      const qs = query.toString() ? `?${query.toString()}` : '';
      return ApiClient.request(`/complaints${qs}`);
    },

    getById: async (id) => {
      return ApiClient.request(`/complaints/${id}`);
    },

    create: async (complaintData) => {
      return ApiClient.request('/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintData)
      });
    },

    updateStatus: async (id, statusData) => {
      return ApiClient.request(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData)
      });
    }
  };

  // Stats
  static stats = {
    get: async () => {
      return ApiClient.request('/stats');
    }
  };
}

export default ApiClient;
