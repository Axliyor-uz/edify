'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // 👈 Added useSearchParams
import { getIdsFromSubtopicName, PathIds } from '@/lib/api';
import { fetchQuestions } from '@/services/quizService';
import { updateUserStats } from '@/services/userService';
import { saveAttempt } from '@/services/historyService'; 
import { useAuth } from '@/lib/AuthContext';
import { doc, setDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import LatexRenderer from '@/components/LatexRenderer';
import { 
  ArrowRight, ArrowLeft, CheckCircle, XCircle, Trophy, 
  RefreshCw, Settings, Play, Target, BarChart, 
  BookOpen, Lightbulb, ChevronDown, ChevronUp,
  Bookmark, Clock, Hash, Flag, Sparkles, Zap, RotateCcw
} from 'lucide-react';
import { Question } from '@/types';

const DIFF_NUM_MAP = { easy: 1, medium: 2, hard: 3 };
const XP_TABLE = { easy: 10, medium: 20, hard: 30 };
const TIME_PER_QUESTION = { easy: 60, medium: 120, hard: 180 };

export default function PracticePage({ params }: { params: Promise<{ subtopicId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams(); // 👈 Hook to read ?retry=...
  const { user } = useAuth();
  
  const resolvedParams = use(params); 
  const subtopicName = decodeURIComponent(resolvedParams.subtopicId);

  // --- RETRY LOGIC STATE ---
  const retryIdsParam = searchParams.get('retry');
  const isRetryMode = !!retryIdsParam;

  const [setupComplete, setSetupComplete] = useState(false);
  const [targetCount, setTargetCount] = useState(10); 
  const [initialDiff, setInitialDiff] = useState<'easy'|'medium'|'hard'>('easy');

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pathIds, setPathIds] = useState<PathIds | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [totalTimeLeft, setTotalTimeLeft] = useState<number>(0); 
  const [timerActive, setTimerActive] = useState(false);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [showReview, setShowReview] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState({ xp: 0, correct: 0, accuracy: 0 });

  // 1. AUTO-START IF RETRY MODE
  useEffect(() => {
    if (isRetryMode && !setupComplete) {
      initRetrySession();
    }
  }, [isRetryMode]);

  async function initRetrySession() {
    setLoading(true);
    const ids = getIdsFromSubtopicName(subtopicName);
    setPathIds(ids);

    if (!ids.found || !retryIdsParam) {
      setLoading(false);
      return;
    }

    const targetIds = retryIdsParam.split(',');

    // Fetch ALL difficulties to find specific questions (since we don't know their original level)
    // This ensures we find the question regardless of where it lives
    const [easyQ, mediumQ, hardQ] = await Promise.all([
      fetchQuestions(ids, 'easy'),
      fetchQuestions(ids, 'medium'),
      fetchQuestions(ids, 'hard')
    ]);

    const allQuestions = [...easyQ, ...mediumQ, ...hardQ];
    // Filter to get only the requested IDs
    const retryQuestions = allQuestions.filter(q => targetIds.includes(q.id));

    if (retryQuestions.length === 0) {
      alert("Error: Questions not found.");
      router.push('/dashboard');
      return;
    }

    // Start Quiz immediately
    setQuestions(retryQuestions);
    setTargetCount(retryQuestions.length);
    setTotalTimeLeft(retryQuestions.length * 180); // Generous time for retry
    setSetupComplete(true);
    setTimerActive(true);
    setLoading(false);
  }

  // --- NORMAL START ---
  async function startQuiz() {
    setSetupComplete(true);
    setLoading(true);
    
    const ids = getIdsFromSubtopicName(subtopicName);
    setPathIds(ids); 
    
    if (!ids.found) {
      console.error(`❌ Topic not found`);
      setLoading(false);
      return;
    }

    let fetchedQuestions = await fetchQuestions(ids, initialDiff);
    fetchedQuestions = fetchedQuestions.sort(() => Math.random() - 0.5);
    const finalQuestions = fetchedQuestions.slice(0, targetCount);
    
    setQuestions(finalQuestions);
    setTotalTimeLeft(finalQuestions.length * TIME_PER_QUESTION[initialDiff]);
    setTimerActive(true);
    setLoading(false);
  }

  useEffect(() => {
    if (!timerActive || isFinished) return;

    const timer = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, isFinished]);

  const handleSubmitExam = async (isTimeOut = false) => {
    setTimerActive(false);
    setIsFinished(true);

    let correct = 0;
    let xp = 0;
    const resultsLog: any[] = [];
    const diffNum = DIFF_NUM_MAP[initialDiff];

    questions.forEach(q => {
      const uAns = userAnswers[q.id];
      const isCorrect = uAns === q.answer;
      
      if (isCorrect) {
        correct++;
        // If in Retry Mode, usually give less XP, but keeping your logic simple:
        xp += isRetryMode ? 10 : XP_TABLE[initialDiff]; 
      }

      let qPath = "";
      if (pathIds) {
          qPath = `/questions/01/t/${pathIds.topicId}/c/${pathIds.chapterId}/s/${pathIds.subtopicId}/d/${diffNum}/q/${q.id}`;
      }

      resultsLog.push({
        questionId: q.id,
        isCorrect: isCorrect,
        userAnswer: uAns || (isTimeOut ? "TIMEOUT" : "SKIPPED"),
        correctAnswer: q.answer,
        timeSpent: 0, 
        questionPath: qPath
      });
    });

    setScoreData({
      xp,
      correct,
      accuracy: Math.round((correct / questions.length) * 100)
    });

    // Auto-show review if retrying
    if (isRetryMode) setShowReview(true);

    if (user && pathIds) {
      setIsSaving(true);
      try {
        if (xp > 0) {
          await updateUserStats(user.uid, xp, {
            topicId: pathIds.topicId,
            chapterId: pathIds.chapterId,
            subtopicId: pathIds.subtopicId
          });
        }
        await saveAttempt({
          userId: user.uid,
          subtopicName: subtopicName + (isRetryMode ? " (Retry)" : ""),
          date: new Date().toISOString(),
          score: xp,
          totalQuestions: questions.length,
          correctCount: correct,
          difficulty: isRetryMode ? 'medium' : initialDiff,
          results: resultsLog
        });
        console.log("✅ Exam Saved!");
      } catch (e) {
        console.error("Save failed", e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleOptionSelect = (optionKey: string) => {
    if (isFinished) return;
    setUserAnswers(prev => ({
      ...prev,
      [questions[currentIndex].id]: optionKey
    }));
  };

  // Helper to trigger retry from results page
  const handleRetryMistakes = () => {
    const wrongIds = questions
      .filter(q => userAnswers[q.id] !== q.answer)
      .map(q => q.id)
      .join(',');
    
    // Redirect to same page with retry params (forces reload)
    window.location.href = `/practice/${resolvedParams.subtopicId}?retry=${wrongIds}`;
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleBookmark = async (qId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(qId);
    const newSet = new Set(bookmarkedIds);
    const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, qId);
    
    if (isBookmarked) newSet.delete(qId);
    else newSet.add(qId);
    setBookmarkedIds(newSet);

    try {
        if (isBookmarked) await deleteDoc(bookmarkRef);
        else await setDoc(bookmarkRef, { questionId: qId, path: pathIds, savedAt: new Date().toISOString() });
    } catch (e) { console.error(e); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER: SETUP ---
  if (!setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 pt-20">
        <div className="bg-white/80 backdrop-blur-sm max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-100 animate-in zoom-in-95 duration-500">
          {/* ... Existing Setup UI ... */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Settings className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black mb-2">Exam Setup</h1>
              <p className="text-blue-100 font-semibold">{subtopicName}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            <div>
              <label className="text-sm font-black text-slate-700 uppercase mb-4 block flex items-center gap-2">
                <Hash size={16} className="text-blue-500" />
                Question Count
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map(num => (
                  <button 
                    key={num} 
                    onClick={() => setTargetCount(num)} 
                    className={`py-3 rounded-xl font-black border-2 transition-all transform hover:scale-105 ${
                      targetCount === num 
                        ? 'border-blue-600 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200' 
                        : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-black text-slate-700 uppercase mb-4 block flex items-center gap-2">
                <Target size={16} className="text-blue-500" />
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { level: 'easy', label: 'Easy', color: 'green' },
                  { level: 'medium', label: 'Medium', color: 'yellow' },
                  { level: 'hard', label: 'Hard', color: 'red' }
                ].map(({ level, label, color }) => (
                  <button 
                    key={level} 
                    onClick={() => setInitialDiff(level as any)} 
                    className={`py-3 rounded-xl font-black border-2 transition-all transform hover:scale-105 ${
                      initialDiff === level 
                        ? `border-${color}-600 bg-${color}-50 text-${color}-700 shadow-lg` 
                        : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={startQuiz} 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
            >
              Start Exam <Play size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-semibold">{isRetryMode ? "Loading mistakes..." : "Loading exam..."}</p>
      </div>
    </div>
  );

  // --- RENDER: RESULTS ---
  if (isFinished) {
    const wrongCount = questions.length - scoreData.correct;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8 pt-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-2xl border-2 border-blue-100 text-center mb-8 relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-10 rounded-full blur-3xl"></div>
            
            {!showReview && (
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Trophy className="text-white w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-3">{isRetryMode ? "Retry Complete!" : "Exam Complete!"} 🎉</h2>
                
                {/* 📊 NEW: Detailed Results Info */}
                <div className="mb-6">
                    <span className="text-2xl font-bold text-slate-700">
                        You scored: <span className="text-blue-600">{scoreData.correct}/{questions.length}</span>
                    </span>
                    <span className="block text-slate-500 font-semibold mt-1">
                        ({scoreData.accuracy}% Accuracy)
                    </span>
                </div>

                <p className="text-slate-600 font-semibold mb-8">
                  {isSaving ? "Saving your results..." : "Your results have been saved"}
                </p>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl mb-8 grid grid-cols-2 gap-6 border-2 border-blue-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="text-blue-500" size={20} />
                      <span className="text-slate-500 text-sm font-bold uppercase tracking-wide">XP Earned</span>
                    </div>
                    <span className="block text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      +{scoreData.xp}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="text-green-500" size={20} />
                      <span className="text-slate-500 text-sm font-bold uppercase tracking-wide">Accuracy</span>
                    </div>
                    <div className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {scoreData.accuracy}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showReview && (
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Answer Review</h2>
                <p className="text-slate-600 font-semibold">Check your answers below</p>
              </div>
            )}

            <div className="space-y-3 relative z-10">
              
              {/* ⚡ NEW BUTTON 1: RETRY MISTAKES */}
              {wrongCount > 0 && !showReview && (
                  <button 
                    onClick={handleRetryMistakes}
                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all transform hover:scale-[1.02]"
                  >
                    <RotateCcw size={20} /> ⚡ Retry Missed Questions ({wrongCount})
                  </button>
              )}

              {/* 📖 BUTTON 2: REVIEW ANSWERS */}
              <button 
                onClick={() => setShowReview(!showReview)} 
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <BookOpen size={20} /> {showReview ? 'Hide Review' : 'Review Answers'}
              </button>
              
              <button 
                onClick={() => router.push('/dashboard')} 
                className="w-full py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* REVIEW LIST */}
          {showReview && (
             <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
               {questions.map((q, idx) => {
                 const uAns = userAnswers[q.id];
                 const isCorrect = uAns === q.answer;
                 const isExpanded = expandedReviewId === q.id;
                 
                 return (
                   <div key={q.id} className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 overflow-hidden shadow-lg hover:shadow-xl transition-all ${
                     isCorrect ? 'border-green-200' : 'border-red-200'
                   }`}>
                     <button 
                       onClick={() => setExpandedReviewId(isExpanded ? null : q.id)} 
                       className="w-full p-6 text-left flex items-start justify-between hover:bg-slate-50 transition-all"
                     >
                       <div className="flex gap-4 flex-1">
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md ${
                           isCorrect ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-rose-500'
                         }`}>
                           {idx + 1}
                         </div>
                         <div className="flex-1">
                            <div className="text-slate-800 font-semibold mb-2 text-lg"><LatexRenderer latex={q.question.uz} /></div>
                            <div className="text-sm flex items-center gap-2">
                               {isCorrect ? (
                                 <span className="flex items-center gap-1.5 text-green-600 font-black bg-green-50 px-3 py-1 rounded-lg">
                                   <CheckCircle size={14} /> Correct
                                 </span>
                               ) : (
                                 <>
                                   <span className="flex items-center gap-1.5 text-red-600 font-black bg-red-50 px-3 py-1 rounded-lg">
                                     <XCircle size={14} /> Incorrect
                                   </span>
                                   <span className="text-slate-500 font-semibold">
                                     You chose: <b className="text-red-600">{uAns || 'None'}</b>
                                   </span>
                                 </>
                               )}
                            </div>
                         </div>
                       </div>
                       <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-blue-100' : 'bg-slate-100'}`}>
                         {isExpanded ? <ChevronUp size={20} className="text-blue-600"/> : <ChevronDown size={20} className="text-slate-400"/>}
                       </div>
                     </button>
                     
                     {isExpanded && (
                       <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-t-2 border-slate-100 animate-in slide-in-from-top-2">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-5 rounded-2xl text-sm mb-5 shadow-sm">
                              <span className="flex items-center gap-2 text-green-700 font-black text-xs uppercase mb-3">
                                <CheckCircle size={16} />
                                Correct Answer ({q.answer})
                              </span>
                              <div className="text-green-900 font-semibold">
                                <LatexRenderer latex={q.options[q.answer as keyof typeof q.options]?.uz || ""} />
                              </div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm">
                             <h4 className="flex items-center gap-2 text-base font-black text-blue-600 mb-4">
                               <Lightbulb size={18} /> Explanation
                             </h4>
                             {q.solutions ? (
                               <div className="space-y-3">
                                 {q.solutions[0].steps.map((s, i) => (
                                   <div key={i} className="flex gap-3 text-sm font-medium text-slate-700">
                                     <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white font-black rounded-full text-xs shrink-0">
                                       {i + 1}
                                     </span>
                                     <span className="flex-1"><LatexRenderer latex={s} /></span>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-sm text-slate-700 font-medium">
                                 <LatexRenderer latex={typeof q.explanation === 'object' ? q.explanation.uz : q.explanation} />
                               </div>
                             )}
                          </div>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER: EXAM INTERFACE ---
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const isAllAnswered = answeredCount === questions.length;
  const isBookmarked = bookmarkedIds.has(currentQ.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-32">
        
        {/* 1. HEADER & TIMER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border-2 border-blue-100 sticky top-20 z-20 animate-in fade-in slide-in-from-top duration-500">
           <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${isRetryMode ? 'bg-orange-500' : 'bg-blue-500'}`}>
                {isRetryMode ? <RefreshCw className="text-white" size={20} /> : <BookOpen className="text-white" size={20} />}
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg block">
                    {isRetryMode ? "Retry Mode" : "Exam Mode"}
                </span>
                <span className="text-sm text-slate-500 font-semibold">{subtopicName}</span>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 font-mono font-black px-4 py-2 rounded-xl shadow-md transition-all ${
                totalTimeLeft < 60 
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-slate-100 to-blue-100 text-slate-700'
              }`}>
                  <Clock size={18} /> {formatTime(totalTimeLeft)}
              </div>
              <button 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                onClick={() => router.back()} 
                title="Exit"
              >
                <XCircle size={24} />
              </button>
           </div>
        </div>

        {/* 2. NAVIGATION GRID */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
           <div className="flex gap-2 min-w-max">
              {questions.map((_, idx) => {
                  const isAnswered = !!userAnswers[questions[idx].id];
                  const isCurrent = idx === currentIndex;
                  
                  return (
                      <button 
                          key={idx}
                          onClick={() => jumpToQuestion(idx)}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-md
                              ${isCurrent ? 'ring-4 ring-blue-400 ring-offset-2 scale-110' : ''}
                              ${isAnswered 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-blue-200' 
                                : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                              }
                          `}
                      >
                          {idx + 1}
                      </button>
                  )
              })}
           </div>
        </div>

        {/* 3. QUESTION CARD */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-blue-100 p-8 md:p-12 mb-8 relative min-h-[500px] animate-in fade-in slide-in-from-bottom duration-500">
           <button 
             onClick={() => toggleBookmark(currentQ.id)} 
             className="absolute top-6 right-6 transition-all hover:scale-110"
           >
              <Bookmark 
                size={28} 
                className={isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-slate-300 hover:text-yellow-400"} 
              />
           </button>

           <div className="flex items-center gap-3 mb-6">
             <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-sm px-4 py-2 rounded-xl shadow-lg">
               Question {currentIndex + 1} of {questions.length}
             </span>
             <span className="text-slate-500 font-semibold text-sm">
               {answeredCount} / {questions.length} Answered
             </span>
           </div>
           
           <div className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-10 pr-12">
              <LatexRenderer latex={currentQ.question.uz} />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentQ.options).map(([key, value]) => {
                  const isSelected = userAnswers[currentQ.id] === key;
                  return (
                      <button
                          key={key}
                          onClick={() => handleOptionSelect(key)}
                          className={`relative p-6 text-left border-2 rounded-2xl transition-all flex items-center gap-4 group shadow-sm hover:shadow-lg
                              ${isSelected 
                                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-blue-100 scale-[1.02]' 
                                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                              }
                          `}
                      >
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base border-2 transition-all shadow-sm
                              ${isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white shadow-blue-200' 
                                : 'bg-white border-slate-300 text-slate-600 group-hover:border-blue-400 group-hover:text-blue-600'
                              }
                          `}>
                              {key}
                          </span>
                          <div className="flex-1 font-semibold text-slate-700">
                            <LatexRenderer latex={value.uz} />
                          </div>
                          {isSelected && (
                            <CheckCircle className="text-blue-500 absolute top-4 right-4" size={20} />
                          )}
                      </button>
                  )
              })}
           </div>
        </div>

        {/* 4. FOOTER CONTROLS */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t-2 border-slate-200 p-4 md:p-6 z-30 shadow-2xl">
           <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
              
              <button 
                  onClick={prevQuestion} 
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-md ${
                    currentIndex === 0 
                      ? 'text-slate-300 bg-slate-100 cursor-not-allowed' 
                      : 'text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300'
                  }`}
              >
                  <ArrowLeft size={20} /> Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                  <button 
                      onClick={() => handleSubmitExam(false)}
                      disabled={!isAllAnswered}
                      className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white shadow-xl transition-all transform
                          ${isAllAnswered 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 shadow-green-200' 
                              : 'bg-slate-300 cursor-not-allowed'
                          }
                      `}
                  >
                      Submit Exam <Flag size={20} />
                  </button>
              ) : (
                  <button 
                      onClick={nextQuestion}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black hover:from-blue-700 hover:to-indigo-700 hover:scale-105 transition-all shadow-xl shadow-blue-200"
                  >
                      Next <ArrowRight size={20} />
                  </button>
              )}

           </div>
        </div>

      </div>
    </div>
  );
}