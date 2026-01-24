'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  Trophy, Flame, Target, ArrowRight, BookOpen, Star, 
  Edit2, CheckCircle, Zap, TrendingUp, Activity, Sparkles, Clock, School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface UserProfile {
  displayName: string;
  totalXP: number;
  currentStreak: number;
  dailyGoal: number;
  dailyHistory: Record<string, number>;
}

interface UpcomingTask {
  assignmentId: string;
  classId: string;
  title: string;
  className: string;
  dueAt: any;
}

// Floating Particles Background (same as Classes page)
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
          className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
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

// Glowing Orb (same as Classes page)
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

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nextTask, setNextTask] = useState<UpcomingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(100);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setProfile({
            displayName: data.displayName || user.displayName || 'Student',
            totalXP: data.totalXP || 0,
            currentStreak: data.currentStreak || 0,
            dailyGoal: data.dailyGoal || 100,
            dailyHistory: data.dailyHistory || {}
          });
          setNewGoal(data.dailyGoal || 100);
        } else {
          setProfile({
            displayName: user.displayName || 'Student',
            totalXP: 0,
            currentStreak: 0,
            dailyGoal: 100,
            dailyHistory: {}
          });
        }

        const enrolledQ = collection(db, `users/${user.uid}/enrolled_classes`);
        const enrolledSnap = await getDocs(enrolledQ);
        const classIds = enrolledSnap.docs.map(d => d.id);

        if (classIds.length > 0) {
           let foundTask: UpcomingTask | null = null;
           
           for (const clsId of classIds) {
             const assignQ = query(
               collection(db, `classes/${clsId}/assignments`),
               where('status', '==', 'active'),
               orderBy('dueAt', 'asc'),
               limit(1)
             );
             const assignSnap = await getDocs(assignQ);
             if (!assignSnap.empty) {
                const aData = assignSnap.docs[0].data();
                const attemptQ = query(
                    collection(db, 'attempts'), 
                    where('assignmentId', '==', assignSnap.docs[0].id),
                    where('userId', '==', user.uid)
                );
                const attemptSnap = await getDocs(attemptQ);
                
                if(attemptSnap.empty) {
                   foundTask = {
                     assignmentId: assignSnap.docs[0].id,
                     classId: clsId,
                     title: aData.title,
                     className: "Mathematics",
                     dueAt: aData.dueAt
                   };
                   break;
                }
             }
           }
           setNextTask(foundTask);
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayXP = profile?.dailyHistory?.[todayKey] || 0;
  const dailyGoal = profile?.dailyGoal || 100;
  const progressPercent = Math.min(Math.round((todayXP / dailyGoal) * 100), 100);
  
  const currentLevel = Math.floor((profile?.totalXP || 0) / 1000) + 1;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (profile?.totalXP || 0) % 1000;

  const saveGoal = (goal: number) => {
    setProfile(prev => prev ? ({ ...prev, dailyGoal: goal }) : null);
    setIsEditingGoal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <FloatingParticles />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 border-4 border-slate-700 border-t-blue-500 rounded-full mx-auto animate-spin"></div>
          <p className="mt-6 text-slate-300 font-bold text-lg">Loading Student Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      {/* Background */}
      <FloatingParticles />
      <GlowingOrb color="bg-blue-500" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-500" size={400} position={{ x: '85%', y: '15%' }} />
      <GlowingOrb color="bg-orange-500" size={250} position={{ x: '70%', y: '80%' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-12 relative z-10">
        
        {/* WELCOME HEADER */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-5"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-2 pt-[40px] md:pt-0">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                {profile?.displayName}
              </span>! 👋
            </h1>
            <p className="text-slate-400 font-semibold flex items-center gap-2 text-lg">
              <Activity size={20} className="text-blue-400" />
              Your academic dashboard is ready. Let's learn!
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link 
                href="/history" 
                className="px-6 py-3 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-700/50 transition-all"
              >
                Past Results
              </Link>
            </motion.button>
            <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link 
                href="/classes" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/40 hover:shadow-2xl transition-all flex items-center gap-2"
              >
                <School size={20} /> My Classes
              </Link>
            </motion.button>
          </div>
        </motion.div>

        {/* STATS GRID */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {[
            { icon: <Trophy size={28} />, value: (profile?.totalXP || 0).toLocaleString(), label: "Total XP Earned", color: "blue" },
            { icon: <Flame size={28} />, value: `${profile?.currentStreak || 0} days`, label: "Active Streak", color: "orange" },
            { icon: <Star size={28} />, value: `Level ${currentLevel}`, label: "Current Level", color: "purple", sub: `${xpProgress}/${xpForNextLevel} XP` },
            { icon: <Target size={20} />, value: `${todayXP} / ${dailyGoal} XP`, label: "Daily Goal", color: "blue", progress: progressPercent }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-${stat.color}-500/30 shadow-2xl relative overflow-hidden group`}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-xl text-white`}>
                    {stat.icon}
                  </div>
                  {stat.sub && <span className={`text-xs font-bold text-${stat.color}-300 bg-${stat.color}-500/20 px-2 py-1 rounded-full`}>{stat.sub}</span>}
                </div>
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                
                {stat.progress !== undefined && (
                  <div className="mt-3 w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ACTION SECTION */}
        <motion.div 
          className="grid lg:grid-cols-3 gap-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 relative overflow-hidden group"
            whileHover={{ y: -5 }}
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-xs font-bold mb-5">
                {nextTask ? <Clock size={14} /> : <Sparkles size={14} />} 
                {nextTask ? "Upcoming Deadline" : "You're All Caught Up!"}
              </div>
              
              <h2 className="text-3xl font-black text-white mb-3">
                {nextTask ? nextTask.title : "Ready for a Challenge?"}
              </h2>
              
              <p className="text-slate-400 mb-6 max-w-lg text-lg">
                {nextTask 
                  ? "This test is your next priority. Complete it to keep your streak alive and earn XP."
                  : "No pending assignments! Browse your classes to review or improve your scores."
                }
              </p>
              
              <div className="flex flex-wrap gap-4">
                <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link 
                    href={nextTask ? `/classes/${nextTask.classId}/test/${nextTask.assignmentId}` : "/classes"}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-xl flex items-center gap-2"
                  >
                    {nextTask ? "Start Test Now" : "Browse Classes"} <ArrowRight size={20} />
                  </Link>
                </motion.button>
                
                <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link 
                    href="/classes"
                    className="px-8 py-4 bg-slate-700/50 border-2 border-slate-600 text-slate-300 font-bold rounded-xl hover:bg-slate-700 hover:border-slate-500 flex items-center gap-2"
                  >
                    <School size={20} /> View All Classes
                  </Link>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Activity Heatmap */}
          <motion.div 
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between group"
            whileHover={{ y: -5 }}
          >
            <h3 className="font-black text-white mb-5 flex items-center gap-2 text-lg">
              <Activity size={20} className="text-orange-400" /> Activity Streak
            </h3>
            
            <div className="flex gap-1.5 h-28 items-end justify-between">
              {[...Array(14)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                const key = d.toISOString().split('T')[0];
                const xp = profile?.dailyHistory?.[key] || 0;
                const isToday = i === 13;
                const height = Math.max((xp / 200) * 100, 10);
                
                return (
                  <div key={i} className="w-full flex flex-col items-center gap-1" title={`${key}: ${xp} XP`}>
                    <div 
                      className={`w-full rounded-t-lg ${
                        isToday ? 'bg-blue-500' : xp > 0 ? 'bg-blue-600/70' : 'bg-slate-700/50'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    {isToday && <span className="text-[10px] text-blue-400 font-bold">Today</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* MODAL */}
        <AnimatePresence>
          {isEditingGoal && (
            <motion.div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
              >
                <h3 className="text-2xl font-black text-white mb-2">Set Daily Goal</h3>
                <p className="text-slate-400 mb-6">Choose a daily XP target that challenges you!</p>
                
                {[
                  { xp: 50, label: 'Casual', emoji: '😌' },
                  { xp: 100, label: 'Regular', emoji: '🎯' },
                  { xp: 200, label: 'Serious', emoji: '🔥' },
                  { xp: 500, label: 'Insane', emoji: '⚡' }
                ].map(({ xp, label, emoji }) => (
                  <motion.button
                    key={xp}
                    onClick={() => saveGoal(xp)}
                    className={`w-full p-4 rounded-xl border-2 mb-3 text-left ${
                      newGoal === xp 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <div className="font-black text-white">{xp} XP</div>
                          <div className="text-sm text-slate-400">{label}</div>
                        </div>
                      </div>
                      {newGoal === xp && <CheckCircle className="text-blue-400" size={20} />}
                    </div>
                  </motion.button>
                ))}
                
                <button 
                  onClick={() => setIsEditingGoal(false)} 
                  className="w-full mt-4 py-3 text-slate-400 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
