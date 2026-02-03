'use client';

import { sendNotification } from '@/services/notificationService';
import { setDoc, increment, updateDoc, arrayUnion } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  Loader2, Clock, AlertTriangle, CheckCircle, 
  ChevronRight, AlertCircle, Flag, Eye, Maximize2, Minimize2, Lock, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import LatexRenderer from '@/components/LatexRenderer'; 
import { useStudentLanguage } from '@/app/(student)/layout'; // 🟢 Import Language Hook

// --- 1. TRANSLATION DICTIONARY ---
const TEST_TRANSLATIONS = {
  uz: {
    loading: "Test yuklanmoqda...",
    error: "Testni yuklashda xatolik",
    back: "Ortga qaytish",
    lobby: {
      questions: "Savollar",
      minutes: "Daqiqa",
      instructions: "Ko'rsatmalar:",
      rule1: "Chiqib ketsangiz ham vaqt davom etadi.",
      rule2: "Sahifani keraksiz yangilamang.",
      rule3: "Tab almashtirish yozib boriladi.",
      startBtn: "Testni Boshlash",
      cancel: "Bekor qilish"
    },
    header: {
      question: "Savol",
      focus: "Diqqat",
      locked: "Qulflangan"
    },
    actions: {
      flagged: "Belgilangan",
      flag: "Belgilash",
      prev: "Oldingi",
      next: "Keyingi",
      finish: "Yakunlash",
      submit: "Topshirish",
      viewResults: "Natijani Ko'rish",
      returnClass: "Sinfga Qaytish"
    },
    modal: {
      title: "Testni Yakunlaysizmi?",
      answered: "Javob berildi",
      unanswered: "Javobsiz Savollar",
      back: "Qaytish"
    },
    result: {
      submitted: "Topshirildi!",
      saved: "Javoblaringiz saqlandi.",
      score: "Ball",
      hidden: "Natijalar hozircha yashirin."
    },
    toasts: {
      deadline: "Muddat tugagan.",
      maxAttempts: "Urinishlar limiti tugagan.",
      expired: "Sessiya muddati tugagan.",
      restored: "Sessiya tiklandi!",
      focusWarn: "Ogohlantirish: Diqqat yo'qotildi!",
      timeUp: "Vaqt tugadi! Topshirilmoqda...",
      missedQ: "Siz savolni o'tkazib yubordingiz!",
      success: "Topshirildi!",
      fail: "Xatolik. Internetni tekshiring."
    }
  },
  en: {
    loading: "Loading Test...",
    error: "Error loading test",
    back: "Go Back",
    lobby: {
      questions: "Questions",
      minutes: "Minutes",
      instructions: "Instructions:",
      rule1: "Timer continues if you leave.",
      rule2: "Do not refresh unnecessarily.",
      rule3: "Tab switching is recorded.",
      startBtn: "Start Test Now",
      cancel: "Cancel"
    },
    header: {
      question: "Q",
      focus: "Focus",
      locked: "Locked"
    },
    actions: {
      flagged: "Flagged",
      flag: "Flag",
      prev: "Previous",
      next: "Next",
      finish: "Finish Test",
      submit: "Submit",
      viewResults: "View Results",
      returnClass: "Return to Class"
    },
    modal: {
      title: "Finish Test?",
      answered: "Answered",
      unanswered: "Unanswered Questions",
      back: "Back"
    },
    result: {
      submitted: "Submitted!",
      saved: "Your answers are recorded.",
      score: "Score",
      hidden: "Results are currently hidden."
    },
    toasts: {
      deadline: "Deadline passed.",
      maxAttempts: "Max attempts reached.",
      expired: "Session expired.",
      restored: "Session restored!",
      focusWarn: "Warning: Focus lost!",
      timeUp: "Time is up! Submitting...",
      missedQ: "You missed a question!",
      success: "Submitted!",
      fail: "Submission failed. Check internet."
    }
  },
  ru: {
    loading: "Загрузка теста...",
    error: "Ошибка загрузки",
    back: "Назад",
    lobby: {
      questions: "Вопросов",
      minutes: "Минут",
      instructions: "Инструкции:",
      rule1: "Таймер продолжается при выходе.",
      rule2: "Не обновляйте страницу без нужды.",
      rule3: "Переключение вкладок фиксируется.",
      startBtn: "Начать Тест",
      cancel: "Отмена"
    },
    header: {
      question: "Вопрос",
      focus: "Фокус",
      locked: "Заблокировано"
    },
    actions: {
      flagged: "Отмечено",
      flag: "Отметить",
      prev: "Назад",
      next: "Далее",
      finish: "Завершить",
      submit: "Сдать",
      viewResults: "Результаты",
      returnClass: "Вернуться в класс"
    },
    modal: {
      title: "Завершить тест?",
      answered: "Отвечено",
      unanswered: "Есть пропущенные вопросы",
      back: "Назад"
    },
    result: {
      submitted: "Сдано!",
      saved: "Ваши ответы сохранены.",
      score: "Балл",
      hidden: "Результаты скрыты."
    },
    toasts: {
      deadline: "Срок истек.",
      maxAttempts: "Лимит попыток исчерпан.",
      expired: "Сессия истекла.",
      restored: "Сессия восстановлена!",
      focusWarn: "Внимание: Потеря фокуса!",
      timeUp: "Время вышло! Отправка...",
      missedQ: "Вы пропустили вопрос!",
      success: "Сдано!",
      fail: "Ошибка отправки. Проверьте интернет."
    }
  }
};

