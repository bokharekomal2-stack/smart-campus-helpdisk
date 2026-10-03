import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Smart Campus Helpdesk</span>
            <span>&bull;</span>
            <span>University IT & Facilities Management System</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Access
            </span>
            <span className="inline-flex items-center gap-1.5 text-indigo-600">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Google Gemini Powered
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
