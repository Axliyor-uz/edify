'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  History, Calendar, ArrowRight, FileText, 
  TrendingUp, Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Floating Particles Background
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(particle.id) * 50, 0],
            opacity: [particle.opacity, particle.opacity * 0.1, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Glowing Orb Component
const GlowingOrb = ({ color, size, position }: { color: string; size: number; position: { x: string; y: string } }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${color} blur-3xl opacity-20`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: position.x,
        top: position.y,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// --- CHILD COMPONENT ---
const HistoryCard = ({ attempt }: { attempt: any }) => {
  const router = useRouter();
  const [testTitle, setTestTitle] = useState<string>(attempt.testTitle || 'Loading...');

  useEffect(() => {
    if (attempt.testTitle) return; 

    const fetchTitle = async () => {
      try {
        if (!attempt.testId) {
          setTestTitle("Unknown Test");
          return;
        }
        const testRef = doc(db, 'custom_tests', attempt.testId);
        const testSnap = await getDoc(testRef);
        if (testSnap.exists()) {
          setTestTitle(testSnap.data().title || "Untitled Test");
        } else {
          setTestTitle("Test Removed");
        }
      } catch (error) {
        setTestTitle("Untitled Test");
      }
    };
    fetchTitle();
  }, [attempt.testId, attempt.testTitle]);

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  
  const gradeColor = percentage >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                   : percentage >= 50 ? 'text-amber-600 bg-amber-50 border-amber-100' 
                   : 'text-rose-600 bg-rose-50 border-rose-100';

  return (
    <motion.div 
      onClick={() => router.push(`/classes/${attempt.classId}/test/${attempt.assignmentId}/results`)}
      className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col md:flex-row items-center gap-6"
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 ${gradeColor}`}>
         <span className="text-lg font-black">{percentage}%</span>
         <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Score</span>
      </div>

      <div className="flex-1 text-center md:text-left space-y-1">
        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
          {testTitle}
        </h3>
        
        <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium text-slate-500">
           <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
             <Calendar size={12} /> 
             {attempt.submittedAt?.seconds 
               ? new Date(attempt.submittedAt.seconds * 1000).toLocaleDateString() 
               : 'Date N/A'}
           </span>
           <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
             <FileText size={12} /> 
             {attempt.score}/{attempt.totalQuestions} Correct
           </span>
        </div>
      </div>

      <button className="hidden md:flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
        View Analysis <ArrowRight size={16} />
      </button>
    </motion.div>
  );
};

// --- MAIN PAGE ---
export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const historyQ = query(
          collection(db, 'attempts'),
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(historyQ);
        setAttempts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      <FloatingParticles />
      <div className="text-center relative z-10">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
        <p className="text-indigo-600 font-bold">Loading your history...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Background Elements */}
      <FloatingParticles />
      <GlowingOrb color="bg-indigo-500" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-500" size={400} position={{ x: '85%', y: '15%' }} />
      
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-20 relative z-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
             <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
               <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                 <History size={28} />
               </div>
               Quiz History
             </h1>
             <p className="text-slate-500 mt-2 font-medium">Your recent performance.</p>
           </div>
           {attempts.length > 0 && (
             <motion.div 
               className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[100px]"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
             >
                <p className="text-slate-400 text-xs font-bold uppercase">Tests Taken</p>
                <p className="text-2xl font-black text-slate-800">{attempts.length}</p>
             </motion.div>
           )}
        </div>

        <div className="space-y-4">
          {attempts.length === 0 ? (
            <motion.div 
              className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No History Yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                Your results will appear here after you complete a test.
              </p>
            </motion.div>
          ) : (
            attempts.map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <HistoryCard attempt={attempt} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
