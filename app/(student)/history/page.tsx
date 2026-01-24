'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  History, Calendar, ArrowRight, CheckCircle2, 
  TrendingUp, Clock, FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- VISUAL BACKGROUND COMPONENTS ---
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [particle.opacity, 0, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const GlowingOrb = ({ color, size, position }) => (
  <motion.div
    className={`absolute rounded-full ${color} blur-3xl opacity-20 pointer-events-none`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      left: position.x,
      top: position.y,
    }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  />
);

// --- HISTORY CARD COMPONENT ---
const HistoryCard = ({ attempt, index }) => {
  const router = useRouter();
  const [testTitle, setTestTitle] = useState(attempt.testTitle || '');

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
  
  // Dynamic Styles based on score
  let statusColor = "text-slate-400 border-slate-600 bg-slate-700/50";
  let glowColor = "group-hover:shadow-slate-500/20";
  
  if (percentage >= 80) {
    statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    glowColor = "group-hover:shadow-emerald-500/20";
  } else if (percentage >= 50) {
    statusColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
    glowColor = "group-hover:shadow-amber-500/20";
  } else {
    statusColor = "text-rose-400 border-rose-500/30 bg-rose-500/10";
    glowColor = "group-hover:shadow-rose-500/20";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => router.push(`/classes/${attempt.classId}/test/${attempt.assignmentId}/results`)}
      className={`group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer shadow-lg ${glowColor} overflow-hidden`}
    >
      {/* Background Hover Highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        
        {/* Score Badge */}
        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-105 ${statusColor}`}>
           <span className="text-xl font-black">{percentage}%</span>
           <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Score</span>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors truncate pr-4">
            {testTitle || <span className="animate-pulse bg-slate-700 rounded h-5 w-32 inline-block"/>}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium text-slate-400">
             <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
               <Calendar size={13} className="text-blue-400" /> 
               {attempt.submittedAt?.seconds 
                 ? new Date(attempt.submittedAt.seconds * 1000).toLocaleDateString() 
                 : 'Date N/A'}
             </div>
             <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
               <CheckCircle2 size={13} className={percentage >= 50 ? "text-emerald-400" : "text-rose-400"} /> 
               {attempt.score} / {attempt.totalQuestions} Correct
             </div>
          </div>
        </div>

        {/* Action Button (Desktop: Text, Mobile: Icon) */}
        <div className="hidden md:flex items-center gap-2 text-blue-400 font-bold text-sm bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all self-center ml-auto">
          Analysis <ArrowRight size={16} />
        </div>
        
        {/* Mobile Chevron */}
        <div className="md:hidden absolute top-4 right-0 text-slate-600 group-hover:text-blue-400">
            <ArrowRight size={20} />
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE ---
export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
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

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
        <FloatingParticles />
        <div className="max-w-4xl mx-auto p-6 pt-12 space-y-8 relative z-10">
          <div className="flex justify-between items-end animate-pulse">
            <div className="space-y-3">
              <div className="h-10 w-48 bg-slate-700/50 rounded-lg"></div>
              <div className="h-5 w-32 bg-slate-700/50 rounded-lg"></div>
            </div>
            <div className="h-12 w-24 bg-slate-700/50 rounded-xl"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800/80 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <FloatingParticles />
      <GlowingOrb color="bg-blue-600" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-600" size={400} position={{ x: '85%', y: '10%' }} />
      
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 relative z-10 pt-10 md:pt-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
           <h1 className="pt-12 md:pt-0 text-3xl font-black text-white flex items-center gap-3 tracking-tight">
  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
    <History size={28} />
  </div>
  Quiz History
</h1>
             <p className="text-slate-400 mt-2 font-medium text-lg">
               Review your past performance and analyze results.
             </p>
           </div>

           {/* Stats Badge */}
           {attempts.length > 0 && (
             <motion.div 
               className="bg-slate-800/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center min-w-[120px]"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
             >
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                   <FileText size={12} /> Total Tests
                </div>
                <div className="text-3xl font-black text-white tracking-tight">{attempts.length}</div>
             </motion.div>
           )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <motion.div 
              className="text-center py-24 bg-slate-800/50 backdrop-blur-md rounded-3xl border border-dashed border-slate-700 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlowingOrb color="bg-slate-500" size={100} position={{ x: '50%', y: '50%' }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-600">
                  <TrendingUp size={32} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No History Yet</h3>
                <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your quiz results will appear here automatically after you complete your first assignment.
                </p>
              </div>
            </motion.div>
          ) : (
            attempts.map((attempt, index) => (
              <HistoryCard key={attempt.id} attempt={attempt} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}