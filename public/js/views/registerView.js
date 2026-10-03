// Smart Campus Helpdesk - Register View
import ApiClient from '../api.js';
import { state } from '../state.js';
import { showToast } from '../components/toast.js';

export function renderRegisterView(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Create Account</h2>
          <p>Register as a student or campus staff member</p>
        </div>

        <form id="register-form">
          <div id="register-error" style="display: none; background: #fee2e2; color: #b91c1c; padding: 0.6rem 0.8rem; border-radius: var(--radius); font-size: 0.85rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label" for="reg-name">Full Name *</label>
            <input type="text" id="reg-name" class="form-control" placeholder="Jane Doe" required minlength="2" />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Campus Email *</label>
            <input type="email" id="reg-email" class="form-control" placeholder="jane@campus.edu" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Password (min 6 characters) *</label>
            <input type="password" id="reg-password" class="form-control" placeholder="••••••••" required minlength="6" />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-role">Account Type</label>
            <select id="reg-role" class="form-control">
              <option value="STUDENT" selected>Student</option>
              <option value="ADMIN">Campus Administrator</option>
            </select>
          </div>

          <div class="form-group" id="group-student-id">
            <label class="form-label" for="reg-student-id">Student ID / Roll No</label>
            <input type="text" id="reg-student-id" class="form-control" placeholder="e.g. STU-2026-888" />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-department">Department / Faculty</label>
            <input type="text" id="reg-department" class="form-control" placeholder="e.g. Mechanical Engineering" />
          </div>

          <button type="submit" id="reg-submit-btn" class="btn btn-primary btn-block">
            Create Account
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="#" id="link-to-login">Sign in</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#register-form');
  const errorBox = container.querySelector('#register-error');
  const submitBtn = container.querySelector('#reg-submit-btn');

  const nameInput = container.querySelector('#reg-name');
  const emailInput = container.querySelector('#reg-email');
  const passwordInput = container.querySelector('#reg-password');
  const roleSelect = container.querySelector('#reg-role');
  const studentIdInput = container.querySelector('#reg-student-id');
  const departmentInput = container.querySelector('#reg-department');

  const toLogin = container.querySelector('#link-to-login');
  if (toLogin) {
    toLogin.addEventListener('click', (e) => {
      e.preventDefault();
      state.setRoute('login');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    const userData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      role: roleSelect.value,
      studentId: studentIdInput.value.trim() || null,
      department: departmentInput.value.trim() || null
    };

    try {
      const res = await ApiClient.auth.register(userData);
      showToast('Account registered successfully!', 'success');
      state.setUser(res.user);
    } catch (err) {
      errorBox.textContent = err.message || 'Registration failed. Please check your inputs.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}
