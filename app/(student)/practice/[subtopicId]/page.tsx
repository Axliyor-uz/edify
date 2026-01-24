'use client';

import Link from 'next/link';
import { BarChart3, TrendingUp, ArrowLeft, Bell } from 'lucide-react';

export default function AnalyticsPage1() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20 delay-100"></div>
          <div className="relative bg-white p-6 rounded-full shadow-xl shadow-indigo-100 border border-slate-100 flex items-center justify-center h-full w-full">
            <div className="relative">
              <BarChart3 size={48} className="text-indigo-600" />
              <TrendingUp size={24} className="text-green-500 absolute -top-2 -right-3 bg-white rounded-full border-2 border-white" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Analytics <span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            We are building a powerful dashboard to track student performance, identify learning gaps, and visualize growth over time.
          </p>
        </div>

        {/* Feature Preview Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Class Insights', 'Student Growth', 'Test Comparisons', 'Export PDF'].map((tag) => (
            <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link 
            href="/teacher/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-sm">
            <Bell size={16} /> Notify When Ready
          </button>
        </div>

      </div>
    </div>
  );
}