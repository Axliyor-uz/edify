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

// ==================================================================================
// 1. HELPERS
// ==================================================================================

const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

// 🔒 SECURE TIME FETCHER
// Prevents students from changing local system time to view answers early
async function getSecureTime() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/ip');
    if (!response.ok) throw new Error('Time API failed');
    const data = await response.json();
    return new Date(data.datetime);
  } catch (error) {
    console.warn("Could not verify server time, falling back to local time.");
    return new Date(); // Fallback if API is down
  }
}

// ==================================================================================
// 2. COMPONENT: Question Card
// ==================================================================================
const QuestionReviewCard = ({ 
  question, 
  index, 
  studentAnswerKey 
}: { 
  question: any, 
  index: number, 
  studentAnswerKey: string | undefined 
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false); 

  const questionText = getContentText(question.question);
  const rawExplanation = question.explanation || question.solution; 
  const explanationText = getContentText(rawExplanation);
  
  const isCorrect = studentAnswerKey === question.answer;
  const isSkipped = !studentAnswerKey;
  
  const borderColor = isCorrect ? 'border-emerald-200' : isSkipped ? 'border-slate-200' : 'border-rose-200';
  const headerBg = isCorrect ? 'bg-emerald-50/60' : isSkipped ? 'bg-slate-50' : 'bg-rose-50/60';
  const badgeColor = isCorrect ? 'bg-emerald-600' : isSkipped ? 'bg-slate-400' : 'bg-rose-500';

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${borderColor}`}>
      <div className={`px-6 py-5 flex items-start gap-5 border-b ${borderColor} ${headerBg}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm text-white shadow-sm mt-0.5 ${badgeColor}`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-800 text-lg leading-relaxed">
            <LatexRenderer latex={questionText} />
          </div>
        </div>
        <div className="shrink-0">
          {isCorrect ? <CheckCircle className="text-emerald-500" size={24} /> : 
           isSkipped ? <AlertTriangle className="text-slate-400" size={24} /> : 
           <XCircle className="text-rose-500" size={24} />}
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Student Answer */}
          <div className={`rounded-xl p-4 border flex flex-col gap-2 relative overflow-hidden ${isCorrect ? 'bg-emerald-50 border-emerald-200' : isSkipped ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
             <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 ${isCorrect ? 'text-emerald-700' : isSkipped ? 'text-slate-500' : 'text-rose-700'}`}>
               {isCorrect ? <CheckCircle size={14}/> : isSkipped ? <AlertTriangle size={14}/> : <XCircle size={14}/>}
               {isSkipped ? 'You Skipped' : 'Your Answer'}
             </span>
             <div className="flex gap-3 items-center relative z-10">
                {isSkipped ? (
                   <span className="text-slate-400 italic text-sm font-medium">No option selected</span>
                ) : (
                   <>
                     <span className={`font-mono px-2.5 py-1 rounded text-sm font-bold shadow-sm ${isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                        {studentAnswerKey?.toUpperCase()}
                     </span>
                     <div className="text-slate-800 font-medium">
                       <LatexRenderer latex={getContentText(question.options[studentAnswerKey as string])} />
                     </div>
                   </>
                )}
             </div>
          </div>

          {/* Correct Answer */}
          {!isCorrect && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
               <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2 relative z-10">
                 <CheckCircle size={14} /> Correct Answer
               </span>
               <div className="flex gap-3 items-center relative z-10">
                  <span className="font-mono bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded text-sm font-bold shadow-sm">
                    {question.answer?.toUpperCase()}
                  </span>
                  <div className="text-slate-900 font-medium">
                    <LatexRenderer latex={getContentText(question.options[question.answer])} />
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 mt-4">
          <button 
            onClick={() => setShowAllOptions(!showAllOptions)}
            className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-all"
          >
            {showAllOptions ? <Eye size={14} /> : <List size={14} />}
            {showAllOptions ? 'Hide Options' : 'Show All Options'}
          </button>

          {explanationText && (
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition-all shadow-sm ${
                showExplanation 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-600'
              }`}
            >
              <Lightbulb size={14} className={showExplanation ? "fill-white" : "fill-indigo-600"} />
              {showExplanation ? 'Hide Explanation' : 'View Explanation'}
            </button>
          )}
        </div>

        {showAllOptions && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">All Options</p>
            <div className="space-y-2">
              {Object.entries(question.options || {}).map(([key, val]: any) => (
                <div key={key} className={`flex items-center gap-3 p-2 rounded-lg border ${key === question.answer ? 'bg-emerald-100/50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${key === question.answer ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {key}
                  </span>
                  <div className="text-sm text-slate-700">
                    <LatexRenderer latex={getContentText(val)} />
                  </div>
                  {key === question.answer && <CheckCircle size={14} className="text-emerald-500 ml-auto"/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {showExplanation && explanationText && (
          <div className="mt-4 p-5 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
             <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                   <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                     <Lightbulb size={14} />
                   </div>
                </div>
                <div className="space-y-1 w-full">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Step-by-Step Solution</p>
                   <div className="text-slate-700 text-sm leading-7">
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
      // Logic: Determine visibility based on 'resultsVisibility' field
      // Fallback: Use 'showResults' (legacy boolean) or default to 'never'
      const visibility = testData.resultsVisibility || (testData.showResults ? 'always' : 'never');

      if (visibility === 'always') {
        setCanViewDetails(true);
      } 
      else if (visibility === 'never') {
        setCanViewDetails(false);
        setBlockReason("The instructor has disabled detailed review for this test.");
      } 
      else if (visibility === 'after_due') {
        if (!assignment.dueAt) {
          setCanViewDetails(true); // No deadline = Always show
        } else {
          // 🛑 SECURE TIME CHECK
          const now = await getSecureTime();
          const dueDate = new Date(assignment.dueAt.seconds * 1000);
          
          if (now > dueDate) {
            setCanViewDetails(true);
          } else {
            setCanViewDetails(false);
            // Format nice date for message
            const dateStr = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const timeStr = dueDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            setBlockReason(`Results are hidden until the deadline passes: ${dateStr} at ${timeStr}`);
          }
        }
      }
      setVerifyingSecurity(false);
    };

    performSecurityCheck();
  }, [testData, assignment]);

  // --- RENDERING ---

  if (loading || verifyingSecurity) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 text-indigo-600 gap-2 font-bold">
      <Loader2 className="animate-spin" /> Verifying Access...
    </div>
  );

  if (!attempt || !testData) return null;

  // --- BLOCKED STATE UI ---
  if (!canViewDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-xl text-center border border-slate-200 animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Score Recorded</h1>
          <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Result</p>
             <p className="text-5xl font-black text-indigo-600 tracking-tight">
               {attempt.score}<span className="text-2xl text-slate-300 font-bold">/{attempt.totalQuestions}</span>
             </p>
          </div>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-yellow-800 text-sm font-medium flex items-start gap-3 text-left">
             <Clock size={20} className="shrink-0 mt-0.5" />
             <p>{blockReason}</p>
          </div>

          <button 
            onClick={() => router.push(`/classes/${classId}`)}
            className="mt-8 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- ALLOWED STATE UI ---
  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  let gradeColor = 'text-rose-600 bg-rose-50 border-rose-200';
  let gradeMessage = "Needs Improvement";
  
  if (percentage >= 80) {
    gradeColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    gradeMessage = "Excellent Work!";
  } else if (percentage >= 50) {
    gradeColor = 'text-amber-600 bg-amber-50 border-amber-200';
    gradeMessage = "Good Effort";
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
           <button onClick={() => router.push(`/classes/${classId}`)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
             <ChevronLeft size={16} /> Back
           </button>
           <h1 className="font-bold text-slate-800 hidden md:block text-lg truncate max-w-[300px]">Results: {testData.title}</h1>
           <div className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${gradeColor}`}>
             <Trophy size={12} /> {percentage}%
           </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-10 -translate-y-10 z-0" />
           <div className="text-center md:text-left relative z-10">
             <h2 className="text-3xl font-black text-slate-900 mb-1">{gradeMessage}</h2>
             <p className="text-slate-500 font-medium">You scored <strong className="text-slate-900">{attempt.score}</strong> correct out of <strong className="text-slate-900">{attempt.totalQuestions}</strong> questions.</p>
           </div>
           <div className="flex gap-3 text-center relative z-10">
             <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 min-w-[80px]"><CheckCircle size={18} className="mx-auto mb-1 text-emerald-500" /><p className="text-[10px] font-bold text-emerald-600/70 uppercase">Right</p><p className="font-bold text-emerald-700 text-xl mt-1">{attempt.score}</p></div>
             <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 min-w-[80px]"><XCircle size={18} className="mx-auto mb-1 text-rose-500" /><p className="text-[10px] font-bold text-rose-600/70 uppercase">Wrong</p><p className="font-bold text-rose-700 text-xl mt-1">{attempt.totalQuestions - attempt.score}</p></div>
           </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><BookOpen size={24} className="text-indigo-600"/> Detailed Review</h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-200/50 px-3 py-1 rounded-full border border-slate-200">{testData.questions.length} Questions</span>
          </div>

          <div className="space-y-6">
            {testData.questions.map((q: any, idx: number) => (
              <QuestionReviewCard 
                key={q.id || idx}
                question={q}
                index={idx}
                studentAnswerKey={attempt.answers[q.id]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}