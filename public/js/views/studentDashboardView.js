// Smart Campus Helpdesk - Student Dashboard View
import ApiClient from '../api.js';
import { state } from '../state.js';
import { openNewComplaintModal } from './newComplaintModal.js';
import { openComplaintDetailModal } from './complaintDetailModal.js';

export function renderStudentDashboardView(container) {
  const user = state.user;

  container.innerHTML = `
    <div>
      <div class="dashboard-header">
        <div class="header-text">
          <h1>Student Helpdesk Portal</h1>
          <p>Welcome, <strong>${user.name}</strong> (${user.student_id || 'ID Pending'} - ${user.department || 'General'})</p>
        </div>
        <div>
          <button id="btn-submit-new-complaint" class="btn btn-primary">
            <span>+</span> Submit New Request
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Total Requests</span>
            <span id="stat-total" class="stat-value">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #f1f5f9; color: #475569;">📋</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Pending</span>
            <span id="stat-pending" class="stat-value" style="color: #b45309;">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #fef3c7; color: #b45309;">⏳</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">In Progress</span>
            <span id="stat-progress" class="stat-value" style="color: #1d4ed8;">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #dbeafe; color: #1d4ed8;">⚙️</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Resolved</span>
            <span id="stat-resolved" class="stat-value" style="color: #15803d;">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #dcfce7; color: #15803d;">✅</div>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="search-input-wrap">
          <input type="text" id="filter-search" class="form-control" placeholder="Search by ticket # or keyword..." />
        </div>
        <div style="min-width: 170px;">
          <select id="filter-status" class="form-control">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button id="btn-refresh-list" class="btn btn-secondary" title="Refresh list">
          ↻ Refresh
        </button>
      </div>

      <!-- Complaint List Table -->
      <div id="complaints-container" class="table-container">
        <div style="text-align: center; padding: 2rem; color: #64748b;">Loading your requests...</div>
      </div>
    </div>
  `;

  const btnSubmit = container.querySelector('#btn-submit-new-complaint');
  const searchInput = container.querySelector('#filter-search');
  const statusSelect = container.querySelector('#filter-status');
  const btnRefresh = container.querySelector('#btn-refresh-list');
  const complaintsContainer = container.querySelector('#complaints-container');

  const statTotal = container.querySelector('#stat-total');
  const statPending = container.querySelector('#stat-pending');
  const statProgress = container.querySelector('#stat-progress');
  const statResolved = container.querySelector('#stat-resolved');

  // Load and render data
  async function loadData() {
    try {
      // 1. Fetch Stats
      const statsRes = await ApiClient.stats.get();
      if (statsRes.success && statsRes.data.overview) {
        const o = statsRes.data.overview;
        statTotal.textContent = o.total;
        statPending.textContent = o.pending;
        statProgress.textContent = o.in_progress;
        statResolved.textContent = o.resolved;
      }

      // 2. Fetch Complaints
      const complaintsRes = await ApiClient.complaints.list({
        status: statusSelect.value,
        search: searchInput.value
      });

      renderComplaints(complaintsRes.data);
    } catch (err) {
      complaintsContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #dc2626;">
          Failed to load complaints: ${err.message}
        </div>
      `;
    }
  }

  function renderComplaints(complaints) {
    if (!complaints || complaints.length === 0) {
      complaintsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <h3>No complaints found</h3>
          <p>You haven't submitted any complaints matching this filter.</p>
          <button id="btn-empty-submit" class="btn btn-primary" style="margin-top: 1rem;">
            Submit a Request
          </button>
        </div>
      `;

      const emptySubmit = complaintsContainer.querySelector('#btn-empty-submit');
      if (emptySubmit) {
        emptySubmit.addEventListener('click', () => {
          openNewComplaintModal(() => loadData());
        });
      }
      return;
    }

    let rowsHtml = complaints.map(c => {
      const date = new Date(c.created_at).toLocaleDateString();
      return `
        <tr>
          <td><span class="ticket-code">${c.ticket_number}</span></td>
          <td>
            <strong>${c.title}</strong>
            <div style="font-size: 0.8rem; color: #64748b;">${c.category_name} &bull; ${c.location || 'Campus'}</div>
          </td>
          <td>
            <span class="priority-pill priority-${c.priority.toLowerCase()}">${c.priority}</span>
          </td>
          <td>
            <span class="badge badge-${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span>
          </td>
          <td style="color: #64748b; font-size: 0.825rem;">${date}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm view-detail-btn" data-id="${c.id}">
              View Details
            </button>
          </td>
        </tr>
      `;
    }).join('');

    complaintsContainer.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Title & Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Submitted</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    // Bind click events on "View Details"
    const viewButtons = complaintsContainer.querySelectorAll('.view-detail-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await ApiClient.complaints.getById(id);
          openComplaintDetailModal(res.data, () => loadData());
        } catch (err) {
          alert('Failed to load complaint details.');
        }
      });
    });
  }

  // Event Listeners
  btnSubmit.addEventListener('click', () => {
    openNewComplaintModal(() => loadData());
  });

  // Listen to custom navbar trigger as well
  const openModalHandler = () => {
    openNewComplaintModal(() => loadData());
  };
  window.addEventListener('open-new-complaint-modal', openModalHandler);

  btnRefresh.addEventListener('click', loadData);
  statusSelect.addEventListener('change', loadData);

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadData, 300);
  });

  // Initial load
  loadData();
}
