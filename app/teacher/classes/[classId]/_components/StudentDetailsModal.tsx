'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { 
  X, FileText, Calendar, Clock, AlertCircle, 
  ChevronRight, ArrowLeft, CheckCircle, XCircle, 
  Loader2, ShieldAlert, ShieldCheck, Target
} from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer'; 
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const STUDENT_MODAL_TRANSLATIONS = {
  uz: {
    historyTitle: "Topshiriqlar Tarixi",
    loading: "Baholar yuklanmoqda...",
    loadingData: "Ma'lumotlar olinmoqda...",
    empty: "Hozircha topshiriqlar yo'q.",
    review: "Urinishni Ko'rish",
    late: "Kechikkan",
    due: "Muddat",
    noDeadline: "Muddat yo'q",
    missing: "Topshirilmagan",
    pending: "Kutilmoqda",
    performance: "Natijalar",
    correct: "To'g'ri",
    integrity: "Xavfsizlik Tekshiruvi",
    switches: "Oyna almashish",
    focusLost: "Test paytida diqqat yo'qotildi.",
    focusKept: "O'quvchi diqqat bilan ishladi.",
    submissionInfo: "Topshirish Ma'lumotlari",
    attempt: "Urinish",
    analysis: "Savollar Tahlili",
    studentAns: "O'quvchi Javobi",
    correctAns: "To'g'ri Javob",
    skipped: "O'tkazib yuborilgan"
  },
  en: {
    historyTitle: "Assignment History",
    loading: "Loading grades...",
    loadingData: "Retrieving Data...",
    empty: "No assignments yet.",
    review: "Review Attempt",
    late: "Late",
    due: "Due",
    noDeadline: "No Deadline",
    missing: "Missing",
    pending: "Pending",
    performance: "Performance",
    correct: "Correct",
    integrity: "Integrity Check",
    switches: "Tab Switches",
    focusLost: "Focus lost during test.",
    focusKept: "Student stayed focused.",
    submissionInfo: "Submission Info",
    attempt: "Attempt",
    analysis: "Question Analysis",
    studentAns: "Student Answer",
    correctAns: "Correct Answer",
    skipped: "Skipped"
  },
  ru: {
    historyTitle: "История Заданий",
    loading: "Загрузка оценок...",
    loadingData: "Получение данных...",
    empty: "Заданий пока нет.",
    review: "Обзор Попытки",
    late: "Поздно",
    due: "Срок",
    noDeadline: "Без срока",
    missing: "Отсутствует",
    pending: "В ожидании",
    performance: "Результаты",
    correct: "Верно",
    integrity: "Проверка Честности",
    switches: "Переключений",
    focusLost: "Потеря фокуса во время теста.",
    focusKept: "Ученик был сосредоточен.",
    submissionInfo: "Информация о сдаче",
    attempt: "Попытка",
    analysis: "Анализ Вопросов",
    studentAns: "Ответ Ученика",
    correctAns: "Правильный Ответ",
    skipped: "Пропущено"
  }
};

// --- HELPER: Fixes [object Object] ---
const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  assignments: any[];
  classId: string; 
}

