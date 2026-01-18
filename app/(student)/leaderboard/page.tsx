'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { UserProfile } from '@/services/userService';
import { 
  Trophy, Medal, Flame, Shield, User as UserIcon
} from 'lucide-react';

// --- DATE HELPERS ---
const getTodayKey = () => new Date().toISOString().split('T')[0];

const getWeekKeys = () => {
  const keys = [];
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
  const keys = [];
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
  const [users, setUsers] = useState<(UserProfile & { score: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const rawUsers = snapshot.docs.map(doc => doc.data() as UserProfile);

        const processed = rawUsers.map(u => {
          let score = 0;
          const history = u.dailyHistory || {};
          if (filter === 'all') score = u.totalXP;
          else if (filter === 'today') score = history[getTodayKey()] || 0;
          else if (filter === 'week') getWeekKeys().forEach(k => score += (history[k] || 0));
          else if (filter === 'month') getMonthKeys().forEach(k => score += (history[k] || 0));
          return { ...u, score };
        });

        const sorted = processed.filter(u => u.score > 0).sort((a, b) => b-a || b.score - a.score);
        setUsers(sorted);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  // --- HANDLE ROW CLICK ---
  const handleUserClick = (targetUid: string) => {
    if (targetUid === currentUser?.uid) {
        router.push('/profile'); // Go to My Profile (Editable)
    } else {
        router.push(`/profile/${targetUid}`); // Go to Public Profile (Read Only)
    }
  };

  const getRankIcon = (rank: number) => {
    // 1st, 2nd, 3rd get Trophy/Medals. Everyone else gets a number.
    if (rank === 1) return <Trophy className="text-yellow-500 fill-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-slate-400 fill-slate-400" size={24} />;
    if (rank === 3) return <Medal className="text-orange-500 fill-orange-500" size={24} />;
    return <span className="font-black text-slate-400 text-lg w-6 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} /> Leaderboard
          </h1>
          <p className="text-slate-500 font-medium">Top students for {filter === 'all' ? 'All Time' : 'this ' + filter}</p>
        </div>

        <div className="bg-slate-100 p-1.5 rounded-xl flex font-bold text-sm overflow-x-auto">
          {(['today', 'week', 'month', 'all'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-6 py-2 rounded-lg capitalize transition-all whitespace-nowrap ${
                filter === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {key === 'all' ? 'All Time' : key}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading Rankings...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
             No activity found for this period.
          </div>
        ) : (
          users.map((u, index) => {
            const rank = index + 1;
            const isMe = u.uid === currentUser?.uid;

            return (
              <button
                key={u.uid}
                onClick={() => handleUserClick(u.uid)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group bg-white hover:border-blue-200 hover:shadow-md
                  ${isMe ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-100 z-10' : 'border-slate-100'}
                `}
              >
                {/* 1. Rank & Icon */}
                <div className="w-12 flex items-center justify-center flex-shrink-0 gap-2">
                   {/* Explicit Number for Top 3 as well if desired, or just Icon */}
                   <span className="font-bold text-slate-300 text-xs w-4">{rank}</span>
                   {getRankIcon(rank)}
                </div>

                {/* 2. Avatar */}
                <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-slate-300 text-lg shadow-sm">
                   {u.displayName ? u.displayName[0].toUpperCase() : <UserIcon />}
                </div>

                {/* 3. Name & Stats */}
                <div className="flex-1 text-left">
                  <div className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                    {u.displayName || 'Anonymous Student'}
                    {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">You</span>}
                  </div>
                  <div className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-3">
                     <span className="flex items-center gap-1"><Shield size={12}/> Lvl {Math.floor(u.totalXP/100)+1}</span>
                     <span className="flex items-center gap-1"><Flame size={12} className="text-orange-500"/> {u.currentStreak} Day Streak</span>
                  </div>
                </div>

                {/* 4. Score */}
                <div className="text-right">
                  <div className="font-black text-xl text-slate-700">{u.score.toLocaleString()} XP</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}