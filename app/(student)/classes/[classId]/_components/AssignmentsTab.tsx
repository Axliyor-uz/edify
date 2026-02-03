'use client';

import { useRouter } from 'next/navigation';
import { 
  FileText, CheckCircle, Clock, ArrowRight, Lock, 
  AlertCircle, RotateCcw, Calendar, ShieldCheck, Trophy 
} from 'lucide-react';
import { useStudentLanguage } from '@/app/(student)/layout'; // 🟢 Import Language Hook

interface Props {
  assignments: any[];
  myAttempts: any[];
  classId: string;
}

// --- 1. TRANSLATION DICTIONARY ---
const ASSIGNMENT_TRANSLATIONS = {
  uz: {
    empty: {
      title: "Faol topshiriqlar yo'q",
      desc: "Hozircha barcha vazifalar bajarilgan."
    },
    meta: {
      questions: "Savol",
      noLimit: "Vaqt Cheklovisiz",
      mins: "daq",
      closed: "Yopilgan",
      due: "Muddat",
      attempts: "Urinishlar",
      infinite: "∞"
    },
    status: {
      locked: "Qulflangan",
      view: "Natijani Ko'rish",
      missed: "O'tkazib yuborilgan",
      retake: "Qayta Topshirish",
      start: "Boshlash"
    }
  },
  en: {
    empty: {
      title: "No active assignments",
      desc: "You're all caught up for now."
    },
    meta: {
      questions: "Questions",
      noLimit: "No Time Limit",
      mins: "mins",
      closed: "Closed",
      due: "Due",
      attempts: "Attempts",
      infinite: "∞"
    },
    status: {
      locked: "Locked",
      view: "View Results",
      missed: "Missed",
      retake: "Retake",
      start: "Start"
    }
  },
  ru: {
    empty: {
      title: "Нет активных заданий",
      desc: "На данный момент все выполнено."
    },
    meta: {
      questions: "Вопросов",
      noLimit: "Без ограничений",
      mins: "мин",
      closed: "Закрыто",
      due: "Срок",
      attempts: "Попытки",
      infinite: "∞"
    },
    status: {
      locked: "Закрыто",
      view: "Результаты",
      missed: "Пропущено",
      retake: "Пересдать",
      start: "Начать"
    }
  }
};

export default function AssignmentsTab({ assignments, myAttempts, classId }: Props) {
  const router = useRouter();
  
  // 🟢 Use Language Hook
  const { lang } = useStudentLanguage();
  const t = ASSIGNMENT_TRANSLATIONS[lang];

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
        <div className="p-4 bg-slate-800 rounded-full shadow-lg mb-4">
          <FileText className="text-slate-400" size={32} />
        </div>
        <h3 className="text-slate-300 font-bold text-lg">{t.empty.title}</h3>
        <p className="text-slate-400 text-sm">{t.empty.desc}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assign: any) => {
        // --- 1. CALCULATE STATUS (UNCHANGED LOGIC) ---
        const attemptDoc = myAttempts.find((a: any) => a.assignmentId === assign.id);
        const attemptCount = attemptDoc ? (attemptDoc.attemptsTaken || 1) : 0;
        const maxAttempts = assign.allowedAttempts ?? 1; 
        
        const scorePercent = attemptDoc 
          ? Math.round((attemptDoc.score / attemptDoc.totalQuestions) * 100) 
          : null;

        const isCompleted = maxAttempts !== 0 && attemptCount >= maxAttempts;
        
        const now = new Date();
        const openDate = assign.openAt ? new Date(assign.openAt.seconds * 1000) : null;
        const dueDate = assign.dueAt ? new Date(assign.dueAt.seconds * 1000) : null;
        
        const isLocked = openDate && now < openDate;
        const isExpired = dueDate && now > dueDate;
        
        // Date formatting based on locale could be improved, but keeping simple for now
        const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

        return (
          <div 
            key={assign.id} 
            className="group bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
          >
            {/* LEFT: INFO */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-white text-base md:text-lg group-hover:text-blue-400 transition-colors truncate">
                  {assign.testTitle}
                </h3>
                
                {(assign.duration > 0 || !assign.showResults) && (
                  <div className="group/tooltip relative">
                    <ShieldCheck size={14} className="text-emerald-400/60" />
                  </div>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-slate-400">
                
                {/* 1. Question Count */}
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-500" />
                  <span className="font-medium text-white">{assign.questionCount}</span> {t.meta.questions}
                </span>

                {/* 2. Duration (Time Limit) */}
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" />
                  {assign.duration ? `${assign.duration} ${t.meta.mins}` : t.meta.noLimit}
                </span>

                {/* 3. Due Date */}
                {dueDate && (
                  <span className={`flex items-center gap-1.5 ${isExpired ? 'text-red-400 font-bold' : ''}`}>
                    <Calendar size={14} className={isExpired ? 'text-red-400' : 'text-slate-500'} />
                    {isExpired ? `${t.meta.closed} ` : `${t.meta.due} `} 
                    {formatDate(dueDate)} - {formatTime(dueDate)}
                  </span>
                )}

                {/* 4. Attempts Badge */}
                {maxAttempts !== 1 && (
                  <span className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">
                    <RotateCcw size={12} />
                    <span className="font-medium text-white">{attemptCount}</span> / {maxAttempts === 0 ? t.meta.infinite : maxAttempts} {t.meta.attempts}
                  </span>
                )}

                {/* 5. Score Badge */}
                {scorePercent !== null && (
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold ${
                    scorePercent >= 60 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <Trophy size={12} />
                    <span className="font-medium">{scorePercent}%</span>
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: ACTION BUTTON */}
            <div className="md:min-w-[160px] flex justify-end">
              
              {/* CASE A: LOCKED */}
              {isLocked ? (
                <button disabled className="w-full md:w-auto px-4 md:px-5 py-2.5 bg-slate-700/50 text-slate-400 font-bold rounded-lg border border-slate-600 flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                  <Lock size={16} /> 
                  <span>{t.status.locked}</span>
                </button>
              ) 
              /* CASE B: COMPLETED or EXPIRED & TRIED -> View Results */
              : (isCompleted || (isExpired && attemptCount > 0)) ? (
                <button 
                  onClick={() => router.push(`/classes/${classId}/test/${assign.id}/results`)}
                  className="w-full md:w-auto px-4 md:px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 font-bold rounded-lg hover:border-blue-500 hover:text-blue-400 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
                >
                  {t.status.view} <ArrowRight size={16} />
                </button>
              )
              /* CASE C: EXPIRED & NEVER TRIED -> Dead */
              : isExpired ? (
                <div className="w-full md:w-auto px-4 md:px-5 py-2.5 bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 flex items-center justify-center gap-2 text-sm">
                  <AlertCircle size={16} /> {t.status.missed}
                </div>
              )
              /* CASE D: AVAILABLE -> Start/Retake */
              : (
                <button 
                  onClick={() => router.push(`/classes/${classId}/test/${assign.id}`)}
                  className={`w-full md:w-auto px-4 md:px-6 py-2.5 font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5 active:translate-y-0 ${
                    attemptCount > 0 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30' // Retake Style
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl'      // Start Style
                  }`}
                >
                  {attemptCount > 0 ? <RotateCcw size={16}/> : <CheckCircle size={16}/>}
                  {attemptCount > 0 ? t.status.retake : t.status.start}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}