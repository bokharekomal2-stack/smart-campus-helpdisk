import React, { useState } from 'react';
import { X, Shield, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

export const AdminActionModal = ({ request, onClose, onSuccess }) => {
  const [status, setStatus] = useState(request?.status || 'Pending');
  const [priority, setPriority] = useState(request?.priority || 'Medium');
  const [adminNotes, setAdminNotes] = useState(request?.admin_notes || '');
  const [resolutionNotes, setResolutionNotes] = useState(request?.resolution_notes || '');
  const [saving, setSaving] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);
  const [error, setError] = useState('');

  if (!request) return null;

  const handleGenerateAiDraft = async () => {
    try {
      setAiDrafting(true);
      setAiNotice(null);
      setError('');

      const res = await api.draftResolution(
        request.id,
        adminNotes || 'Service maintenance completed by campus technicians.'
      );

      if (res.configured === false) {
        setAiNotice({
          type: 'warning',
          message:
            res.message ||
            'Google Gemini API key not found in .env. To enable AI resolution drafting, add GEMINI_API_KEY.',
        });
      } else if (res.success && res.data?.draft) {
        setResolutionNotes(res.data.draft);
        setAiNotice({
          type: 'success',
          message: 'Resolution draft generated successfully via Google Gemini AI!',
        });
        if (status !== 'Resolved') {
          setStatus('Resolved');
        }
      }
    } catch (err) {
      setError(`AI drafting failed: ${err.message}`);
    } finally {
      setAiDrafting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      const res = await api.updateStatus(request.id, {
        status,
        priority,
        admin_notes: adminNotes,
        resolution_notes: status === 'Resolved' ? resolutionNotes : null,
      });

      if (res.success) {
        onSuccess(res.request);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-action-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="admin-action-title" className="text-base font-bold text-slate-900">
                Update Ticket: {request.ticket_number}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-sm">{request.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* AI Banner / Notification */}
          {aiNotice && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                aiNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {aiNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{aiNotice.message}</div>
            </div>
          )}

          {/* Status & Priority Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="select-status" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ticket Status *
              </label>
              <select
                id="select-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="select-priority" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level *
              </label>
              <select
                id="select-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {PRIORITY_OPTIONS.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Admin Internal Work Notes */}
          <div>
            <label htmlFor="admin-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin & Technician Work Notes
            </label>
            <textarea
              id="admin-notes"
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Work order #442 issued. Technician dispatched with replacement part..."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Resolution Notes with Google Gemini Drafter */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="resolution-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Resolution Summary & Message to Student
              </label>

              <button
                type="button"
                onClick={handleGenerateAiDraft}
                disabled={aiDrafting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
                title="Generate courteous response using Google Gemini AI"
              >
                {aiDrafting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Gemini Drafting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Draft with Google Gemini</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              id="resolution-notes"
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Explain to the student what was diagnosed, the corrective maintenance performed, and any advice..."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:ring-1 focus:ring-sky-500 leading-relaxed font-sans"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Required when resolving a ticket. Visible to the student.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
            >
              {saving ? 'Saving Changes...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminActionModal;
