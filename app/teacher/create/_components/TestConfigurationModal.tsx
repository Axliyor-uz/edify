'use client';

import { useState } from 'react';
import { X, Clock, Shuffle, Eye, Lock, CheckCircle, Shield, CalendarClock, EyeOff } from 'lucide-react';

// --- UPDATED INTERFACE ---
interface TestSettings {
  duration: number; 
  shuffleQuestions: boolean;
  // 👇 CHANGED: From boolean to strict string options
  resultsVisibility: 'always' | 'after_due' | 'never'; 
  accessCode: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: TestSettings) => void;
  questionCount: number;
  testTitle: string;
  isSaving: boolean;
}

export default function TestConfigurationModal({ 
  isOpen, onClose, onConfirm, questionCount, testTitle, isSaving 
}: Props) {
  const [duration, setDuration] = useState<number>(45);
  const [isTimeLimited, setIsTimeLimited] = useState(true);
  const [shuffle, setShuffle] = useState(true);
  
  // 👇 NEW STATE: Default to 'after_due' (Best balance of learning & security)
  const [visibility, setVisibility] = useState<'always' | 'after_due' | 'never'>('after_due');
  
  const [accessCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  });

  if (!isOpen) return null;

  const handlePublish = () => {
    onConfirm({
      duration: isTimeLimited ? duration : 0,
      shuffleQuestions: shuffle,
      resultsVisibility: visibility, // Pass the new setting
      accessCode: accessCode
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-slate-900">Finalize & Publish</h2>
            <p className="text-sm text-slate-500 mt-1">Configure security for <strong>"{testTitle}"</strong>.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* 1. TIME LIMIT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Clock size={16} className="text-indigo-600" /> Time Limit
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!isTimeLimited} onChange={() => setIsTimeLimited(false)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"/>
                <span className="text-sm font-medium text-slate-700">No Limit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={isTimeLimited} onChange={() => setIsTimeLimited(true)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"/>
                <span className="text-sm font-medium text-slate-700">Fixed Time</span>
              </label>
              {isTimeLimited && (
                <div className="flex items-center gap-2 ml-auto animate-in fade-in">
                  <input type="number" min="5" max="180" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
                  <span className="text-xs font-bold text-slate-400">MINS</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. SHUFFLE */}
          <div 
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${shuffle ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}
            onClick={() => setShuffle(!shuffle)}
          >
            <div>
              <p className={`text-sm font-bold ${shuffle ? 'text-indigo-900' : 'text-slate-700'}`}>Shuffle Questions</p>
              <p className="text-xs text-slate-500">Randomize order for every student</p>
            </div>
            <div className={`p-2 rounded-full ${shuffle ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
              <Shuffle size={18} />
            </div>
          </div>

          {/* 3. ANSWER VISIBILITY (THE SECURITY FIX) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Shield size={16} className="text-indigo-600" /> Answer Key Security
            </div>
            <div className="grid grid-cols-1 gap-2">
              
              {/* Option A: After Deadline (Recommended) */}
              <div 
                onClick={() => setVisibility('after_due')}
                className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${visibility === 'after_due' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`p-2 rounded-full ${visibility === 'after_due' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  <CalendarClock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Show After Deadline</p>
                  <p className="text-xs text-slate-500">Students see answers only after the due date passes.</p>
                </div>
                {visibility === 'after_due' && <CheckCircle size={18} className="text-emerald-500 ml-auto" />}
              </div>

              {/* Option B: Never (Strict) */}
              <div 
                onClick={() => setVisibility('never')}
                className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${visibility === 'never' ? 'border-slate-600 bg-slate-100' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`p-2 rounded-full ${visibility === 'never' ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
                  <EyeOff size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Never Show Answers</p>
                  <p className="text-xs text-slate-500">Strict mode. Students only see their final score.</p>
                </div>
                {visibility === 'never' && <CheckCircle size={18} className="text-slate-600 ml-auto" />}
              </div>

              {/* Option C: Always (Open) */}
              <div 
                onClick={() => setVisibility('always')}
                className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${visibility === 'always' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`p-2 rounded-full ${visibility === 'always' ? 'bg-amber-200 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Eye size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Show Immediately</p>
                  <p className="text-xs text-slate-500">Answers revealed right after submission.</p>
                </div>
                {visibility === 'always' && <CheckCircle size={18} className="text-amber-500 ml-auto" />}
              </div>

            </div>
          </div>

          {/* 4. ACCESS CODE */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Access Code</p>
              <p className="text-2xl font-mono font-black tracking-widest text-indigo-400">{accessCode}</p>
            </div>
            <Lock size={24} className="text-slate-600" />
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
          <button onClick={handlePublish} disabled={isSaving} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {isSaving ? 'Publishing...' : 'Confirm & Publish'}
            {!isSaving && <CheckCircle size={18} />}
          </button>
        </div>

      </div>
    </div>
  );
}