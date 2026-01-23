'use client';

import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, CheckCircle, BookOpen, Lightbulb } from 'lucide-react';
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
    if (typeof obj === 'string') return obj;
    return obj?.uz || obj?.en || obj?.ru || "No text";
  };

  const questionText = getText(question.question || question.text);
  const options = question.options || {};
  const correctAnswer = question.answer;
  const explanation = getText(question.explanation);
  const solutions = question.solutions || [];
  
  const hasSolution = (explanation !== "No text" && explanation) || solutions.length > 0;

  return (
    <div className="bg-slate-800/80 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors group">
      {/* HEADER ROW */}
      <div className="p-3 flex gap-3 relative">
        <span className="text-slate-500 font-bold text-xs w-4 mt-0.5">{index}.</span>
        
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-slate-300 leading-snug">
             <LatexRenderer latex={questionText} />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold border border-slate-700 px-1 rounded">
              {question.uiDifficulty || question.difficulty || 'Normal'}
            </span>
            
            {/* Toggle Options */}
            {Object.keys(options).length > 0 && (
              <button 
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {isOptionsOpen ? 'Hide Options' : 'Show Options'}
                {isOptionsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}

            {/* Toggle Solution (NEW) */}
            {hasSolution && (
              <button 
                onClick={() => setIsSolutionOpen(!isSolutionOpen)}
                className="text-[9px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                {isSolutionOpen ? 'Hide Solution' : 'Show Solution'}
                <BookOpen size={10} />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={onRemove}
          className="text-slate-600 hover:text-red-400 transition-colors self-start p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* OPTIONS PANEL */}
      {isOptionsOpen && (
        <div className="border-t border-slate-700/50 p-2 bg-slate-900/30 space-y-1 animate-in slide-in-from-top-1 fade-in duration-200">
           {Object.entries(options).map(([key, val]: any) => {
             const isCorrect = key === correctAnswer;
             return (
               <div key={key} className={`flex gap-2 items-start p-1.5 rounded ${isCorrect ? 'bg-green-900/20 text-green-400' : 'text-slate-400'}`}>
                 <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded shrink-0 ${isCorrect ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                   {key}
                 </span>
                 <div className="text-[10px] flex-1">
                   <LatexRenderer latex={getText(val)} />
                 </div>
                 {isCorrect && <CheckCircle size={10} className="mt-0.5" />}
               </div>
             )
           })}
        </div>
      )}

      {/* SOLUTION PANEL (NEW) */}
      {isSolutionOpen && (
        <div className="border-t border-slate-700/50 p-3 bg-orange-900/10 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200 rounded-b-lg">
          {explanation && explanation !== "No text" && (
            <div className="text-[10px] text-slate-300">
              <span className="font-bold text-orange-400 uppercase tracking-wider block mb-1 text-[9px]">Explanation:</span>
              <LatexRenderer latex={explanation} />
            </div>
          )}
          
          {solutions.map((sol: any, idx: number) => (
            <div key={idx} className="text-[10px] text-slate-300">
              <span className="font-bold text-orange-400 uppercase tracking-wider block mb-1 text-[9px]">Step-by-Step:</span>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {sol.steps?.map((step: string, sIdx: number) => (
                  <li key={sIdx}><LatexRenderer latex={step} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}