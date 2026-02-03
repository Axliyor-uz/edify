'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  CheckCircle, XCircle, ChevronLeft, AlertTriangle, 
  BookOpen, Trophy, Lightbulb, List, Eye, Lock, Clock, Calendar
} from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer'; 
import { Loader2 } from 'lucide-react';
import { useStudentLanguage } from '@/app/(student)/layout'; // 🟢 Import Language Hook

// --- 1. TRANSLATION DICTIONARY ---
const RESULTS_TRANSLATIONS = {
  uz: {
    loading: "Kirish huquqi tekshirilmoqda...",
    back: "Ortga",
    title: "Natijalar",
    status: {
      excellent: "Ajoyib Natija!",
      good: "Yaxshi Harakat",
      needsWork: "Yaxshilash Kerak"
    },
    cards: {
      score: "Ball",
      right: "To'g'ri",
      wrong: "Noto'g'ri",
      questions: "Savollar",
      review: "Batafsil Ko'rib Chiqish"
    },
    question: {
      skipped: "Siz o'tkazib yubordingiz",
      yourAns: "Sizning javobingiz",
      noSel: "Tanlanmadi",
      correctAns: "To'g'ri Javob",
      showOpts: "Variantlarni ko'rsatish",
      hideOpts: "Variantlarni yashirish",
      viewExp: "Yechimni ko'rish",
      hideExp: "Yechimni yashirish",
      solution: "Bosqichma-bosqich yechim",
      options: "Barcha Variantlar"
    },
    blocked: {
      title: "Ball Saqlandi",
      result: "Sizning Natijangiz",
      reason1: "O'qituvchi batafsil ko'rib chiqishni o'chirib qo'ygan.",
      reason2: "Natijalar muddat tugaguncha yashirin: ",
      btn: "Panelga qaytish"
    }
  },
  en: {
    loading: "Verifying Access...",
    back: "Back",
    title: "Results",
    status: {
      excellent: "Excellent Work!",
      good: "Good Effort",
      needsWork: "Needs Improvement"
    },
    cards: {
      score: "Score",
      right: "Right",
      wrong: "Wrong",
      questions: "Questions",
      review: "Detailed Review"
    },
    question: {
      skipped: "You Skipped",
      yourAns: "Your Answer",
      noSel: "No option selected",
      correctAns: "Correct Answer",
      showOpts: "Show All Options",
      hideOpts: "Hide Options",
      viewExp: "View Explanation",
      hideExp: "Hide Explanation",
      solution: "Step-by-Step Solution",
      options: "All Options"
    },
    blocked: {
      title: "Score Recorded",
      result: "Your Result",
      reason1: "The instructor has disabled detailed review for this test.",
      reason2: "Results are hidden until the deadline passes: ",
      btn: "Return to Dashboard"
    }
  },
  ru: {
    loading: "Проверка доступа...",
    back: "Назад",
    title: "Результаты",
    status: {
      excellent: "Отличная работа!",
      good: "Хорошая попытка",
      needsWork: "Нужно улучшить"
    },
    cards: {
      score: "Балл",
      right: "Верно",
      wrong: "Неверно",
      questions: "Вопросов",
      review: "Подробный обзор"
    },
    question: {
      skipped: "Вы пропустили",
      yourAns: "Ваш ответ",
      noSel: "Не выбрано",
      correctAns: "Правильный ответ",
      showOpts: "Показать все",
      hideOpts: "Скрыть варианты",
      viewExp: "Показать решение",
      hideExp: "Скрыть решение",
      solution: "Пошаговое решение",
      options: "Все варианты"
    },
    blocked: {
      title: "Балл сохранен",
      result: "Ваш результат",
      reason1: "Преподаватель отключил подробный обзор для этого теста.",
      reason2: "Результаты скрыты до истечения срока: ",
      btn: "Вернуться на панель"
    }
  }
};

// ==================================================================================
// 1. HELPERS
// ==================================================================================

const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

// 🔒 SECURE TIME FETCHER
async function getSecureTime() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/ip  ');
    if (!response.ok) throw new Error('Time API failed');
    const data = await response.json();
    return new Date(data.datetime);
  } catch (error) {
    console.warn("Could not verify server time, falling back to local time.");
    return new Date(); 
  }
}

