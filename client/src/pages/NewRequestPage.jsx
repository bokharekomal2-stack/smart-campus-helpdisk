import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import GeminiTriageModal from '../components/GeminiTriageModal';

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

const PRIORITIES = [
  { value: 'Low', label: 'Low', desc: 'Cosmetic or minor convenience' },
  { value: 'Medium', label: 'Medium', desc: 'Routine issue or non-blocking defect' },
  { value: 'High', label: 'High', desc: 'Disrupts class, study, or living space' },
  { value: 'Urgent', label: 'Urgent', desc: 'Safety hazard, water leak, or outage' },
];

export const NewRequestPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT Services',
    priority: 'Medium',
    location: '',
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Triage State
  const [aiLoading, setAiLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [showTriageModal, setShowTriageModal] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
    setError('');
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  // Google Gemini AI Smart Triage
  const handleAiTriage = async () => {
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Please write at least 10 characters in the description before running AI Triage.');
      return;
    }

    try {
      setAiLoading(true);
      setError('');
      const res = await api.triageRequest({
        title: formData.title || 'Campus Incident',
        description: formData.description,
        location: formData.location,
      });

      setTriageResult(res);
      setShowTriageModal(true);
    } catch (err) {
      setError(`AI Triage failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiCategoryAndPriority = (suggestedCat, suggestedPri) => {
    setFormData((prev) => ({
      ...prev,
      category: CATEGORIES.includes(suggestedCat) ? suggestedCat : prev.category,
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(suggestedPri) ? suggestedPri : prev.priority,
    }));
    setShowTriageModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Please provide a title (minimum 3 characters).');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Please provide a detailed description (minimum 10 characters).');
      return;
    }

    if (!formData.location.trim()) {
      setError('Please specify the campus location (building, room, floor, or landmark).');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('category', formData.category);
      data.append('priority', formData.priority);
      data.append('location', formData.location.trim());

      if (file) {
        data.append('attachment', file);
      }

      const res = await api.createRequest(data);
      if (res.success) {
        navigate('/student');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Requests</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Submit Campus Request or Complaint
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Provide clear details so our facilities and IT staff can resolve your issue quickly.
              </p>
            </div>

            {/* AI Triage Quick Action Banner */}
            <button
              type="button"
              onClick={handleAiTriage}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
              title="Classify category & get immediate troubleshooting guidance via Google Gemini AI"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>Gemini Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>AI Smart Triage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="req-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Request Title *
            </label>
            <input
              id="req-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Wi-Fi dropping connection in Turing Hall 3rd floor lounge"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          {/* Description & AI Triage Helper */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="req-description" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detailed Description *
              </label>

              <button
                type="button"
                onClick={handleAiTriage}
                disabled={aiLoading}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Auto-categorize with Gemini</span>
              </button>
            </div>

            <textarea
              id="req-description"
              name="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what happened, when it started, and who is affected. (e.g. Printer is showing error E-40, water leaking from pipe, door handle loose)..."
              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors leading-relaxed"
            />
            <span className="text-[11px] text-slate-600 mt-1 block">
              Minimum 10 characters. Be specific to speed up technician assignment.
            </span>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="req-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Service Category *
              </label>
              <select
                id="req-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="req-priority" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urgency / Priority *
              </label>
              <select
                id="req-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} &mdash; {p.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="req-location" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Campus Location *
            </label>
            <input
              id="req-location"
              name="location"
              type="text"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Science Complex Hall 204 / Library 2nd Floor Study Room C"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          {/* Optional File / Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Optional Image or Document Evidence (Max 5 MB)
            </label>

            {!file ? (
              <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-xl p-6 text-center bg-slate-50 hover:bg-sky-50/30 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Upload photo or document"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Click or drag and drop to upload photo or document
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Supported formats: JPG, PNG, WEBP, GIF, PDF, DOC, TXT (up to 5 MB)
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-xs sm:max-w-sm">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  aria-label="Remove attached file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/student"
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <span>Submit Campus Request</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Google Gemini AI Triage Modal */}
      {showTriageModal && (
        <GeminiTriageModal
          result={triageResult}
          onApplyCategoryAndPriority={handleApplyAiCategoryAndPriority}
          onClose={() => setShowTriageModal(false)}
        />
      )}
    </div>
  );
};

export default NewRequestPage;
