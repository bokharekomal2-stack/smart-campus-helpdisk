// Smart Campus Helpdesk - Admin Dashboard View
import ApiClient from '../api.js';
import { state } from '../state.js';
import { openComplaintDetailModal } from './complaintDetailModal.js';

export function renderAdminDashboardView(container) {
  const user = state.user;

  const categoryOptions = state.categories.map(cat => 
    `<option value="${cat.id}">${cat.name}</option>`
  ).join('');

  container.innerHTML = `
    <div>
      <div class="dashboard-header">
        <div class="header-text">
          <h1>Campus Helpdesk Administration</h1>
          <p>Logged in as <strong>${user.name}</strong> &bull; Department: ${user.department || 'Administration'}</p>
        </div>
        <div>
          <button id="btn-admin-refresh" class="btn btn-secondary">
            ↻ Refresh All Data
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">Total Complaints</span>
            <span id="admin-stat-total" class="stat-value">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #f1f5f9; color: #475569;">📊</div>
        </div>

        <div class="stat-card" style="border-left: 4px solid #f59e0b;">
          <div class="stat-info">
            <span class="stat-label">Pending Review</span>
            <span id="admin-stat-pending" class="stat-value" style="color: #b45309;">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #fef3c7; color: #b45309;">⏳</div>
        </div>

        <div class="stat-card" style="border-left: 4px solid #3b82f6;">
          <div class="stat-info">
            <span class="stat-label">In Progress</span>
            <span id="admin-stat-progress" class="stat-value" style="color: #1d4ed8;">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #dbeafe; color: #1d4ed8;">⚙️</div>
        </div>

        <div class="stat-card" style="border-left: 4px solid #10b981;">
          <div class="stat-info">
            <span class="stat-label">Resolved</span>
            <span id="admin-stat-resolved" class="stat-value" style="color: #15803d;">-</span>
          </div>
          <div class="stat-badge-icon" style="background: #dcfce7; color: #15803d;">✅</div>
        </div>
      </div>

      <!-- Category Breakdown Banner -->
      <div id="category-pills" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
      </div>

      <!-- Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="search-input-wrap">
          <input type="text" id="admin-filter-search" class="form-control" placeholder="Search ticket #, student name, email, or issue..." />
        </div>

        <div style="min-width: 140px;">
          <select id="admin-filter-status" class="form-control">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div style="min-width: 160px;">
          <select id="admin-filter-category" class="form-control">
            <option value="ALL">All Categories</option>
            ${categoryOptions}
          </select>
        </div>

        <div style="min-width: 130px;">
          <select id="admin-filter-priority" class="form-control">
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <!-- Complaints Management Table -->
      <div id="admin-complaints-container" class="table-container">
        <div style="text-align: center; padding: 2rem; color: #64748b;">Loading complaints...</div>
      </div>
    </div>
  `;

  const btnRefresh = container.querySelector('#btn-admin-refresh');
  const searchInput = container.querySelector('#admin-filter-search');
  const statusSelect = container.querySelector('#admin-filter-status');
  const categorySelect = container.querySelector('#admin-filter-category');
  const prioritySelect = container.querySelector('#admin-filter-priority');
  const tableContainer = container.querySelector('#admin-complaints-container');
  const categoryPillsContainer = container.querySelector('#category-pills');

  const statTotal = container.querySelector('#admin-stat-total');
  const statPending = container.querySelector('#admin-stat-pending');
  const statProgress = container.querySelector('#admin-stat-progress');
  const statResolved = container.querySelector('#admin-stat-resolved');

  async function loadData() {
    try {
      // 1. Fetch Stats & Category breakdown
      const statsRes = await ApiClient.stats.get();
      if (statsRes.success) {
        const o = statsRes.data.overview;
        statTotal.textContent = o.total;
        statPending.textContent = o.pending;
        statProgress.textContent = o.in_progress;
        statResolved.textContent = o.resolved;

        // Render category breakdown pills
        if (statsRes.data.categoryBreakdown) {
          categoryPillsContainer.innerHTML = statsRes.data.categoryBreakdown.map(cat => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
              <span style="font-weight: 500; color: #334155;">${cat.category_name}</span>
              <span style="background: #e2e8f0; color: #1e293b; font-weight: 700; border-radius: 9999px; padding: 0.1rem 0.4rem; font-size: 0.75rem;">${cat.count}</span>
            </div>
          `).join('');
        }
      }

      // 2. Fetch Complaints
      const complaintsRes = await ApiClient.complaints.list({
        status: statusSelect.value,
        category_id: categorySelect.value,
        priority: prioritySelect.value,
        search: searchInput.value
      });

      renderComplaints(complaintsRes.data);
    } catch (err) {
      tableContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #dc2626;">
          Failed to load complaints: ${err.message}
        </div>
      `;
    }
  }

  function renderComplaints(complaints) {
    if (!complaints || complaints.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h3>No matching complaints found</h3>
          <p>Try adjusting your search criteria or filter options.</p>
        </div>
      `;
      return;
    }

    let rowsHtml = complaints.map(c => {
      const date = new Date(c.created_at).toLocaleDateString();
      return `
        <tr>
          <td><span class="ticket-code">${c.ticket_number}</span></td>
          <td>
            <strong>${c.title}</strong>
            <div style="font-size: 0.78rem; color: #64748b;">${c.category_name} &bull; ${c.location || 'Campus'}</div>
          </td>
          <td>
            <div style="font-weight: 600; font-size: 0.85rem;">${c.student_name}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${c.student_campus_id || c.student_email}</div>
          </td>
          <td>
            <span class="priority-pill priority-${c.priority.toLowerCase()}">${c.priority}</span>
          </td>
          <td>
            <span class="badge badge-${c.status.toLowerCase()}">${c.status.replace('_', ' ')}</span>
          </td>
          <td style="color: #64748b; font-size: 0.8rem;">${date}</td>
          <td style="text-align: right;">
            <button class="btn btn-primary btn-sm manage-ticket-btn" data-id="${c.id}">
              Manage
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tableContainer.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Issue Title & Category</th>
            <th>Student</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    // Bind Manage button click
    const manageButtons = tableContainer.querySelectorAll('.manage-ticket-btn');
    manageButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await ApiClient.complaints.getById(id);
          openComplaintDetailModal(res.data, () => loadData());
        } catch (err) {
          alert('Failed to load complaint details: ' + err.message);
        }
      });
    });
  }

  // Filter event listeners
  btnRefresh.addEventListener('click', loadData);
  statusSelect.addEventListener('change', loadData);
  categorySelect.addEventListener('change', loadData);
  prioritySelect.addEventListener('change', loadData);

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadData, 300);
  });

  // Initial load
  loadData();
}
