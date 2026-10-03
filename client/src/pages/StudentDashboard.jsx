import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import RequestCard from '../components/RequestCard';
import RequestDetailModal from '../components/RequestDetailModal';
import {
  PlusCircle,
  Inbox,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);

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
      setError(err.message || 'Failed to load requests.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Incident & Request Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Track and submit campus complaints or maintenance requests.
          </p>
        </div>

        <Link
          to="/new-request"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Request</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Submitted"
          value={stats?.total ?? requests.length}
          icon={Inbox}
          color="blue"
          subtext="Lifetime requests"
          onClick={() => handleFilterChange('status', '')}
          active={filters.status === ''}
        />
        <StatsCard
          title="Pending"
          value={stats?.statusCounts?.Pending ?? 0}
          icon={Clock}
          color="amber"
          subtext="Awaiting review"
          onClick={() => handleQuickStatusFilter('Pending')}
          active={filters.status === 'Pending'}
        />
        <StatsCard
          title="In Progress"
          value={stats?.statusCounts?.['In Progress'] ?? 0}
          icon={Loader2}
          color="blue"
          subtext="Technician active"
          onClick={() => handleQuickStatusFilter('In Progress')}
          active={filters.status === 'In Progress'}
        />
        <StatsCard
          title="Resolved"
          value={stats?.statusCounts?.Resolved ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtext="Completed tickets"
          onClick={() => handleQuickStatusFilter('Resolved')}
          active={filters.status === 'Resolved'}
        />
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Requests Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-6">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {filters.search || filters.status || filters.category || filters.priority
              ? 'No requests match your selected filters. Try clearing filters or searching for something else.'
              : "You haven't submitted any campus requests yet. Encounter an issue? Submit a ticket anytime."}
          </p>

          <div className="mt-5 flex justify-center gap-3">
            {filters.search || filters.status || filters.category || filters.priority ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/new-request"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Your First Request</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onClick={() => setSelectedRequestId(req.id)}
            />
          ))}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onStatusUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
