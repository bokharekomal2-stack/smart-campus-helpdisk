// Smart Campus Helpdesk - Complaint Detail & Status Update Modal
import ApiClient from '../api.js';
import { state } from '../state.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function openComplaintDetailModal(complaint, onStatusUpdatedCallback) {
  const isAdmin = state.user && state.user.role === 'ADMIN';

  const formattedDate = new Date(complaint.created_at).toLocaleString();
  const formattedResolved = complaint.resolved_at 
    ? new Date(complaint.resolved_at).toLocaleString() 
    : 'Not yet resolved';

  const bodyHtml = `
    <div class="detail-container">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <span class="ticket-code" style="font-size: 0.95rem;">${complaint.ticket_number}</span>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-top: 0.35rem;">${complaint.title}</h3>
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <span class="badge badge-${complaint.status.toLowerCase()}">${complaint.status.replace('_', ' ')}</span>
          <span class="priority-pill priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="detail-item-label">Category</div>
          <div class="detail-item-value">${complaint.category_name}</div>
        </div>
        <div>
          <div class="detail-item-label">Location / Room</div>
          <div class="detail-item-value">${complaint.location || 'Not specified'}</div>
        </div>
        <div>
          <div class="detail-item-label">Submitted By</div>
          <div class="detail-item-value">${complaint.student_name || 'Student'} (${complaint.student_email || 'N/A'})</div>
        </div>
        <div>
          <div class="detail-item-label">Student ID & Dept</div>
          <div class="detail-item-value">${complaint.student_campus_id || 'N/A'} - ${complaint.student_department || 'N/A'}</div>
        </div>
        <div>
          <div class="detail-item-label">Submitted Date</div>
          <div class="detail-item-value">${formattedDate}</div>
        </div>
        <div>
          <div class="detail-item-label">Resolved Date</div>
          <div class="detail-item-value">${formattedResolved}</div>
        </div>
      </div>

      <div class="detail-desc-box">
        <h4>Student Complaint Description</h4>
        <div class="detail-desc-text">${complaint.description}</div>
      </div>

      ${!isAdmin && complaint.admin_notes ? `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius); padding: 1rem; margin-top: 1rem;">
          <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #1e40af; font-weight: 700; margin-bottom: 0.25rem;">Staff & Admin Response</h4>
          <p style="font-size: 0.9rem; color: #1e3a8a;">${complaint.admin_notes}</p>
        </div>
      ` : ''}

      ${isAdmin ? `
        <div class="admin-update-section">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem; color: #1e293b;">
            🛠️ Admin Action: Update Ticket Status
          </h4>
          <div id="admin-modal-error" style="display: none; background: #fee2e2; color: #b91c1c; padding: 0.5rem; border-radius: var(--radius); font-size: 0.85rem; margin-bottom: 0.75rem;"></div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label class="form-label" for="admin-select-status">Change Status</label>
              <select id="admin-select-status" class="form-control">
                <option value="PENDING" ${complaint.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                <option value="IN_PROGRESS" ${complaint.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
                <option value="RESOLVED" ${complaint.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
                <option value="REJECTED" ${complaint.status === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="admin-notes-input">Admin Notes / Resolution Remarks</label>
              <textarea id="admin-notes-input" class="form-control" rows="3" placeholder="Add status updates, assigned technician details, or resolution info...">${complaint.admin_notes || ''}</textarea>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const footerHtml = `
    <button id="detail-close-btn" class="btn btn-secondary">Close</button>
    ${isAdmin ? `<button id="detail-save-btn" class="btn btn-primary">Save Changes</button>` : ''}
  `;

  const modalBackdrop = openModal({
    title: `Ticket Details: ${complaint.ticket_number}`,
    bodyHtml,
    footerHtml
  });

  const closeBtn = modalBackdrop.querySelector('#detail-close-btn');
  closeBtn.addEventListener('click', closeModal);

  if (isAdmin) {
    const saveBtn = modalBackdrop.querySelector('#detail-save-btn');
    const statusSelect = modalBackdrop.querySelector('#admin-select-status');
    const notesInput = modalBackdrop.querySelector('#admin-notes-input');
    const errorBox = modalBackdrop.querySelector('#admin-modal-error');

    saveBtn.addEventListener('click', async () => {
      errorBox.style.display = 'none';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const newStatus = statusSelect.value;
        const adminNotes = notesInput.value.trim();

        const res = await ApiClient.complaints.updateStatus(complaint.id, {
          status: newStatus,
          adminNotes: adminNotes || null
        });

        showToast(`Ticket #${complaint.ticket_number} updated to ${newStatus}`, 'success');
        closeModal();

        if (typeof onStatusUpdatedCallback === 'function') {
          onStatusUpdatedCallback(res.data);
        }
      } catch (err) {
        errorBox.textContent = err.message || 'Failed to update ticket status.';
        errorBox.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }
}
