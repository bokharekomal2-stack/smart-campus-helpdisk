// Smart Campus Helpdesk - New Complaint Modal
import ApiClient from '../api.js';
import { state } from '../state.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function openNewComplaintModal(onSuccessCallback) {
  const categoryOptions = state.categories.map(cat => 
    `<option value="${cat.id}">${cat.name}</option>`
  ).join('');

  const bodyHtml = `
    <form id="new-complaint-form">
      <div id="modal-error" style="display: none; background: #fee2e2; color: #b91c1c; padding: 0.6rem 0.8rem; border-radius: var(--radius); font-size: 0.85rem; margin-bottom: 1rem;"></div>

      <div class="form-group">
        <label class="form-label" for="comp-title">Issue Title *</label>
        <input type="text" id="comp-title" class="form-control" placeholder="Brief summary of the issue" required minlength="3" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div class="form-group">
          <label class="form-label" for="comp-category">Category *</label>
          <select id="comp-category" class="form-control" required>
            <option value="" disabled selected>Select category...</option>
            ${categoryOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="comp-priority">Priority Level *</label>
          <select id="comp-priority" class="form-control" required>
            <option value="LOW">Low (Minor issue)</option>
            <option value="MEDIUM" selected>Medium (Standard)</option>
            <option value="HIGH">High (Impacts work)</option>
            <option value="URGENT">Urgent (Safety/Hazard)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="comp-location">Location / Building / Room</label>
        <input type="text" id="comp-location" class="form-control" placeholder="e.g. Hostel Block B, Room 302" />
        <div class="form-hint">Providing an exact location helps staff resolve issues faster.</div>
      </div>

      <div class="form-group">
        <label class="form-label" for="comp-description">Detailed Description *</label>
        <textarea id="comp-description" class="form-control" rows="4" placeholder="Describe the problem, when it started, and any symptoms..." required minlength="10"></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button id="modal-cancel-btn" type="button" class="btn btn-secondary">Cancel</button>
    <button id="modal-submit-btn" type="button" class="btn btn-primary">Submit Request</button>
  `;

  const modalBackdrop = openModal({
    title: 'Submit Campus Complaint / Request',
    bodyHtml,
    footerHtml
  });

  const form = modalBackdrop.querySelector('#new-complaint-form');
  const errorBox = modalBackdrop.querySelector('#modal-error');
  const cancelBtn = modalBackdrop.querySelector('#modal-cancel-btn');
  const submitBtn = modalBackdrop.querySelector('#modal-submit-btn');

  cancelBtn.addEventListener('click', closeModal);

  submitBtn.addEventListener('click', async () => {
    const title = modalBackdrop.querySelector('#comp-title').value.trim();
    const categoryId = modalBackdrop.querySelector('#comp-category').value;
    const priority = modalBackdrop.querySelector('#comp-priority').value;
    const location = modalBackdrop.querySelector('#comp-location').value.trim();
    const description = modalBackdrop.querySelector('#comp-description').value.trim();

    errorBox.style.display = 'none';

    if (title.length < 3) {
      errorBox.textContent = 'Please enter a title with at least 3 characters.';
      errorBox.style.display = 'block';
      return;
    }

    if (!categoryId) {
      errorBox.textContent = 'Please select a relevant category.';
      errorBox.style.display = 'block';
      return;
    }

    if (description.length < 10) {
      errorBox.textContent = 'Please provide a detailed description (minimum 10 characters).';
      errorBox.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await ApiClient.complaints.create({
        title,
        categoryId,
        priority,
        location: location || null,
        description
      });

      showToast(`Request submitted! Ticket #${res.data.ticket_number}`, 'success');
      closeModal();
      if (typeof onSuccessCallback === 'function') {
        onSuccessCallback(res.data);
      }
    } catch (err) {
      errorBox.textContent = err.message || 'Failed to submit complaint.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
    }
  });
}
