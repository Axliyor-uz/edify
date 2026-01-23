'use client';

import { sendNotification } from '@/services/notificationService';
import {  setDoc, increment,updateDoc,       // 👈 NEW
    arrayUnion, } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  Loader2, Clock, AlertTriangle, CheckCircle, 
  ChevronRight, AlertCircle, Flag, Eye, Maximize2, Minimize2, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import LatexRenderer from '@/components/LatexRenderer'; 

// --- HELPER: Fixes [object Object] & duplication issues ---
const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

// --- HELPER: Secure Time Check (Simple version for UI) ---
const isPastDeadline = (dueAt: any) => {
  if (!dueAt) return true; // No deadline = Always passed
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
}

export default function TestRunnerPage() {
  const { classId, assignmentId } = useParams() as { classId: string; assignmentId: string };
  const { user } = useAuth();
  const router = useRouter();

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 🆕 NEW STATE: For the Custom Submit Card
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        // 1. Fetch Assignment
        const assignRef = doc(db, 'classes', classId, 'assignments', assignmentId);
        const assignSnap = await getDoc(assignRef);
        if (!assignSnap.exists()) throw new Error("Assignment not found");
        const assignData = assignSnap.data();

        // 2. Check Deadline
        if (assignData.dueAt) {
          const now = new Date();
          const due = new Date(assignData.dueAt.seconds * 1000);
          if (now > due) {
            toast.error("The deadline for this test has passed.");
            router.push(`/classes/${classId}`); // Kick them out
            return;
          }
        }

        // 3. Check Attempts Limit (NEW SECURITY FEATURE)
        const limit = assignData.allowedAttempts ?? 1; // Default to 1 if not set
        if (limit !== 0) { // 0 means unlimited
          const attemptsQ = query(
            collection(db, 'attempts'), 
            where('assignmentId', '==', assignmentId),
            where('userId', '==', user.uid)
          );
          const attemptsSnap = await getDocs(attemptsQ);
          if (attemptsSnap.size >= limit) {
            toast.error(`You have used all ${limit} allowed attempts.`);
            router.push(`/classes/${classId}/test/${assignmentId}/results`); // Go to results
            return;
          }
        }

        // 4. Fetch Test Content
        const testRef = doc(db, 'custom_tests', assignData.testId);
        const testSnap = await getDoc(testRef);
        if (!testSnap.exists()) throw new Error("Test data not found");
        const testData = testSnap.data();

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
        toast.error("Failed to load test.");
        setState(prev => ({ ...prev, status: 'error' }));
      }
    }
    loadData();
  }, [classId, assignmentId, user, router]);

  // --- TIMER ---
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

  // --- SECURITY (App & Tab Switching) ---
  useEffect(() => {
    if (state.status !== 'taking') return;

    // 🛑 Prevent counting if the modal is open
    if (showSubmitModal) return; 

    const handleFocusLoss = () => {
      if (showSubmitModal) return;
      setState(prev => ({ ...prev, tabSwitchCount: prev.tabSwitchCount + 1 }));
      toast("Warning: Focus lost! Activity recorded.", { icon: '⚠️' });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleFocusLoss();
    };

    const handleWindowBlur = () => {
      handleFocusLoss();
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [state.status, showSubmitModal]); 

  // --- ACTIONS ---
  const startTest = () => {
    toggleFullscreen();
    setState(prev => ({ ...prev, status: 'taking' }));
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

  const selectAnswer = (optionKey: string) => {
    const currentQ = state.questions[state.currentQuestionIndex];
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQ.id]: optionKey }
    }));
  };

  const toggleFlag = () => {
    const currentQ = state.questions[state.currentQuestionIndex];
    setState(prev => {
      const isFlagged = prev.flagged.includes(currentQ.id);
      return {
        ...prev,
        flagged: isFlagged 
          ? prev.flagged.filter(id => id !== currentQ.id)
          : [...prev.flagged, currentQ.id]
      };
    });
  };

  const handleAutoSubmit = () => {
    toast("Time is up! Submitting...", { icon: '⏰' });
    handleSubmit();
  };

 // Import 'setDoc' and 'increment'


 const handleSubmit = async () => {
    // Close modal immediately
    setShowSubmitModal(false);
    
    if (!user) return;
    
    // 1. Calculate Score
    let correctCount = 0;
    state.questions.forEach(q => {
      if (state.answers[q.id] === q.answer) correctCount++;
    });

    try {
      // 2. Create a Deterministic ID
      const attemptDocId = `${user.uid}_${assignmentId}`;
      const attemptRef = doc(db, 'attempts', attemptDocId);

      // 3. Prepare the Data
      const attemptData = {
        userId: user.uid,
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

      // 4. Save Attempt
      await setDoc(attemptRef, attemptData, { merge: true });

      // 5. Update Assignment Stats
      const assignmentRef = doc(db, 'classes', classId, 'assignments', assignmentId);
      try {
        await updateDoc(assignmentRef, {
          completedBy: arrayUnion(user.uid)
        });
      } catch (statsErr) {
        console.warn("Could not update assignment stats:", statsErr);
      }

      // 🔔 6. NEW: SEND NOTIFICATION TO TEACHER
      // We don't await this so it doesn't block the UI
      if (state.assignment.teacherId) {
        sendNotification(
          state.assignment.teacherId, // Send to the Teacher
          'submission',               // Type
          'New Test Submission',      // Title
          `${user.displayName} just finished: ${state.test.title}`, // Message
          `/teacher/classes/${classId}` // Link for teacher to click
        );
      }

      // 7. Finalize UI
      setState(prev => ({ ...prev, status: 'submitted', score: correctCount }));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      toast.success("Test Submitted Successfully!");

    } catch (e: any) {
        console.error("Submission Error:", e);
        if (e.code === 'permission-denied') {
          toast.error("Submission Rejected: The deadline has passed.");
        } else {
          toast.error("Submission failed. Please check your connection.");
        }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDERERS ---

  if (state.status === 'loading') return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-indigo-600 gap-3">
      <Loader2 className="animate-spin" size={32} />
      <span className="font-bold">Loading Test Environment...</span>
    </div>
  );

  if (state.status === 'error') return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <AlertTriangle size={48} className="text-red-500" />
      <h1 className="text-xl font-bold">Unable to load test</h1>
      <button onClick={() => router.back()} className="text-indigo-600 hover:underline">Go Back</button>
    </div>
  );

  // 1️⃣ LOBBY SCREEN
  if (state.status === 'lobby') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
          <Clock size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">{state.test.title}</h1>
          <p className="text-slate-500 font-medium">{state.questions.length} Questions • {state.test.duration || 60} Minutes</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left flex gap-3">
          <AlertCircle className="text-yellow-600 shrink-0" size={24} />
          <div className="text-sm text-yellow-800">
            <p className="font-bold mb-1">Important Instructions:</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Once you start, the timer <strong>cannot be paused</strong>.</li>
              <li>Do not refresh the page.</li>
              <li>Tab switching is monitored.</li>
            </ul>
          </div>
        </div>
        <button onClick={startTest} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all">Start Test Now</button>
        <button onClick={() => router.back()} className="text-slate-400 font-bold text-sm hover:text-slate-600">Cancel & Go Back</button>
      </div>
    </div>
  );

  // 2️⃣ SUBMITTED SCREEN (SECURITY UPDATE)
  if (state.status === 'submitted') {
    
    // --- DETERMINE VISIBILITY ---
    // If 'resultsVisibility' is missing (old tests), fallback to 'showResults' boolean
    // If even that is missing, default to 'never' (safest option)
    const visibility = state.test.resultsVisibility || (state.test.showResults ? 'always' : 'never');
    
    let canShow = false;
    let message = "";

    if (visibility === 'always') {
      canShow = true;
    } else if (visibility === 'never') {
      canShow = false;
      message = "The teacher has hidden the detailed results for this test.";
    } else if (visibility === 'after_due') {
      if (isPastDeadline(state.assignment.dueAt)) {
        canShow = true;
      } else {
        canShow = false;
        // Format date nice
        const date = state.assignment.dueAt ? new Date(state.assignment.dueAt.seconds * 1000).toLocaleDateString() : 'the deadline';
        message = `Results will be available after ${date}.`;
      }
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm"><CheckCircle size={40} /></div>
          
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Test Submitted!</h1>
            <p className="text-slate-500 font-medium">Your answers have been securely recorded.</p>
          </div>
          
          {/* CONDITIONALLY RENDER SCORE & BUTTON */}
          {canShow ? (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl animate-in fade-in">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Your Score</p>
               <p className="text-3xl font-black text-indigo-600 mb-3">
                 {state.score} <span className="text-lg text-slate-400">/ {state.questions.length}</span>
               </p>
               <button onClick={() => router.push(`/classes/${classId}/test/${assignmentId}/results`)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"><Eye size={18} /> View Detailed Results</button>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl text-yellow-800 text-sm font-medium flex items-start gap-3 text-left">
               <Lock size={20} className="shrink-0 mt-0.5" />
               <p>{message || "Detailed results are currently hidden."}</p>
            </div>
          )}
          
          <button onClick={() => router.push(`/classes/${classId}`)} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Return to Class</button>
        </div>
      </div>
    );
  }

  // 3️⃣ TAKING INTERFACE
  const currentQ = state.questions[state.currentQuestionIndex];
  const isFlagged = state.flagged.includes(currentQ.id);
  const answeredCount = Object.keys(state.answers).length;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none relative">
      
      {/* 🔴 NEW: CUSTOM SUBMIT MODAL (Replaces window.confirm) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900">Finish Test?</h2>
              <p className="text-slate-500 mt-2 text-sm">
                You have answered <strong className="text-slate-900">{answeredCount}</strong> out of <strong className="text-slate-900">{state.questions.length}</strong> questions.
              </p>
              {Object.keys(state.answers).length < state.questions.length && (
                <p className="text-orange-600 font-bold text-xs mt-3 bg-orange-50 py-1 px-3 rounded-full inline-block">
                  ⚠️ You have skipped some questions
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={handleSubmit}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
        <div className="font-black text-slate-700 flex items-center gap-4">
          <span>Question {state.currentQuestionIndex + 1} <span className="text-slate-400 font-medium">/ {state.questions.length}</span></span>
          {/* 🔴 NEW: FOCUS LOST WARNING BUTTON */}
          {state.tabSwitchCount > 0 && (
             <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-700 px-3 py-1 rounded-full animate-pulse">
                <AlertCircle size={14} />
                <span className="text-xs font-bold">Focus Lost: {state.tabSwitchCount}</span>
             </div>
          )}
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold border transition-colors ${state.timeRemaining < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : state.timeRemaining < 300 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-700 border-slate-200'}`}>
          <Clock size={16} />{formatTime(state.timeRemaining)}
        </div>
        <div className="flex gap-2"><button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-slate-600">{isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button></div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full">
          <div className="mb-8">
             <h2 className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
               {/* FIX: Using helper to prevent duplication and object errors */}
               <LatexRenderer latex={getContentText(currentQ.question)} />
             </h2>
          </div>
          <div className="grid gap-3">
             {Object.entries(currentQ.options || {}).map(([key, val]: any) => {
               const isSelected = state.answers[currentQ.id] === key;
               return (
                 <button key={key} onClick={() => selectAnswer(key)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                   <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>{key}</span>
                   <div className="text-slate-700 font-medium">
                     {/* FIX: Using helper here too */}
                     <LatexRenderer latex={getContentText(val)} />
                   </div>
                 </button>
               )
             })}
          </div>
        </div>
      </main>

      <footer className="h-20 border-t border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
         <div className="flex gap-3">
           <button onClick={toggleFlag} className={`p-3 rounded-xl border flex items-center gap-2 font-bold text-sm transition-colors ${isFlagged ? 'bg-orange-50 border-orange-200 text-orange-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Flag size={18} fill={isFlagged ? "currentColor" : "none"} />{isFlagged ? 'Flagged' : 'Flag'}</button>
           <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-xs px-2">
              {state.questions.map((q, idx) => (
                <button key={idx} onClick={() => setState(p => ({...p, currentQuestionIndex: idx}))} className={`w-3 h-3 rounded-full transition-all ${idx === state.currentQuestionIndex ? 'bg-indigo-600 scale-125' : state.flagged.includes(q.id) ? 'bg-orange-400' : state.answers[q.id] ? 'bg-slate-400' : 'bg-slate-100 border border-slate-200'}`} title={`Question ${idx + 1}`}/>
              ))}
           </div>
         </div>
         <div className="flex gap-3">
           <button onClick={() => setState(p => ({...p, currentQuestionIndex: Math.max(0, p.currentQuestionIndex - 1)}))} disabled={state.currentQuestionIndex === 0} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
           {state.currentQuestionIndex < state.questions.length - 1 ? (
             <button onClick={() => setState(p => ({...p, currentQuestionIndex: p.currentQuestionIndex + 1}))} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center gap-2">Next <ChevronRight size={18} /></button>
           ) : (
             <button 
                onClick={() => setShowSubmitModal(true)} // 🔴 CHANGED: Open React Modal instead of Native Alert
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
             >
               Finish Test
             </button>
           )}
         </div>
      </footer>
    </div>
  );
}