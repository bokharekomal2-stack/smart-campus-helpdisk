// Smart Campus Helpdesk - Main Application Entry
import { state } from './state.js';
import ApiClient from './api.js';
import { renderNavbar } from './components/navbar.js';
import { renderLoginView } from './views/loginView.js';
import { renderRegisterView } from './views/registerView.js';
import { renderStudentDashboardView } from './views/studentDashboardView.js';
import { renderAdminDashboardView } from './views/adminDashboardView.js';

function renderCurrentView() {
  const mainRoot = document.getElementById('main-root');
  if (!mainRoot) return;

  renderNavbar();

  if (!state.user) {
    if (state.currentRoute === 'register') {
      renderRegisterView(mainRoot);
    } else {
      renderLoginView(mainRoot);
    }
    return;
  }

  // User is authenticated
  if (state.user.role === 'ADMIN') {
    renderAdminDashboardView(mainRoot);
  } else {
    renderStudentDashboardView(mainRoot);
  }
}

async function initApp() {
  // Subscribe view renderer to state changes
  state.subscribe(() => {
    renderCurrentView();
  });

  // 1. Fetch categories
  try {
    const catRes = await ApiClient.categories.list();
    if (catRes.success && catRes.data) {
      state.setCategories(catRes.data);
    }
  } catch (err) {
    console.warn('Could not load categories:', err);
  }

  // 2. Check for active session
  try {
    const sessionRes = await ApiClient.auth.me();
    if (sessionRes.success && sessionRes.user) {
      state.setUser(sessionRes.user);
      return;
    }
  } catch (err) {
    // Not logged in or expired token
  }

  // Default to login view if no session
  state.setUser(null);
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
