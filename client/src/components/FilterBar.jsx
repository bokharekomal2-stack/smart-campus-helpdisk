import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  'IT Services',
  'Facilities & Maintenance',
  'Hostel & Housing',
  'Academic Services',
  'Transportation',
  'Library',
  'Cafeteria',
  'Safety & Security',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Pending', 'In Progress', 'Resolved'];

export const FilterBar = ({ filters, onFilterChange, onReset }) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.category) ||
    Boolean(filters.priority) ||
    (filters.sort && filters.sort !== 'newest');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search requests
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-input"
            type="text"
            placeholder="Search tickets by ID, keyword, building, or student..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Status select */}
          <div>
            <label htmlFor="filter-status" className="sr-only">
              Filter by Status
            </label>
            <select
              id="filter-status"
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Category select */}
          <div>
            <label htmlFor="filter-category" className="sr-only">
              Filter by Category
            </label>
            <select
              id="filter-category"
              value={filters.category || ''}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority select */}
          <div>
            <label htmlFor="filter-priority" className="sr-only">
              Filter by Priority
            </label>
            <select
              id="filter-priority"
              value={filters.priority || ''}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>

          {/* Sort select */}
          <div>
            <label htmlFor="filter-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="filter-sort"
              value={filters.sort || 'newest'}
              onChange={(e) => onFilterChange('sort', e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
            title="Reset filters"
            aria-label="Reset all search filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