// --- HELPER: Fixes [object Object] & duplication issues ---
const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

// --- HELPER: Secure Time Check ---
const isPastDeadline = (dueAt: any) => {
  if (!dueAt) return true; 
  const now = new Date(); 
  const due = new Date(dueAt.seconds * 1000);
  return now > due;
};

interface TestState {
  status: 'loading' | 'lobby' | 'taking' | 'submitted' | 'error';
  assignment: any;
  test: any;
  questions: any[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flagged: string[];
  timeRemaining: number;
  tabSwitchCount: number;
  score?: number; 
  endTime?: number; 
}

export default function TestRunnerPage() {
  const { classId, assignmentId } = useParams() as { classId: string; assignmentId: string };
  const { user } = useAuth();
  const router = useRouter();
  
  // 🟢 Use Language Hook
  const { lang } = useStudentLanguage();
  const t = TEST_TRANSLATIONS[lang];

  // --- STATE DEFINITIONS ---
  const [state, setState] = useState<TestState>({
    status: 'loading',
    assignment: null,
    test: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    flagged: [],
    timeRemaining: 0,
    tabSwitchCount: 0
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // --- REFS ---
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollNavRef = useRef<HTMLDivElement>(null);

  // Storage Key
  const STORAGE_KEY = `test_session_${user?.uid}_${assignmentId}`;

  // --- 1. INITIAL LOAD & RESTORE SESSION ---
  useEffect(() => {
    if (!user) return;
    const userId = user.uid;

    async function loadData() {
      try {
        // Fetch Assignment
        const assignRef = doc(db, 'classes', classId, 'assignments', assignmentId);
        const assignSnap = await getDoc(assignRef);
        if (!assignSnap.exists()) throw new Error("Assignment not found");
        const assignData = assignSnap.data();

        // Check Deadline
        if (assignData.dueAt && isPastDeadline(assignData.dueAt)) {
          toast.error(t.toasts.deadline);
          localStorage.removeItem(STORAGE_KEY);
          router.push(`/classes/${classId}`);
          return;
        }

        // Check Attempts
        const limit = assignData.allowedAttempts ?? 1;
        if (limit !== 0) { 
          const attemptsQ = query(collection(db, 'attempts'), where('assignmentId', '==', assignmentId), where('userId', '==', userId));
          const attemptsSnap = await getDocs(attemptsQ);
          if (attemptsSnap.size >= limit) {
            toast.error(t.toasts.maxAttempts);
            localStorage.removeItem(STORAGE_KEY);
            router.push(`/classes/${classId}/test/${assignmentId}/results`);
            return;
          }
        }

        // Fetch Test Content
        const testRef = doc(db, 'custom_tests', assignData.testId);
        const testSnap = await getDoc(testRef);
        if (!testSnap.exists()) throw new Error("Test data missing");
        const testData = testSnap.data();

        // CHECK LOCAL STORAGE FOR RESUME
        const savedSession = localStorage.getItem(STORAGE_KEY);
        
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const now = Date.now();
          const realTimeRemaining = Math.floor((parsed.endTime - now) / 1000);

          if (realTimeRemaining <= 0) {
            toast.error(t.toasts.expired);
            localStorage.removeItem(STORAGE_KEY);
          } else {
            // RESUME SESSION
            setState({
              status: 'taking',
              assignment: assignData,
              test: testData,
              questions: testData.questions || [],
              currentQuestionIndex: parsed.currentQuestionIndex || 0,
              answers: parsed.answers || {},
              flagged: parsed.flagged || [],
              tabSwitchCount: parsed.tabSwitchCount || 0,
              timeRemaining: realTimeRemaining,
              endTime: parsed.endTime
            });
            toast.success(t.toasts.restored);
            return;
          }
        }

        // Default Start (Lobby)
        setState(prev => ({
          ...prev,
          status: 'lobby',
          assignment: assignData,
          test: testData,
          questions: testData.questions || [],
          timeRemaining: (testData.duration || 60) * 60 
        }));

      } catch (e) {
        console.error(e);
        setState(prev => ({ ...prev, status: 'error' }));
      }
    }
    loadData();
  }, [classId, assignmentId, user, router, STORAGE_KEY, t]);

  // --- 2. AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (state.status === 'taking' && state.endTime) {
      const sessionData = {
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        flagged: state.flagged,
        tabSwitchCount: state.tabSwitchCount,
        endTime: state.endTime
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    }
  }, [state.answers, state.flagged, state.currentQuestionIndex, state.tabSwitchCount, state.status, state.endTime, STORAGE_KEY]);

