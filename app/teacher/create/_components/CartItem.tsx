'use client';

import { useState } from 'react';
import { Trash2, BookOpen, Eye, Check } from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';

interface Props {
  question: any;
  index: number;
  onRemove: () => void;
}

export default function CartItem({ question, index, onRemove }: Props) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSolutionOpen, setIsSolutionOpen] = useState(false);

  // Safe Text Helper
  const getText = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj?.uz || obj?.en || obj?.ru || "No text";
  };

  const questionText = getText(question.question || question.text);
  const options = question.options || {};
  const correctAnswer = question.answer;
  const explanation = getText(question.explanation);
  
  const singleSolution = getText(question.solution); 
  const multiSolutions = question.solutions || [];
  const hasSolution = (explanation && explanation !== "No text") || 
                      multiSolutions.length > 0 || 
                      (singleSolution && singleSolution !== "No text");

  // 🟢 FIX: Defined type as Record<string, string> to prevent TS error
  const diffColors: Record<string, string> = {
    easy: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    medium: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    hard: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
  };

  const difficultyKey = (question.uiDifficulty || question.difficulty || 'medium').toLowerCase();
  const diffColor = diffColors[difficultyKey] || 'text-slate-400 border-slate-600 bg-slate-800';

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden group hover:border-slate-600 transition-colors">
      
      {/* 1. MAIN CONTENT ROW */}
      <div className="p-3 md:p-4 flex gap-3 relative">
        <span className="text-slate-500 font-mono font-bold text-xs pt-0.5 shrink-0">#{index}</span>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-200 leading-relaxed break-words overflow-x-auto custom-scrollbar">
             <LatexRenderer latex={questionText} />
          </div>
        </div>

        <button 
          onClick={onRemove}
          className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all shrink-0 -mr-2 -mt-2"
          title="Remove Question"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* 2. ACTION BAR */}
      <div className="bg-slate-900/50 px-3 py-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
        
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${diffColor}`}>
          {question.uiDifficulty || question.difficulty || 'Normal'}
        </span>

        <div className="flex items-center gap-2">
           {Object.keys(options).length > 0 && (
              <button 
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className={`text-[10px] font-semibold flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${isOptionsOpen ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'}`}
              >
                <Eye size={12} />
                {isOptionsOpen ? 'Hide' : 'Options'}
              </button>
            )}

            {hasSolution && (
              <button 
                onClick={() => setIsSolutionOpen(!isSolutionOpen)}
                className={`text-[10px] font-semibold flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${isSolutionOpen ? 'bg-orange-500/20 text-orange-300' : 'text-slate-400 hover:text-orange-300 hover:bg-slate-800'}`}
              >
                <BookOpen size={12} />
                {isSolutionOpen ? 'Hide' : 'Solution'}
              </button>
            )}
        </div>
      </div>

      {/* 3. EXPANDABLE PANELS */}
      {isOptionsOpen && (
        <div className="border-t border-slate-700/50 p-3 bg-slate-900/30 space-y-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
           {Object.entries(options).map(([key, val]: any) => {
             const isCorrect = key === correctAnswer;
             return (
               <div key={key} className={`flex gap-3 items-start p-2 rounded-lg border text-xs ${isCorrect ? 'bg-emerald-900/20 border-emerald-900/30' : 'border-transparent'}`}>
                 <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-700 text-slate-400'}`}>
                   {key}
                 </span>
                 <div className={`flex-1 break-words overflow-x-auto ${isCorrect ? 'text-emerald-200' : 'text-slate-400'}`}>
                   <LatexRenderer latex={getText(val)} />
                 </div>
                 {isCorrect && <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />}
               </div>
             )
           })}
        </div>
      )}

      {isSolutionOpen && (
        <div className="border-t border-slate-700/50 p-4 bg-orange-950/10 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">
          
          {explanation && explanation !== "No text" && (
            <div className="text-xs text-slate-300 break-words">
              <span className="font-bold text-orange-400 uppercase tracking-wider block mb-1 text-[9px] flex items-center gap-1"><BookOpen size={10}/> Explanation</span>
              <div className="pl-2 border-l-2 border-orange-500/20 overflow-x-auto">
                <LatexRenderer latex={explanation} />
              </div>
            </div>
          )}

          {singleSolution && singleSolution !== "No text" && (
             <div className="text-xs text-slate-300 break-words">
               <span className="font-bold text-orange-400 uppercase tracking-wider block mb-1 text-[9px] flex items-center gap-1"><Check size={10}/> Solution</span>
               <div className="pl-2 border-l-2 border-orange-500/20 overflow-x-auto">
                 <LatexRenderer latex={singleSolution} />
               </div>
             </div>
          )}
          
          {multiSolutions.map((sol: any, idx: number) => (
            <div key={idx} className="text-xs text-slate-300 break-words">
              <span className="font-bold text-orange-400 uppercase tracking-wider block mb-1 text-[9px]">Step-by-Step</span>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
                {sol.steps?.map((step: string, sIdx: number) => (
                  <li key={sIdx} className="overflow-x-auto">
                    <LatexRenderer latex={step} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}