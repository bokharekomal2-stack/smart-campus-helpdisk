import React from 'react';
import { MapPin, Paperclip, Calendar, User, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export const RequestCard = ({ request, onClick, showStudent = false }) => {
  const formattedDate = new Date(request.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Header: Ticket Number & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
              {request.ticket_number}
            </span>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {request.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1 mb-2">
          {request.title}
        </h3>

        {/* Description Snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {request.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-600" title="Location">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">{request.location}</span>
          </span>

          {showStudent && request.student_name && (
            <span className="flex items-center gap-1 font-medium text-slate-600" title="Student">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[120px]">{request.student_name}</span>
            </span>
          )}

          {request.attachment_url && (
            <span className="flex items-center gap-1 text-slate-500" title="Has file attachment">
              <Paperclip className="w-3.5 h-3.5 text-sky-600" />
              <span>File</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formattedDate}</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
