'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { 
  Trophy, Medal, Flame, Shield, User as UserIcon, 
  ChevronRight, Crown 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- TYPE DEFINITIONS ---

// 1. Interface for the User object in the Leaderboard
interface LeaderboardUser {
  uid: string;
  displayName: string;
  totalXP: number;
  currentStreak: number;
  dailyHistory?: Record<string, number>;
  score: number; // We calculate this dynamically based on the filter
}

// 2. Interface for GlowingOrb Props
interface GlowingOrbProps {
  color: string;
  size: number;
  position: { x: string; y: string };
}

// --- VISUAL COMPONENTS ---

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

// 🟢 FIX: Applied Interface
const GlowingOrb = ({ color, size, position }: GlowingOrbProps) => (
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

// --- LOGIC HELPERS ---
const getTodayKey = () => new Date().toISOString().split('T')[0];

const getWeekKeys = () => {
  const keys: string[] = [];
  const today = new Date();
  const day = today.getDay(); 
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(today.setDate(diff));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.push(d.toISOString().split('T')[0]);
  }
  return keys;
};

const getMonthKeys = () => {
  const keys: string[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); 
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    keys.push(date.toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return keys;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // 🟢 FIX: Applied Typed State
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('week');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        
        // Map raw Firestore data to a temporary object structure
        const rawUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));

        const processed: LeaderboardUser[] = rawUsers.map((u: any) => {
          let score = 0;
          const history = u.dailyHistory || {};
          
          if (filter === 'all') score = u.totalXP || 0;
          else if (filter === 'today') score = history[getTodayKey()] || 0;
          else if (filter === 'week') getWeekKeys().forEach(k => score += (history[k] || 0));
          else if (filter === 'month') getMonthKeys().forEach(k => score += (history[k] || 0));
          
          return {
            uid: u.uid,
            displayName: u.displayName || 'Anonymous',
            totalXP: u.totalXP || 0,
            currentStreak: u.currentStreak || 0,
            dailyHistory: u.dailyHistory,
            score: score
          };
        });

        const sorted = processed.filter(u => u.score > 0).sort((a, b) => b.score - a.score);
        setUsers(sorted);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  // 🟢 FIX: Added type for targetUid
  const handleUserClick = (targetUid: string) => {
    if (targetUid === currentUser?.uid) {
        router.push('/profile'); 
    } else {
        router.push(`/profile/${targetUid}`);
    }
  };

  // 🟢 FIX: Added type for rank
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={28} />;
    if (rank === 2) return <Medal className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.3)]" size={26} />;
    if (rank === 3) return <Medal className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]" size={26} />;
    return <span className="font-black text-slate-500 text-lg w-8 text-center">#{rank}</span>;
  };

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
        <FloatingParticles />
        <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10 pt-12">
           <div className="flex flex-col md:flex-row justify-between gap-6 animate-pulse">
             <div className="h-10 w-48 bg-slate-700/50 rounded-lg"></div>
             <div className="h-10 w-full md:w-96 bg-slate-700/50 rounded-xl"></div>
           </div>
           <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="h-20 bg-slate-800/80 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-[shimmer_1.5s_infinite]" />
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <GlowingOrb color="bg-yellow-500" size={300} position={{ x: '-10%', y: '10%' }} />
      <GlowingOrb color="bg-blue-600" size={400} position={{ x: '80%', y: '40%' }} />

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 relative z-10 pb-24">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8 md:pt-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
                <Crown size={28} fill="currentColor" />
              </div>
              Leaderboard
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-lg">
              Top students for <span className="text-blue-400 capitalize">{filter === 'all' ? 'All Time' : filter}</span>
            </p>
          </div>

          {/* FILTER TABS */}
          <div className="bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 flex overflow-x-auto no-scrollbar shadow-xl">
            {['today', 'week', 'month', 'all'].map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap relative overflow-hidden ${
                  filter === key 
                    ? 'text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {filter === key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                  />
                )}
                <span className="relative z-10 capitalize">{key === 'all' ? 'All Time' : key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LEADERBOARD LIST */}
        <div className="space-y-3">
          {users.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-16 text-center bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-700"
            >
              <Trophy className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 font-medium text-lg">No champions found for this period.</p>
            </motion.div>
          ) : (
            users.map((u, index) => {
              const rank = index + 1;
              const isMe = u.uid === currentUser?.uid;

              return (
                <motion.button
                  key={u.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleUserClick(u.uid)}
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full group relative flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-300 overflow-hidden
                    ${isMe 
                      ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:shadow-xl'
                    }
                  `}
                >
                  {/* Glass Shimmer for top ranks */}
                  {rank <= 3 && (
                     <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* 1. Rank */}
                  <div className="w-10 md:w-14 flex flex-col items-center justify-center flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* 2. Avatar */}
                  <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg md:text-xl font-black shadow-lg border-2
                    ${rank === 1 ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-500' : 
                      isMe ? 'border-blue-500/50 bg-blue-500/20 text-blue-400' : 'border-slate-600 bg-slate-700 text-slate-400'}
                  `}>
                    {u.displayName ? u.displayName[0].toUpperCase() : <UserIcon size={20} />}
                  </div>

                  {/* 3. Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-base md:text-lg truncate ${isMe ? 'text-white' : 'text-slate-200'}`}>
                        {u.displayName || 'Anonymous'}
                      </h3>
                      {isMe && (
                        <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-blue-500/40">
                          You
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                        <Shield size={12} className="text-indigo-400"/> 
                        Lvl {Math.floor(u.totalXP/100)+1}
                      </span>
                      {u.currentStreak > 0 && (
                        <span className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                          <Flame size={12} className="text-orange-500 animate-pulse"/> 
                          {u.currentStreak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4. Score */}
                  <div className="text-right pl-2">
                    <div className="font-black text-lg md:text-2xl text-white tracking-tight">
                      {u.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">XP Earned</div>
                  </div>

                  {/* Arrow for interaction hint */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center text-slate-500 pl-2">
                    <ChevronRight size={20} />
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}