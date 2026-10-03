import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Paperclip,
  Send,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Shield,
  MessageSquare,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RequestDetailModal = ({
  requestId,
  onClose,
  onOpenAdminAction,
  onStatusUpdated,
}) => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getRequestById(requestId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchDetails();
    }
  }, [requestId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await api.addNote(requestId, newNote.trim(), isInternalNote);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          notes: [...(prev.notes || []), res.note],
        }));
        setNewNote('');
        setIsInternalNote(false);
      }
    } catch (err) {
      alert(`Error adding note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!requestId) return null;

  const req = data?.request;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-sky-700 bg-sky-100/80 px-2.5 py-1 rounded border border-sky-200">
              {req?.ticket_number || 'Loading...'}
            </span>
            {req && (
              <>
                <StatusBadge status={req.status} />
                <PriorityBadge priority={req.priority} />
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && req && (
              <button
                onClick={() => onOpenAdminAction(req)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Manage Ticket
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-500 font-medium">Loading ticket details...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              {error}
            </div>
          )}

          {req && (
            <>
              {/* Title & Metadata */}
              <div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  {req.category}
                </span>
                <h2 id="modal-title" className="text-xl font-bold text-slate-900 leading-snug">
                  {req.title}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    {req.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Submitted: {new Date(req.created_at).toLocaleString()}
                  </span>
                  {req.student_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Student: {req.student_name} ({req.student_department || 'Student'})
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Issue Description
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {req.description}
                </p>
              </div>

              {/* Attachment Preview */}
              {req.attachment_url && (
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                    Attached File / Evidence
                  </h4>

                  {req.attachment_url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                    <div className="mt-2 space-y-2">
                      <img
                        src={req.attachment_url}
                        alt="Issue attachment"
                        className="max-h-64 rounded-lg border border-slate-200 object-contain bg-slate-50"
                      />
                      <a
                        href={req.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View full size ({req.attachment_name || 'attachment'})
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {req.attachment_name || 'Document Attachment'}
                        </span>
                      </div>
                      <a
                        href={req.attachment_url}
                        download
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution Banner (if Resolved) */}
              {req.status === 'Resolved' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800">
                        Incident Resolved {req.resolved_at && `on ${new Date(req.resolved_at).toLocaleString()}`}
                      </h4>
                      {req.resolution_notes ? (
                        <p className="text-sm text-emerald-700 mt-1 whitespace-pre-wrap">
                          {req.resolution_notes}
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          This request has been resolved by campus service staff.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline / Audit History */}
              {data.history && data.history.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Status History & Activity
                  </h4>
                  <div className="border-l-2 border-slate-200 ml-2.5 pl-4 space-y-4">
                    {data.history.map((hist) => (
                      <div key={hist.id} className="relative text-xs">
                        <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white ring-2 ring-sky-200"></div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            Status changed to <span className="text-sky-700 font-bold">{hist.to_status}</span>
                          </span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="text-slate-500">
                            {new Date(hist.created_at).toLocaleString()}
                          </span>
                          <span className="text-slate-400">by</span>
                          <span className="font-medium text-slate-600">{hist.changed_by_name}</span>
                        </div>
                        {hist.comment && (
                          <p className="mt-1 text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                            {hist.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion / Notes Section */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Updates & Comments ({data.notes?.length || 0})
                </h4>

                {/* Existing Notes */}
                <div className="space-y-3 mb-4">
                  {(!data.notes || data.notes.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No notes posted yet.</p>
                  )}
                  {data.notes?.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-xl text-xs border ${
                        n.is_internal
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {n.author_name}
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {n.author_role}
                          </span>
                          {Boolean(n.is_internal) && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-800">
                              Internal Staff Note
                            </span>
                          )}
                        </span>
                        <span className="text-slate-600 text-[11px]">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed mt-1">{n.note}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <label htmlFor="note-text" className="sr-only">
                    Add comment or update
                  </label>
                  <textarea
                    id="note-text"
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type an update or reply regarding this ticket..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />

                  <div className="flex items-center justify-between">
                    {isAdmin ? (
                      <label className="flex items-center gap-1.5 text-xs text-amber-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-medium">Internal staff note (hidden from student)</span>
                      </label>
                    ) : (
                      <div></div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingNote || !newNote.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingNote ? 'Posting...' : 'Post Update'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