export default function StudentDetailsModal({ isOpen, onClose, student, assignments, classId }: Props) {
  
  // 🟢 Use Language Hook
  const { lang } = useTeacherLanguage();
  const t = STUDENT_MODAL_TRANSLATIONS[lang];

  // STATE: Store the attempts for THIS student here
  const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Drill-down State
  const [viewingAttempt, setViewingAttempt] = useState<any>(null); 
  const [fullTestData, setFullTestData] = useState<any>(null);     
  const [loadingTest, setLoadingTest] = useState(false);

  // EFFECT: Fetch Attempts on Open (Lazy Load)
  useEffect(() => {
    if (isOpen && student && classId) {
      const fetchStudentGrades = async () => {
        setLoadingAttempts(true);
        try {
          const q = query(
            collection(db, 'attempts'),
            where('classId', '==', classId),
            where('userId', '==', student.uid)
          );
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setStudentAttempts(data);
        } catch (e) {
          console.error("Failed to load student grades", e);
        } finally {
          setLoadingAttempts(false);
        }
      };
      
      fetchStudentGrades();
    } else {
      setStudentAttempts([]);
      setViewingAttempt(null);
    }
  }, [isOpen, student, classId]);

  if (!isOpen || !student) return null;

  // --- Handlers ---
  const handleViewDetails = async (attempt: any) => {
    setLoadingTest(true);
    setViewingAttempt(attempt);
    try {
      const testRef = doc(db, 'custom_tests', attempt.testId);
      const testSnap = await getDoc(testRef);
      if (testSnap.exists()) {
        setFullTestData(testSnap.data());
      }
    } catch (error) {
      console.error("Failed to load test details", error);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleBackToList = () => {
    setViewingAttempt(null);
    setFullTestData(null);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 shadow-2xl">
        
        {/* HEADER */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             {viewingAttempt ? (
               <button onClick={handleBackToList} className="p-2 hover:bg-slate-200 rounded-full transition-colors mr-1">
                 <ArrowLeft size={20} className="text-slate-600"/>
               </button>
             ) : (
               <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white">
                 {student.displayName?.[0] || 'S'}
               </div>
             )}
             
             <div>
               <h2 className="text-lg font-black text-slate-800">
                 {viewingAttempt ? t.review : student.displayName}
               </h2>
               <p className="text-xs text-slate-500 font-medium">
                 {viewingAttempt ? viewingAttempt.testTitle : `@${student.username || 'student'}`}
               </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          
          {/* VIEW 1: ASSIGNMENT LIST */}
          {!viewingAttempt && (
            <div className="p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <FileText size={14}/> {t.historyTitle}
              </h3>

              {/* Loading State */}
              {loadingAttempts ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="animate-spin text-indigo-500" /> 
                  <span className="text-xs font-medium">{t.loading}</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">{t.empty}</div>
              ) : (
                assignments.map((assign) => {
                  if (Array.isArray(assign.assignedTo) && !assign.assignedTo.includes(student.uid)) return null;

                  const attempt = studentAttempts.find(a => a.assignmentId === assign.id);
                  
                  const isLate = !attempt && assign.dueAt && new Date() > new Date(assign.dueAt.seconds * 1000);
                  const score = attempt ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;

                  return (
                    <div 
                      key={assign.id} 
                      onClick={() => attempt && handleViewDetails(attempt)} 
                      className={`border border-slate-200 rounded-xl p-4 bg-white transition-all flex items-center justify-between group ${attempt ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${attempt ? (score >= 60 ? 'bg-green-500' : 'bg-red-500') : (isLate ? 'bg-red-400' : 'bg-slate-300')}`} />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{assign.testTitle}</h4>
                          <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                            {assign.dueAt ? (
                              <span className={`flex items-center gap-1 ${isLate ? 'text-red-500 font-bold' : ''}`}>
                                 <Calendar size={10}/> {isLate ? t.late : t.due}: {formatDate(assign.dueAt)}
                              </span>
                            ) : <span className="flex items-center gap-1"><Calendar size={10}/> {t.noDeadline}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        {attempt ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-xl font-black ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>{score}%</span>
                            <span className="text-[10px] text-slate-400 font-bold">{attempt.score}/{attempt.totalQuestions}</span>
                          </div>
                        ) : isLate ? (
                          <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><AlertCircle size={14}/> {t.missing}</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Clock size={14}/> {t.pending}</span>
                        )}
                        {attempt && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500"/>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW 2: DRILL DOWN (Review Attempt) */}
          {viewingAttempt && (
            <div className="p-6">
              {loadingTest || !fullTestData ? (
                <div className="flex flex-col items-center justify-center py-20 text-indigo-600 gap-2">
                  <Loader2 className="animate-spin" /> {t.loadingData}
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* --- 1. PERFORMANCE DASHBOARD --- */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* A. SCORE CARD */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <Target size={14} /> {t.performance}
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{viewingAttempt.score}</span>
                        <span className="text-sm text-slate-400 font-bold"> / {viewingAttempt.totalQuestions} {t.correct}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(viewingAttempt.score / viewingAttempt.totalQuestions) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* B. INTEGRITY CARD */}
                    <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
                      (viewingAttempt.tabSwitches || 0) > 0 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider ${
                        (viewingAttempt.tabSwitches || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {(viewingAttempt.tabSwitches || 0) > 0 ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                        {t.integrity}
                      </div>
                      <div>
                        <span className={`text-3xl font-black ${
                          (viewingAttempt.tabSwitches || 0) > 0 ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                          {viewingAttempt.tabSwitches || 0}
                        </span>
                        <span className={`text-sm font-bold ${
                          (viewingAttempt.tabSwitches || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
                        }`}> {t.switches}</span>
                      </div>
                      <p className={`text-[10px] mt-1 font-medium ${
                        (viewingAttempt.tabSwitches || 0) > 0 ? 'text-red-600/70' : 'text-emerald-600/70'
                      }`}>
                        {(viewingAttempt.tabSwitches || 0) > 0 
                          ? t.focusLost
                          : t.focusKept}
                      </p>
                    </div>

                    {/* C. META CARD */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <Clock size={14} /> {t.submissionInfo}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {formatDate(viewingAttempt.submittedAt || viewingAttempt.createdAt)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {t.attempt} #{viewingAttempt.attemptsTaken || 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --- 2. QUESTION BREAKDOWN --- */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t.analysis}</h3>
                    {fullTestData.questions.map((q: any, idx: number) => {
                       const studentAnswer = viewingAttempt.answers[q.id];
                       const isCorrect = studentAnswer === q.answer;

                       return (
                         <div key={idx} className={`bg-white border rounded-xl p-5 ${isCorrect ? 'border-emerald-100' : 'border-red-100 bg-red-50/20'}`}>
                           <div className="flex gap-4">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm text-white shadow-sm mt-0.5 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                               {idx + 1}
                             </div>
                             <div className="flex-1">
                               <div className="font-bold text-slate-800 mb-3 text-sm leading-relaxed">
                                 <LatexRenderer latex={getContentText(q.question)} />
                               </div>
                               
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                 <div className={`p-3 rounded-lg border flex flex-col justify-center ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    <p className="font-bold opacity-60 uppercase mb-1 flex items-center gap-1">
                                      {isCorrect ? <CheckCircle size={12}/> : <XCircle size={12}/>} {t.studentAns}
                                    </p>
                                    <div className="font-mono font-bold text-base flex items-center gap-2">
                                      <span className="bg-white/50 px-1.5 rounded">{studentAnswer || '-'}</span>
                                      <span className="text-sm opacity-80 font-medium truncate max-w-[150px]">
                                        <LatexRenderer latex={getContentText(q.options[studentAnswer]) || t.skipped} />
                                      </span>
                                    </div>
                                 </div>

                                 {!isCorrect && (
                                   <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800 flex flex-col justify-center">
                                      <p className="font-bold opacity-60 uppercase mb-1 flex items-center gap-1">
                                        <CheckCircle size={12}/> {t.correctAns}
                                      </p>
                                      <div className="font-mono font-bold text-base flex items-center gap-2">
                                        <span className="bg-white/50 px-1.5 rounded">{q.answer}</span>
                                        <span className="text-sm opacity-80 font-medium truncate max-w-[150px]">
                                          <LatexRenderer latex={getContentText(q.options[q.answer])} />
                                        </span>
                                      </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}