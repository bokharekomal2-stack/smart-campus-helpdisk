import React from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import PriorityBadge from './PriorityBadge';

export const GeminiTriageModal = ({
  result,
  onApplyCategoryAndPriority,
  onClose,
}) => {
  if (!result) return null;

  const { configured, message, data } = result;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 id="gemini-modal-title" className="text-base font-bold">
                Google Gemini Smart Triage
              </h3>
              <p className="text-xs text-sky-100">
                AI Incident Classification & Self-Service Guidance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Unconfigured State Notice */}
          {!configured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">
                    Google Gemini API Key Not Configured
                  </h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    {message || 'Google Gemini AI is ready to triage tickets once an API key is provided.'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">How to activate Google Gemini AI:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Get a free Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-sky-600 font-semibold underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Open the project <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> file</li>
                  <li>Set <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY=your_key_here</code></li>
                  <li>Restart the server and refresh this page.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Active Result State */}
          {configured && data && (
            <>
              {/* Safety Hazard Warning */}
              {data.is_safety_hazard && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                      Safety Hazard Detected
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                      This incident has been identified as a physical, electrical, or hazard risk. If there is immediate danger, please also alert campus emergency security.
                    </p>
                  </div>
                </div>
              )}

              {/* Triage Recommendations */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Classification
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Suggested Category
                    </span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">
                      {data.category}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Recommended Priority
                    </span>
                    <div className="mt-1">
                      <PriorityBadge priority={data.priority} />
                    </div>
                  </div>
                </div>

                {data.urgency_rationale && (
                  <p className="text-xs text-slate-600 italic">
                    Reason: &ldquo;{data.urgency_rationale}&rdquo;
                  </p>
                )}

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => onApplyCategoryAndPriority(data.category, data.priority)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors border border-sky-200"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Category & Priority to Form</span>
                </button>
              </div>

              {/* Instant Self-Help Guidance */}
              {data.self_help_guidance && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    Instant Troubleshooting & Self-Service Advice
                  </h4>
                  <p className="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">
                    {data.self_help_guidance}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiTriageModal;
