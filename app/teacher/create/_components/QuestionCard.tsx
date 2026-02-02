'use client';

import { useState } from 'react';
import { Check, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';

interface Props {
  question: any; 
  isAdded: boolean;
  onToggle: () => void;
  index: number;
  disabled?: boolean;
}

export default function QuestionCard({ question, isAdded, onToggle, index, disabled }: Props) {
  const [showOptions, setShowOptions] = useState(false);

  const getText = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj?.uz || obj?.en || obj?.ru || "No text";
  };

  const questionText = getText(question.question || question.text);
  const options = question.options || {};
  const correctAnswer = question.answer; 
  const difficulty = (question.difficulty || 'medium').toLowerCase();

  // 🟢 FIX: Define the map separately with the correct type
  const badgeColors: Record<string, string> = {
    easy: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    medium: 'text-amber-700 bg-amber-50 border-amber-100',
    hard: 'text-rose-700 bg-rose-50 border-rose-100',
  };

  const badgeClass = badgeColors[difficulty] || 'text-slate-600 bg-slate-50 border-slate-100';

  return (
    <div 
      className={`
        relative bg-white rounded-xl border transition-all duration-200 group
        ${isAdded 
          ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md z-10' 
          : 'border-slate-200 hover:border-indigo-300 shadow-sm'}
      `}
    >
      <div className="p-3 md:p-4 flex gap-3 md:gap-4 items-start">
        
        {/* 1. Left: Number Only */}
        <div className="pt-1 shrink-0">
          <span className="text-xs font-bold text-slate-400 font-mono">#{index}</span>
        </div>

        {/* 2. Middle: Content (Expands) */}
        <div className="flex-1 min-w-0">
          
          {/* Metadata Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wide ${badgeClass}`}>
              {difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div className="text-slate-800 text-sm leading-relaxed overflow-x-auto min-w-0 break-words custom-scrollbar">
             <LatexRenderer latex={questionText} />
          </div>

          {/* Toggle Options Button */}
          {Object.keys(options).length > 0 && (
            <div className="mt-3">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200"
              >
                {showOptions ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                {showOptions ? 'Hide Options' : 'Show Options'}
              </button>
            </div>
          )}
        </div>

        {/* 3. Right: Toggle Button */}
        <div className="pt-0.5 shrink-0 ml-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled || isAdded) onToggle();
            }}
            disabled={disabled && !isAdded}
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
              ${isAdded 
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                : disabled 
                  ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:scale-105'
              }
            `}
            title={isAdded ? "Remove" : disabled ? "Limit reached (Max 100)" : "Add"}
          >
            {isAdded ? <Minus size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
          </button>
        </div>

      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="bg-slate-50/50 border-t border-slate-100 px-3 py-3 md:px-4 rounded-b-xl animate-in slide-in-from-top-1 fade-in duration-200">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(options).map(([key, val]: any) => {
              const isCorrect = key === correctAnswer;
              return (
                <div key={key} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{key}</span>
                  <div className="min-w-0 overflow-x-auto break-words flex-1"><LatexRenderer latex={getText(val)} /></div>
                  {isCorrect && <Check size={14} className="text-emerald-600 shrink-0" />}
                </div>
              );
            })}
           </div>
        </div>
      )}
    </div>
  );
}