'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getUserHistory, fetchReviewQuestions, QuizAttempt } from '@/services/historyService';
import { Question } from '@/types';
import { 
  Calendar, CheckCircle, XCircle, BookOpen, Lightbulb, 
  RefreshCw, Clock, ArrowLeft, BarChart2, Zap, Sparkles, TrendingUp, Award
} from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- FOCUSED REVIEW STATE ---
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [openSolutionId, setOpenSolutionId] = useState<string | null>(null);

  // Load History List
  useEffect(() => {
    if (user) {
      getUserHistory(user.uid).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [user]);

  // Handle Opening an Attempt
  const handleOpenAttempt = async (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    setLoadingReview(true);

    const mistakes = attempt.results.filter(r => !r.isCorrect);
    const fullQuestions = await fetchReviewQuestions(mistakes);
    setReviewQuestions(fullQuestions);
    setLoadingReview(false);
  };

  const handleCloseReview = () => {
    setSelectedAttempt(null);
    setReviewQuestions([]);
    setOpenSolutionId(null);
  };

  // --- RENDER: LOADING ---
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-semibold">Loading your history...</p>
      </div>
    </div>
  );

  // --- RENDER: FOCUSED REVIEW MODE ---
  if (selectedAttempt) {
    const scorePercent = Math.round((selectedAttempt.correctCount / selectedAttempt.totalQuestions) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto pb-20 p-4 md:p-6">
          {/* Header / Back Button */}
          <button 
            onClick={handleCloseReview}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-bold transition-all hover:-translate-x-1 px-3 py-2 rounded-xl hover:bg-white/50 animate-in fade-in slide-in-from-left duration-500"
          >
            <ArrowLeft size={20} /> Back to History
          </button>

          {/* Summary Card - Enhanced */}
          <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-xl border-2 border-blue-100 mb-8 relative overflow-hidden group animate-in fade-in slide-in-from-top duration-700">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{selectedAttempt.subtopicName}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-blue-500" /> 
                    {new Date(selectedAttempt.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={16} className="text-blue-500" /> 
                    {new Date(selectedAttempt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-black text-sm shadow-lg flex items-center gap-2">
                  <Zap size={16} />
                  +{selectedAttempt.score} XP
                </div>
                <div className={`px-5 py-3 rounded-xl font-black text-sm shadow-lg ${
                  scorePercent >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 
                  'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                }`}>
                  {scorePercent}% Score
                </div>
              </div>
            </div>
          </div>

          {/* Review List - Enhanced */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-xl">
                <XCircle className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900">Review Your Mistakes</h2>
            </div>

            {loadingReview ? (
              <div className="p-16 text-center bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-slate-200">
                <RefreshCw className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
                <p className="text-slate-600 font-semibold">Loading questions...</p>
              </div>
            ) : reviewQuestions.length === 0 ? (
              <div className="p-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl text-center border-2 border-green-200 shadow-lg animate-in zoom-in-95 duration-500">
                <Award className="text-green-600 mx-auto mb-4" size={48} />
                <h3 className="text-2xl font-black text-green-700 mb-2">🎉 Perfect Score!</h3>
                <p className="text-green-600 font-semibold">No mistakes to review. You're doing amazing!</p>
              </div>
            ) : (
              reviewQuestions.map((q, idx) => {
                const userResult = selectedAttempt.results.find(r => r.questionId === q.id);
                const userAnsKey = userResult?.userAnswer as keyof typeof q.options;
                const correctAnsKey = q.answer as keyof typeof q.options;
                
                const userText = q.options[userAnsKey]?.uz || "Unknown";
                const correctText = q.options[correctAnsKey]?.uz || "Unknown";
                
                const isSolutionOpen = openSolutionId === q.id;

                return (
                  <div key={q.id} className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-red-100 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Question Header */}
                    <div className="p-6 md:p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                      <div className="flex items-start gap-4">
                        <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white font-black text-sm px-3 py-1.5 rounded-xl mt-1 shadow-md">
                          Q{idx+1}
                        </span>
                        <div className="text-slate-800 font-semibold text-lg leading-relaxed flex-1">
                          <LatexRenderer latex={q.question.uz} />
                        </div>
                      </div>
                    </div>

                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-slate-100">
                      <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50">
                        <span className="block text-xs font-black text-red-500 uppercase mb-3 flex items-center gap-2">
                          <XCircle size={14} />
                          Your Answer ({userAnsKey})
                        </span>
                        <div className="text-red-900 font-semibold bg-white/50 p-4 rounded-xl border-2 border-red-200">
                          <LatexRenderer latex={userText} />
                        </div>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                        <span className="block text-xs font-black text-green-600 uppercase mb-3 flex items-center gap-2">
                          <CheckCircle size={14} />
                          Correct Answer ({correctAnsKey})
                        </span>
                        <div className="text-green-900 font-semibold bg-white/50 p-4 rounded-xl border-2 border-green-200">
                          <LatexRenderer latex={correctText} />
                        </div>
                      </div>
                    </div>

                    {/* Solution Toggle */}
                    <div className="p-6 bg-slate-50 border-t-2 border-slate-100">
                      <button 
                        onClick={() => setOpenSolutionId(isSolutionOpen ? null : q.id)}
                        className="w-full py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-blue-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white hover:border-transparent transition-all shadow-sm hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <Lightbulb size={18} /> 
                        {isSolutionOpen ? 'Hide Solution' : 'View Step-by-Step Solution'}
                      </button>

                      {isSolutionOpen && (
                        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                          {q.solutions && q.solutions.length > 0 ? (
                            <div className="space-y-4 pl-4 border-l-4 border-blue-400 ml-2 bg-blue-50/50 p-4 rounded-r-xl">
                              {q.solutions[0].steps.map((step, sIdx) => (
                                <div key={sIdx} className="text-slate-700 text-sm font-medium">
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white font-black rounded-full mr-3 text-xs">
                                    {sIdx + 1}
                                  </span>
                                  <span className="leading-relaxed"><LatexRenderer latex={step} /></span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-700 bg-blue-50/50 p-4 rounded-xl border-2 border-blue-200 font-medium">
                              <LatexRenderer latex={typeof q.explanation === 'object' ? q.explanation.uz : q.explanation} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: HISTORY LIST ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto space-y-6 pb-24 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <BookOpen className="text-white" size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">My Activity</h1>
        </div>

        {/* History Cards */}
        <div className="space-y-4">
          {history.map((item, idx) => {
            const scorePercent = Math.round((item.correctCount / item.totalQuestions) * 100);
            
            const diffColors = {
              easy: 'text-green-600 bg-green-100 border-green-300',
              medium: 'text-yellow-600 bg-yellow-100 border-yellow-300',
              hard: 'text-red-600 bg-red-100 border-red-300'
            };
            
            const difficulty = item.difficulty || 'easy';
            const diffClass = diffColors[difficulty];

            return (
              <button 
                key={item.id}
                onClick={() => handleOpenAttempt(item)}
                className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1 transition-all text-left group animate-in fade-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-xl group-hover:text-blue-600 transition-colors mb-2">
                      {item.subtopicName}
                    </h3>
                    <div className="text-xs text-slate-500 font-semibold flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-500" /> 
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-500" />
                        {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                  
                  {/* Score Badge */}
                  <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-black text-base shadow-lg ${
                    scorePercent >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' : 
                    scorePercent >= 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' : 
                    'bg-gradient-to-br from-red-500 to-rose-500 text-white'
                  }`}>
                    {scorePercent}%
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-100">
                  <div className={`text-xs font-black px-3 py-1.5 rounded-lg border-2 capitalize shadow-sm ${diffClass}`}>
                    {difficulty}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-yellow-50 px-3 py-1.5 rounded-lg border-2 border-yellow-200 shadow-sm">
                    <Zap size={14} className="text-yellow-600" /> {item.score} XP
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border-2 border-blue-200 shadow-sm ml-auto">
                    <BarChart2 size={14} className="text-blue-600" /> 
                    {item.correctCount}/{item.totalQuestions}
                  </div>
                </div>
              </button>
            );
          })}

          {history.length === 0 && (
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-slate-200 shadow-lg">
              <BookOpen className="text-slate-300 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-400 mb-2">No history yet</h3>
              <p className="text-slate-500 font-medium">Start practicing to build your learning journey!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}