'use client';

import { useState } from 'react';
import { CheckCircle, Plus, Eye, EyeOff } from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';

interface Props {
  question: any; 
  isAdded: boolean;
  onAdd: () => void;
}

export default function QuestionCard({ question, isAdded, onAdd }: Props) {
  const [showOptions, setShowOptions] = useState(false);

  // Safe Text Helper
  const getText = (obj: any) => {
    if (typeof obj === 'string') return obj;
    return obj?.uz || obj?.en || obj?.ru || "No text";
  };

  const questionText = getText(question.question || question.text);
  const options = question.options || {};
  const correctAnswer = question.answer; 

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group">
      
      {/* 1. QUESTION TEXT */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 text-sm text-slate-700 font-medium leading-relaxed">
          <LatexRenderer latex={questionText} />
        </div>
        
        <button 
          onClick={onAdd}
          disabled={isAdded}
          className={`p-2 rounded-lg transition-all shrink-0 ${
            isAdded 
              ? 'bg-green-100 text-green-600 cursor-default' 
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          {isAdded ? <CheckCircle size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* 2. TOOLBAR */}
      <div className="flex flex-wrap gap-2 mt-3 border-t border-slate-50 pt-3">
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
             question.difficulty === 'hard' ? 'bg-red-50 text-red-600 border-red-100' :
             question.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
             'bg-green-50 text-green-600 border-green-100'
         }`}>
           {question.difficulty || 'Normal'}
         </span>
         
         {/* Toggle Options */}
         {Object.keys(options).length > 0 && (
           <button 
             onClick={() => setShowOptions(!showOptions)}
             className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center gap-1 transition-colors"
           >
             {showOptions ? <EyeOff size={10} /> : <Eye size={10} />}
             {showOptions ? 'Hide Options' : 'Show Options'}
           </button>
         )}
      </div>

      {/* 3. OPTIONS PANEL */}
      {showOptions && (
        <div className="mt-3 grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {Object.entries(options).map(([key, val]: any) => {
            const isCorrect = key === correctAnswer;
            return (
              <div 
                key={key} 
                className={`text-xs p-2 rounded-lg border flex gap-2 items-center ${
                  isCorrect 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <span className={`font-bold w-5 h-5 flex items-center justify-center rounded text-[10px] ${isCorrect ? 'bg-green-200' : 'bg-slate-200'}`}>
                  {key}
                </span>
                <div className="flex-1">
                  <LatexRenderer latex={getText(val)} />
                </div>
                {isCorrect && <CheckCircle size={14} className="text-green-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}