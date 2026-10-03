// Smart Campus Helpdesk - Login View
import ApiClient from '../api.js';
import { state } from '../state.js';
import { showToast } from '../components/toast.js';

export function renderLoginView(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access the Smart Campus Helpdesk</p>
        </div>

        <form id="login-form">
          <div id="login-error" style="display: none; background: #fee2e2; color: #b91c1c; padding: 0.6rem 0.8rem; border-radius: var(--radius); font-size: 0.85rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label" for="login-email">Campus Email</label>
            <input type="email" id="login-email" class="form-control" placeholder="name@campus.edu" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password" />
          </div>

          <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block">
            Sign In
          </button>
        </form>

        <div class="demo-box">
          <div class="demo-box-title">⚡ Quick Demo Logins</div>
          <div class="demo-buttons">
            <button id="btn-demo-student" class="btn btn-secondary btn-sm" style="flex: 1;">
              Student Demo
            </button>
            <button id="btn-demo-admin" class="btn btn-secondary btn-sm" style="flex: 1;">
              Admin Demo
            </button>
          </div>
        </div>

        <div class="auth-footer">
          Don't have an account? <a href="#" id="link-to-register">Register here</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorBox = container.querySelector('#login-error');
  const emailInput = container.querySelector('#login-email');
  const passwordInput = container.querySelector('#login-password');
  const submitBtn = container.querySelector('#login-submit-btn');

  const toRegister = container.querySelector('#link-to-register');
  if (toRegister) {
    toRegister.addEventListener('click', (e) => {
      e.preventDefault();
      state.setRoute('register');
    });
  }

  // Quick demo buttons
  const demoStudentBtn = container.querySelector('#btn-demo-student');
  if (demoStudentBtn) {
    demoStudentBtn.addEventListener('click', () => {
      emailInput.value = 'student@campus.edu';
      passwordInput.value = 'student123';
      form.requestSubmit();
    });
  }

  const demoAdminBtn = container.querySelector('#btn-demo-admin');
  if (demoAdminBtn) {
    demoAdminBtn.addEventListener('click', () => {
      emailInput.value = 'admin@campus.edu';
      passwordInput.value = 'admin123';
      form.requestSubmit();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const res = await ApiClient.auth.login(emailInput.value, passwordInput.value);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      state.setUser(res.user);
    } catch (err) {
      errorBox.textContent = err.message || 'Login failed. Please check your credentials.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}