  // --- 3. SCROLL NAVIGATOR EFFECT ---
  useEffect(() => {
    if (state.status === 'taking' && scrollNavRef.current) {
      const activeButton = scrollNavRef.current.children[state.currentQuestionIndex] as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [state.currentQuestionIndex, state.status]);

  // --- 4. TIMER EFFECT ---
  useEffect(() => {
    if (state.status === 'taking' && state.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.status]);

  // --- 5. SECURITY EFFECT ---
  useEffect(() => {
    if (state.status !== 'taking') return;
    if (showSubmitModal) return; 

    const handleFocusLoss = () => {
      if (showSubmitModal) return;
      setState(prev => ({ ...prev, tabSwitchCount: prev.tabSwitchCount + 1 }));
      toast(t.toasts.focusWarn, { icon: '⚠️' });
    };

    const handleVisibilityChange = () => { if (document.hidden) handleFocusLoss(); };
    const handleWindowBlur = () => { handleFocusLoss(); };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [state.status, showSubmitModal, t]);

  // --- HELPER FUNCTIONS ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const startTest = () => {
    toggleFullscreen();
    const durationSec = (state.test.duration || 60) * 60;
    const endTime = Date.now() + (durationSec * 1000);
    setState(prev => ({ ...prev, status: 'taking', timeRemaining: durationSec, endTime: endTime }));
  };

  const selectAnswer = (optionKey: string) => {
    const currentQ = state.questions[state.currentQuestionIndex];
    setState(prev => ({ ...prev, answers: { ...prev.answers, [currentQ.id]: optionKey } }));
  };

  const toggleFlag = () => {
    const currentQ = state.questions[state.currentQuestionIndex];
    setState(prev => {
      const isFlagged = prev.flagged.includes(currentQ.id);
      return {
        ...prev,
        flagged: isFlagged ? prev.flagged.filter(id => id !== currentQ.id) : [...prev.flagged, currentQ.id]
      };
    });
  };

  const handleAutoSubmit = () => {
    toast(t.toasts.timeUp, { icon: '⏰' });
    handleSubmit();
  };

  const handleNextOrFinish = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(p => ({ ...p, currentQuestionIndex: p.currentQuestionIndex + 1 }));
      return;
    }
    const firstSkippedIndex = state.questions.findIndex(q => !state.answers[q.id]);
    if (firstSkippedIndex !== -1) {
      toast(t.toasts.missedQ, { icon: '📝' });
      setState(p => ({ ...p, currentQuestionIndex: firstSkippedIndex }));
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    if (!user) return;
    
    const userId = user.uid;

    localStorage.removeItem(STORAGE_KEY); 

    let correctCount = 0;
    state.questions.forEach(q => {
      if (state.answers[q.id] === q.answer) correctCount++;
    });

    try {
      const attemptDocId = `${userId}_${assignmentId}`;
      const attemptRef = doc(db, 'attempts', attemptDocId);
      const attemptData = {
        userId: userId,
        userName: user.displayName,
        classId,
        assignmentId,
        testId: state.assignment.testId,
        testTitle: state.test.title,
        score: correctCount,
        totalQuestions: state.questions.length,
        answers: state.answers, 
        tabSwitches: state.tabSwitchCount, 
        submittedAt: serverTimestamp(),
        attemptsTaken: increment(1) 
      };

      await setDoc(attemptRef, attemptData, { merge: true });

      const assignmentRef = doc(db, 'classes', classId, 'assignments', assignmentId);
      try {
        await updateDoc(assignmentRef, { completedBy: arrayUnion(userId) });
      } catch (err) { console.warn(err); }

      if (state.assignment.teacherId) {
        sendNotification(state.assignment.teacherId, 'submission', 'New Submission', `${user.displayName} finished: ${state.test.title}`, `/teacher/classes/${classId}`);
      }

      setState(prev => ({ ...prev, status: 'submitted', score: correctCount }));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      toast.success(t.toasts.success);

    } catch (e) {
        console.error(e);
        toast.error(t.toasts.fail);
    }
  };

  // --- RENDERERS ---

  if (state.status === 'loading') return <div className="flex h-screen items-center justify-center bg-slate-50 text-indigo-600 gap-3"><Loader2 className="animate-spin" size={32} /><span className="font-bold">{t.loading}</span></div>;
  if (state.status === 'error') return <div className="flex h-screen items-center justify-center flex-col gap-4"><AlertTriangle size={48} className="text-red-500" /><h1 className="text-xl font-bold">{t.error}</h1><button onClick={() => router.back()} className="text-indigo-600 hover:underline">{t.back}</button></div>;

  if (state.status === 'lobby') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce"><Clock size={40} /></div>
        <div><h1 className="text-3xl font-black text-slate-900 mb-2">{state.test.title}</h1><p className="text-slate-500 font-medium">{state.questions.length} {t.lobby.questions} • {state.test.duration || 60} {t.lobby.minutes}</p></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left flex gap-3"><AlertCircle className="text-yellow-600 shrink-0" size={24} /><div className="text-sm text-yellow-800"><p className="font-bold mb-1">{t.lobby.instructions}</p><ul className="list-disc list-inside space-y-1 opacity-90"><li>{t.lobby.rule1}</li><li>{t.lobby.rule2}</li><li>{t.lobby.rule3}</li></ul></div></div>
        <button onClick={startTest} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all">{t.lobby.startBtn}</button>
        <button onClick={() => router.back()} className="text-slate-400 font-bold text-sm hover:text-slate-600">{t.lobby.cancel}</button>
      </div>
    </div>
  );

  if (state.status === 'submitted') {
    const visibility = state.test.resultsVisibility || (state.test.showResults ? 'always' : 'never');
    let canShow = visibility === 'always' || (visibility === 'after_due' && isPastDeadline(state.assignment.dueAt));
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm"><CheckCircle size={40} /></div>
          <div><h1 className="text-3xl font-black text-slate-900 mb-2">{t.result.submitted}</h1><p className="text-slate-500 font-medium">{t.result.saved}</p></div>
          {canShow ? (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl animate-in fade-in">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{t.result.score}</p>
               <p className="text-3xl font-black text-indigo-600 mb-3">{state.score} <span className="text-lg text-slate-400">/ {state.questions.length}</span></p>
               <button onClick={() => router.push(`/classes/${classId}/test/${assignmentId}/results`)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"><Eye size={18} /> {t.actions.viewResults}</button>
            </div>
          ) : <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl text-yellow-800 text-sm font-medium flex items-start gap-3 text-left"><Lock size={20} className="shrink-0 mt-0.5" /><p>{t.result.hidden}</p></div>}
          <button onClick={() => router.push(`/classes/${classId}`)} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">{t.actions.returnClass}</button>
        </div>
      </div>
    );
  }

  const currentQ = state.questions[state.currentQuestionIndex];
  const isFlagged = state.flagged.includes(currentQ.id);
  const answeredCount = Object.keys(state.answers).length;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none relative">
      
      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Flag size={32} /></div>
              <h2 className="text-xl font-black text-slate-900">{t.modal.title}</h2>
              <p className="text-slate-500 mt-2 text-sm">{t.modal.answered} <strong className="text-slate-900">{answeredCount}</strong> / <strong className="text-slate-900">{state.questions.length}</strong></p>
              {answeredCount < state.questions.length && <p className="text-orange-600 font-bold text-xs mt-3 bg-orange-50 py-1 px-3 rounded-full inline-block">⚠️ {t.modal.unanswered}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">{t.modal.back}</button>
              <button onClick={handleSubmit} className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">{t.actions.submit}</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 bg-slate-50 shrink-0">
        <div className="font-black text-slate-700 flex items-center gap-3">
          <span className="text-sm md:text-base">{t.header.question} {state.currentQuestionIndex + 1} <span className="text-slate-400 font-medium">/ {state.questions.length}</span></span>
          {state.tabSwitchCount > 0 && <div className="flex items-center gap-1.5 bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded-full animate-pulse"><AlertCircle size={12} /><span className="text-[10px] md:text-xs font-bold">{t.header.focus}: {state.tabSwitchCount}</span></div>}
        </div>
        <div className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full font-mono font-bold border transition-colors text-sm md:text-base ${state.timeRemaining < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-700 border-slate-200'}`}>
          <Clock size={16} />{formatTime(state.timeRemaining)}
        </div>
        <div className="hidden md:flex gap-2"><button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">{isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button></div>
      </header>

      {/* NAVIGATION BAR (TOP) */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm z-10 shrink-0">
         <div ref={scrollNavRef} className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 px-1">
            {state.questions.map((q, idx) => {
                const isActive = idx === state.currentQuestionIndex;
                const isAnswered = !!state.answers[q.id];
                const isQFlagged = state.flagged.includes(q.id);
                return (
                    <button 
                        key={idx} 
                        onClick={() => setState(p => ({...p, currentQuestionIndex: idx}))} 
                        className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : isQFlagged ? 'bg-orange-50 text-orange-600 border-orange-300' : isAnswered ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                        {isQFlagged ? <Flag size={14} fill="currentColor"/> : idx + 1}
                    </button>
                )
            })}
         </div>
      </div>

      {/* QUESTION AREA */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6 md:mb-8">
             <div className="text-lg md:text-2xl font-medium text-slate-800 leading-relaxed bg-white"><LatexRenderer latex={getContentText(currentQ.question)} /></div>
          </div>
          <div className="grid gap-3">
             {Object.entries(currentQ.options || {}).map(([key, val]: any) => {
               const isSelected = state.answers[currentQ.id] === key;
               return (
                 <button key={key} onClick={() => selectAnswer(key)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group active:scale-[0.99] ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                   <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{key}</span>
                   <div className="text-slate-700 font-medium text-sm md:text-base leading-relaxed break-words w-full"><LatexRenderer latex={getContentText(val)} /></div>
                 </button>
               )
             })}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-auto min-h-[80px] border-t border-slate-200 bg-white px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
         <div className="flex w-full md:w-auto gap-3">
           <button onClick={toggleFlag} className={`flex-1 md:flex-none py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-colors ${isFlagged ? 'bg-orange-50 border-orange-200 text-orange-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Flag size={18} fill={isFlagged ? "currentColor" : "none"} /><span className="hidden md:inline">{isFlagged ? t.actions.flagged : t.actions.flag}</span></button>
           <button onClick={() => setState(p => ({...p, currentQuestionIndex: Math.max(0, p.currentQuestionIndex - 1)}))} disabled={state.currentQuestionIndex === 0} className="flex-1 md:flex-none py-3 px-6 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"><ChevronLeft size={20} className="md:hidden"/> <span className="hidden md:inline">{t.actions.prev}</span></button>
           <button onClick={handleNextOrFinish} className={`flex-[2] md:flex-none px-8 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${state.currentQuestionIndex < state.questions.length - 1 ? 'bg-slate-900 hover:bg-black' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>{state.currentQuestionIndex < state.questions.length - 1 ? <>{t.actions.next} <ChevronRight size={18} /></> : t.actions.finish}</button>
         </div>
      </footer>
    </div>
  );
}