// ==================================================================================
// 2. COMPONENT: Question Card
// ==================================================================================
const QuestionReviewCard = ({ 
  question, 
  index, 
  studentAnswerKey,
  t 
}: { 
  question: any, 
  index: number, 
  studentAnswerKey: string | undefined,
  t: any 
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false); 

  const questionText = getContentText(question.question);
  const rawExplanation = question.explanation || question.solution; 
  const explanationText = getContentText(rawExplanation);
  
  const isCorrect = studentAnswerKey === question.answer;
  const isSkipped = !studentAnswerKey;
  
  const borderColor = isCorrect ? 'border-emerald-100' : isSkipped ? 'border-slate-100' : 'border-rose-100';
  const headerBg = isCorrect ? 'bg-emerald-50/30' : isSkipped ? 'bg-slate-50' : 'bg-rose-50/30';
  const badgeColor = isCorrect ? 'bg-emerald-500' : isSkipped ? 'bg-slate-300' : 'bg-rose-400';

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${borderColor}`}>
      <div className={`px-4 md:px-6 py-4 md:py-5 flex items-start gap-4 md:gap-5 border-b ${borderColor} ${headerBg}`}>
        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs md:text-sm text-white shadow-sm mt-0.5 ${badgeColor}`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-700 text-base md:text-lg leading-relaxed">
            <LatexRenderer latex={questionText} />
          </div>
        </div>
        <div className="shrink-0">
          {isCorrect ? <CheckCircle className="text-emerald-500" size={20} /> : 
           isSkipped ? <AlertTriangle className="text-slate-400" size={20} /> : 
           <XCircle className="text-rose-500" size={20} />}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Student Answer */}
          <div className={`rounded-xl p-3 md:p-4 border flex flex-col gap-2 relative overflow-hidden ${isCorrect ? 'bg-emerald-50/50 border-emerald-100' : isSkipped ? 'bg-slate-50 border-slate-100' : 'bg-rose-50/50 border-rose-100'}`}>
             <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 md:gap-2 ${isCorrect ? 'text-emerald-600' : isSkipped ? 'text-slate-500' : 'text-rose-600'}`}>
               {isCorrect ? <CheckCircle size={12}/> : isSkipped ? <AlertTriangle size={12}/> : <XCircle size={12}/>}
               {isSkipped ? t.question.skipped : t.question.yourAns}
             </span>
             <div className="flex gap-2 md:gap-3 items-center relative z-10">
                {isSkipped ? (
                   <span className="text-slate-400 italic text-sm font-medium">{t.question.noSel}</span>
                ) : (
                   <>
                     <span className={`font-mono px-2 py-1 md:px-2.5 md:py-1 rounded text-xs md:text-sm font-bold shadow-sm ${isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                        {studentAnswerKey?.toUpperCase()}
                     </span>
                     <div className="text-slate-700 font-medium text-sm md:text-base">
                       <LatexRenderer latex={getContentText(question.options[studentAnswerKey as string])} />
                     </div>
                   </>
                )}
             </div>
          </div>

          {/* Correct Answer */}
          {!isCorrect && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 md:p-4 flex flex-col gap-2 relative overflow-hidden">
               <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 md:gap-2 relative z-10">
                 <CheckCircle size={12} /> {t.question.correctAns}
               </span>
               <div className="flex gap-2 md:gap-3 items-center relative z-10">
                  <span className="font-mono bg-emerald-200 text-emerald-800 px-2 py-1 md:px-2.5 md:py-1 rounded text-xs md:text-sm font-bold shadow-sm">
                    {question.answer?.toUpperCase()}
                  </span>
                  <div className="text-slate-700 font-medium text-sm md:text-base">
                    <LatexRenderer latex={getContentText(question.options[question.answer])} />
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-3 md:pt-4 border-t border-slate-100 mt-3 md:mt-4">
          <button 
            onClick={() => setShowAllOptions(!showAllOptions)}
            className="flex items-center gap-1 md:gap-2 text-slate-500 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 md:px-4 md:py-2.5 rounded-lg transition-all"
          >
            {showAllOptions ? <Eye size={12} /> : <List size={12} />}
            {showAllOptions ? t.question.hideOpts : t.question.showOpts}
          </button>

          {explanationText && (
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-1 md:gap-2 text-xs font-bold px-3 py-2 md:px-4 md:py-2.5 rounded-lg border transition-all shadow-sm ${
                showExplanation 
                ? 'bg-indigo-500 text-white border-indigo-500' 
                : 'bg-white text-indigo-500 border-indigo-200 hover:border-indigo-500'
              }`}
            >
              <Lightbulb size={12} className={showExplanation ? "fill-white" : "fill-indigo-500"} />
              {showExplanation ? t.question.hideExp : t.question.viewExp}
            </button>
          )}
        </div>

        {showAllOptions && (
          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-2 md:mb-3">{t.question.options}</p>
            <div className="space-y-1 md:space-y-2">
              {Object.entries(question.options || {}).map(([key, val]: any) => (
                <div key={key} className={`flex items-center gap-2 md:gap-3 p-2 rounded-lg border ${key === question.answer ? 'bg-emerald-100/50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                  <span className={`font-mono text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded ${key === question.answer ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {key}
                  </span>
                  <div className="text-sm text-slate-700">
                    <LatexRenderer latex={getContentText(val)} />
                  </div>
                  {key === question.answer && <CheckCircle size={12} className="text-emerald-500 ml-auto"/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {showExplanation && explanationText && (
          <div className="mt-3 md:mt-4 p-4 md:p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
             <div className="flex gap-2 md:gap-3">
                <div className="shrink-0 mt-0.5">
                   <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                     <Lightbulb size={12} />
                   </div>
                </div>
                <div className="space-y-1 w-full">
                   <p className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.question.solution}</p>
                   <div className="text-slate-700 text-sm leading-6 md:leading-7">
                     <LatexRenderer latex={explanationText} />
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};


// ==================================================================================
// 3. MAIN PAGE COMPONENT
// ==================================================================================
export default function TestResultsPage() {
  const { classId, assignmentId } = useParams() as { classId: string; assignmentId: string };
  const { user } = useAuth();
  const router = useRouter();
  
  // 🟢 Use Language Hook
  const { lang } = useStudentLanguage();
  const t = RESULTS_TRANSLATIONS[lang];

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [testData, setTestData] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);

  // Security States
  const [canViewDetails, setCanViewDetails] = useState(false);
  const [blockReason, setBlockReason] = useState<string>('');
  const [verifyingSecurity, setVerifyingSecurity] = useState(true);

  // 1. LOAD DATA
  useEffect(() => {
    if (!user) return;

    async function loadResults() {
      try {
        // Fetch Attempt
        const attemptsQ = query(collection(db, 'attempts'), where('assignmentId', '==', assignmentId), where('userId', '==', user!.uid));
        const attemptSnap = await getDocs(attemptsQ);
        if (attemptSnap.empty) { router.push(`/classes/${classId}`); return; }
        const attemptDoc = attemptSnap.docs[0].data();
        setAttempt(attemptDoc);

        // Fetch Test
        const testRef = doc(db, 'custom_tests', attemptDoc.testId);
        const testSnap = await getDoc(testRef);
        if (testSnap.exists()) setTestData(testSnap.data());

        // Fetch Assignment (Needed for Due Date)
        const assignRef = doc(db, 'classes', classId, 'assignments', assignmentId);
        const assignSnap = await getDoc(assignRef);
        if (assignSnap.exists()) setAssignment(assignSnap.data());

      } catch (error) {
        console.error("Error loading results:", error);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [user, assignmentId, classId, router]);

  // 2. CHECK SECURITY (Run when data is loaded)
  useEffect(() => {
    if (!testData || !assignment) return;

    const performSecurityCheck = async () => {
      const visibility = testData.resultsVisibility || (testData.showResults ? 'always' : 'never');

      if (visibility === 'always') {
        setCanViewDetails(true);
      } 
      else if (visibility === 'never') {
        setCanViewDetails(false);
        setBlockReason(t.blocked.reason1);
      } 
      else if (visibility === 'after_due') {
        if (!assignment.dueAt) {
          setCanViewDetails(true); 
        } else {
          // 🛑 SECURE TIME CHECK
          const now = await getSecureTime();
          const dueDate = new Date(assignment.dueAt.seconds * 1000);
          
          if (now > dueDate) {
            setCanViewDetails(true);
          } else {
            setCanViewDetails(false);
            const dateStr = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const timeStr = dueDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            setBlockReason(`${t.blocked.reason2} ${dateStr} at ${timeStr}`);
          }
        }
      }
      setVerifyingSecurity(false);
    };

    performSecurityCheck();
  }, [testData, assignment, t]);

  // --- RENDERING ---

  if (loading || verifyingSecurity) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 text-indigo-500 gap-2 font-bold">
      <Loader2 className="animate-spin" /> {t.loading}
    </div>
  );

  if (!attempt || !testData) return null;

  // --- BLOCKED STATE UI ---
  if (!canViewDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 md:p-8 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 animate-in zoom-in duration-300">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <Lock size={28} />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-700">{t.blocked.title}</h1>
          <div className="mt-4 md:mt-6 p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
             <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{t.blocked.result}</p>
             <p className="text-3xl md:text-5xl font-black text-indigo-500 tracking-tight">
               {attempt.score}<span className="text-xl md:text-2xl text-slate-300 font-bold">/{attempt.totalQuestions}</span>
             </p>
          </div>
          
          <div className="mt-4 md:mt-6 bg-yellow-50 border border-yellow-100 p-3 md:p-4 rounded-xl text-yellow-700 text-xs md:text-sm font-medium flex items-start gap-2 md:gap-3 text-left">
             <Clock size={16} className="shrink-0 mt-0.5" />
             <p>{blockReason}</p>
          </div>

          <button 
            onClick={() => router.push(`/classes/${classId}`)}
            className="mt-6 md:mt-8 w-full py-2.5 md:py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all shadow-sm"
          >
            {t.blocked.btn}
          </button>
        </div>
      </div>
    );
  }

  // --- ALLOWED STATE UI ---
  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  let gradeColor = 'text-rose-500 bg-rose-50 border-rose-100';
  let gradeMessage = t.status.needsWork;
  
  if (percentage >= 80) {
    gradeColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
    gradeMessage = t.status.excellent;
  } else if (percentage >= 50) {
    gradeColor = 'text-amber-500 bg-amber-50 border-amber-100';
    gradeMessage = t.status.good;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm/30 backdrop-blur-sm bg-white/95">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 pb-3 md:py-0 md:h-16 flex items-center justify-between">
   <button onClick={() => router.push(`/classes/${classId}`)} className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-indigo-500 transition-colors">
     <ChevronLeft size={14} /> {t.back}
   </button>
   <h1 className="font-bold text-slate-700 hidden md:block text-base md:text-lg truncate max-w-[250px] md:max-w-[300px]">{t.title}: {testData.title}</h1>
   <div className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black border flex items-center gap-1 ${gradeColor}`}>
     <Trophy size={10} /> {percentage}%
   </div>
</div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="bg-white p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-full translate-x-8 md:translate-x-10 -translate-y-8 md:-translate-y-10 z-0" />
           <div className="text-center md:text-left relative z-10">
             <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 mb-1">{gradeMessage}</h2>
             <p className="text-slate-500 font-medium text-sm md:text-base">You scored <strong className="text-slate-800">{attempt.score}</strong> correct out of <strong className="text-slate-800">{attempt.totalQuestions}</strong> questions.</p>
           </div>
           <div className="flex gap-2 md:gap-3 text-center relative z-10">
             <div className="p-2 md:p-3 bg-emerald-50 rounded-xl md:rounded-2xl border border-emerald-100 min-w-[70px] md:min-w-[80px]">
               <CheckCircle size={16} className="mx-auto mb-0.5 md:mb-1 text-emerald-500" />
               <p className="text-[9px] md:text-[10px] font-bold text-emerald-600/70 uppercase">{t.cards.right}</p>
               <p className="font-bold text-emerald-700 text-lg md:text-xl mt-0.5 md:mt-1">{attempt.score}</p>
             </div>
             <div className="p-2 md:p-3 bg-rose-50 rounded-xl md:rounded-2xl border border-rose-100 min-w-[70px] md:min-w-[80px]">
               <XCircle size={16} className="mx-auto mb-0.5 md:mb-1 text-rose-500" />
               <p className="text-[9px] md:text-[10px] font-bold text-rose-600/70 uppercase">{t.cards.wrong}</p>
               <p className="font-bold text-rose-700 text-lg md:text-xl mt-0.5 md:mt-1">{attempt.totalQuestions - attempt.score}</p>
             </div>
           </div>
        </div>

        <div className="space-y-5 md:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 md:pb-4">
            <h3 className="font-black text-slate-700 text-lg md:text-xl flex items-center gap-1 md:gap-2">
              <BookOpen size={20} className="text-indigo-500"/> {t.cards.review}
            </h3>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-slate-100">
              {testData.questions.length} {t.cards.questions}
            </span>
          </div>

          <div className="space-y-5 md:space-y-6">
            {testData.questions.map((q: any, idx: number) => (
              <QuestionReviewCard 
                key={q.id || idx}
                question={q}
                index={idx}
                studentAnswerKey={attempt.answers[q.id]}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}