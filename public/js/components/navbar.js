// Smart Campus Helpdesk - Navigation Bar Component
import { state } from '../state.js';
import ApiClient from '../api.js';
import { showToast } from './toast.js';

export function renderNavbar() {
  const container = document.getElementById('navbar-root');
  if (!container) return;

  const user = state.user;

  let actionsHtml = '';
  if (user) {
    const isStudent = user.role === 'STUDENT';
    actionsHtml = `
      <div class="nav-actions">
        ${isStudent ? `
          <button id="nav-btn-new-ticket" class="btn btn-primary btn-sm">
            <span>+</span> New Request
          </button>
        ` : ''}
        <div class="user-badge">
          <span>${user.name}</span>
          <span class="role-tag ${user.role.toLowerCase()}">${user.role}</span>
        </div>
        <button id="nav-btn-logout" class="btn btn-secondary btn-sm" title="Log out">
          Logout
        </button>
      </div>
    `;
  } else {
    actionsHtml = `
      <div class="nav-actions">
        <button id="nav-btn-login" class="btn btn-secondary btn-sm">Login</button>
        <button id="nav-btn-register" class="btn btn-primary btn-sm">Register</button>
      </div>
    `;
  }

  container.innerHTML = `
    <header class="navbar">
      <div class="nav-wrapper">
        <a href="#" id="nav-brand" class="brand">
          <div class="brand-icon">🏛️</div>
          <div>
            <div class="brand-title">Smart Campus Helpdesk</div>
            <span class="brand-subtitle">Facilities & Academic Support</span>
          </div>
        </a>
        ${actionsHtml}
      </div>
    </header>
  `;

  // Attach handlers
  const brand = container.querySelector('#nav-brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.user) {
        state.setRoute('dashboard');
      } else {
        state.setRoute('login');
      }
    });
  }

  const logoutBtn = container.querySelector('#nav-btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await ApiClient.auth.logout();
        showToast('Logged out successfully', 'info');
      } catch (err) {
        // Logout regardless of network response
      } finally {
        state.setUser(null);
      }
    });
  }

  const loginBtn = container.querySelector('#nav-btn-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => state.setRoute('login'));
  }

  const registerBtn = container.querySelector('#nav-btn-register');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => state.setRoute('register'));
  }

  const newTicketBtn = container.querySelector('#nav-btn-new-ticket');
  if (newTicketBtn) {
    newTicketBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-new-complaint-modal'));
    });
  }
}
