'use client';

import { useRouter } from 'next/navigation';
import { 
  FileText, CheckCircle, Clock, ArrowRight, Lock, 
  AlertCircle, RotateCcw, Calendar, ShieldCheck, Trophy 
} from 'lucide-react';

interface Props {
  assignments: any[];
  myAttempts: any[];
  classId: string;
}

export default function AssignmentsTab({ assignments, myAttempts, classId }: Props) {
  const router = useRouter();

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <FileText className="text-slate-300" size={32} />
        </div>
        <h3 className="text-slate-600 font-bold text-lg">No active assignments</h3>
        <p className="text-slate-400 text-sm">You're all caught up for now.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assign: any) => {
        // --- 1. CALCULATE STATUS ---
        const attemptDoc = myAttempts.find((a: any) => a.assignmentId === assign.id);
        const attemptCount = attemptDoc ? (attemptDoc.attemptsTaken || 1) : 0;
        const maxAttempts = assign.allowedAttempts ?? 1; 
        
        // Calculate Score Percentage (if attempt exists)
        const scorePercent = attemptDoc 
          ? Math.round((attemptDoc.score / attemptDoc.totalQuestions) * 100) 
          : null;

        const isCompleted = maxAttempts !== 0 && attemptCount >= maxAttempts;
        
        const now = new Date();
        const openDate = assign.openAt ? new Date(assign.openAt.seconds * 1000) : null;
        const dueDate = assign.dueAt ? new Date(assign.dueAt.seconds * 1000) : null;
        
        const isLocked = openDate && now < openDate;
        const isExpired = dueDate && now > dueDate;
        
        const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

        return (
          <div 
            key={assign.id} 
            className="group bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
          >
            {/* LEFT: INFO */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                  {assign.testTitle}
                </h3>
                
                {(assign.duration > 0 || !assign.showResults) && (
                  <div className="group/tooltip relative">
                    <ShieldCheck size={14} className="text-emerald-500/60" />
                  </div>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                
                {/* 1. Question Count */}
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-400" />
                  {assign.questionCount} Questions
                </span>

                {/* 2. Duration (Time Limit) - NEW 🟢 */}
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  {assign.duration ? `${assign.duration} mins` : 'No Time Limit'}
                </span>

                {/* 3. Due Date */}
                {dueDate && (
                  <span className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                    <Calendar size={14} className={isExpired ? 'text-red-500' : 'text-slate-400'} />
                    {isExpired ? 'Closed ' : 'Due '} 
                    {formatDate(dueDate)} at {formatTime(dueDate)}
                  </span>
                )}

                {/* 4. Attempts Badge */}
                {maxAttempts !== 1 && (
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    <RotateCcw size={12} />
                    {attemptCount} / {maxAttempts === 0 ? '∞' : maxAttempts} Attempts
                  </span>
                )}

                {/* 5. Score Badge (If taken) - NEW 🟢 */}
                {scorePercent !== null && (
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold ${
                    scorePercent >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <Trophy size={12} />
                    {scorePercent}%
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: ACTION BUTTON */}
            <div className="sm:min-w-[160px] flex justify-end">
              
              {/* CASE A: LOCKED */}
              {isLocked ? (
                <button disabled className="w-full sm:w-auto px-5 py-2.5 bg-slate-50 text-slate-400 font-bold rounded-lg border border-slate-100 flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                  <Lock size={16} /> 
                  <span>Locked</span>
                </button>
              ) 
              /* CASE B: COMPLETED or EXPIRED & TRIED -> View Results */
              : (isCompleted || (isExpired && attemptCount > 0)) ? (
                <button 
                  onClick={() => router.push(`/classes/${classId}/test/${assign.id}/results`)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  View Results <ArrowRight size={16} />
                </button>
              )
              /* CASE C: EXPIRED & NEVER TRIED -> Dead */
              : isExpired ? (
                <div className="w-full sm:w-auto px-5 py-2.5 bg-red-50 text-red-500 font-bold rounded-lg border border-red-100 flex items-center justify-center gap-2 text-sm">
                  <AlertCircle size={16} /> Missed
                </div>
              )
              /* CASE D: AVAILABLE -> Start/Retake */
              : (
                <button 
                  onClick={() => router.push(`/classes/${classId}/test/${assign.id}`)}
                  className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5 active:translate-y-0 ${
                    attemptCount > 0 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100' // Retake Style
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'      // Start Style
                  }`}
                >
                  {attemptCount > 0 ? <RotateCcw size={16}/> : <CheckCircle size={16}/>}
                  {attemptCount > 0 ? 'Retake' : 'Start'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}