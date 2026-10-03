import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import RequestDetailModal from '../components/RequestDetailModal';
import AdminActionModal from '../components/AdminActionModal';
import {
  Shield,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Percent,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  Inbox,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [activeAdminRequest, setActiveAdminRequest] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
    sort: 'newest',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reqRes, statsRes] = await Promise.all([
        api.getRequests(filters),
        api.getStats(),
      ]);

      if (reqRes.success) {
        setRequests(reqRes.requests || []);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      priority: '',
      sort: 'newest',
    });
  };

  const handleQuickStatusFilter = (status) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? '' : status,
    }));
  };

  const handleStatusUpdateSuccess = (updatedRequest) => {
    // Update local state
    setRequests((prev) =>
      prev.map((r) => (r.id === updatedRequest.id ? { ...r, ...updatedRequest } : r))
    );
    // Refresh stats
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              Campus Administration Console
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Incident Management & Operations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.department || 'IT Operations'}). View, triage, and resolve campus service requests.
          </p>
        </div>
      </div>

      {/* Admin Analytics Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
        <StatsCard
          title="All Requests"
          value={stats?.total ?? requests.length}
          icon={Shield}
          color="blue"
          subtext="Campus total"
          onClick={() => handleFilterChange('status', '')}
          active={filters.status === ''}
        />
        <StatsCard
          title="Pending"
          value={stats?.statusCounts?.Pending ?? 0}
          icon={Clock}
          color="amber"
          subtext="Needs triage"
          onClick={() => handleQuickStatusFilter('Pending')}
          active={filters.status === 'Pending'}
        />
        <StatsCard
          title="In Progress"
          value={stats?.statusCounts?.['In Progress'] ?? 0}
          icon={Loader2}
          color="blue"
          subtext="Assigned work"
          onClick={() => handleQuickStatusFilter('In Progress')}
          active={filters.status === 'In Progress'}
        />
        <StatsCard
          title="Resolved"
          value={stats?.statusCounts?.Resolved ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtext={`${stats?.resolutionRate ?? 0}% resolution rate`}
          onClick={() => handleQuickStatusFilter('Resolved')}
          active={filters.status === 'Resolved'}
        />
        <StatsCard
          title="Urgent Alerts"
          value={stats?.urgentPending ?? 0}
          icon={AlertTriangle}
          color="rose"
          subtext="Urgent & pending"
          onClick={() => {
            setFilters((prev) => ({
              ...prev,
              priority: prev.priority === 'Urgent' ? '' : 'Urgent',
              status: prev.status === 'Pending' ? '' : 'Pending',
            }));
          }}
          active={filters.priority === 'Urgent' && filters.status === 'Pending'}
        />
      </div>

      {/* Category Breakdown Chips */}
      {stats?.categories && stats.categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
            Campus Issues Breakdown:
          </span>
          <div className="flex flex-wrap gap-2">
            {stats.categories.map((c) => (
              <button
                key={c.category}
                onClick={() =>
                  handleFilterChange('category', filters.category === c.category ? '' : c.category)
                }
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  filters.category === c.category
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c.category} <span className="font-bold opacity-80">({c.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Error notice */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Table / List View for Admin */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">Loading campus tickets...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No tickets found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or resetting filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Campus Requests Table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3.5 px-4">Ticket</th>
                  <th scope="col" className="py-3.5 px-4">Issue Title & Location</th>
                  <th scope="col" className="py-3.5 px-4">Category</th>
                  <th scope="col" className="py-3.5 px-4">Priority</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4">Student</th>
                  <th scope="col" className="py-3.5 px-4">Date</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRequestId(r.id)}
                  >
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700 whitespace-nowrap">
                      {r.ticket_number}
                    </td>

                    {/* Title & Location */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {r.title}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{r.location}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {r.category}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={r.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Student */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <div className="font-medium text-slate-800">{r.student_name}</div>
                      <div className="text-[11px] text-slate-500">{r.student_roll_no || r.student_email}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveAdminRequest(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
                        title="Update status & priority"
                      >
                        <Shield className="w-3 h-3" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onOpenAdminAction={(req) => {
            setSelectedRequestId(null);
            setActiveAdminRequest(req);
          }}
          onStatusUpdated={fetchData}
        />
      )}

      {/* Admin Action Modal with Google Gemini Drafter */}
      {activeAdminRequest && (
        <AdminActionModal
          request={activeAdminRequest}
          onClose={() => setActiveAdminRequest(null)}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
