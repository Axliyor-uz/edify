'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile } from '@/services/userService';
import { 
  Award, Flame, Zap, Calendar, Shield, ArrowLeft, User as UserIcon, Activity, Sparkles, TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- TYPES ---
interface UserData {
  displayName: string;
  email: string;
  totalXP: number;
  currentStreak: number;
  level: number;
  dailyHistory: Record<string, number>; 
}

// --- HELPER: HEATMAP (Last 365 Days / 12 Months) ---
const generateHeatmapData = (history: Record<string, number> = {}) => {
  const days = [];
  const today = new Date();
  
  const endDate = new Date(today);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 364);
  
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  let currentDate = new Date(startDate);
  while (currentDate <= endDate || currentDate.getDay() !== 0) {
    const dateStr = currentDate.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      xp: history[dateStr] || 0,
      dayOfWeek: currentDate.getDay(),
      month: currentDate.toLocaleString('default', { month: 'short' }),
      dayOfMonth: currentDate.getDate(),
      year: currentDate.getFullYear()
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
};

// --- HELPER: WEEKLY DATA FOR RECHARTS ---
const getWeeklyChartData = (targetHistory: Record<string, number>, myHistory: Record<string, number> | null) => {
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    
    data.push({
      name: dayLabel,
      Target: targetHistory[dateStr] || 0,
      You: myHistory ? (myHistory[dateStr] || 0) : null,
    });
  }
  return data;
};

// --- HELPER: COLORS ---
const getCellColor = (xp: number) => {
  if (xp === 0) return 'bg-slate-100 border-slate-200 hover:bg-slate-200'; 
  if (xp < 50) return 'bg-emerald-200 border-emerald-300 hover:bg-emerald-300'; 
  if (xp < 100) return 'bg-emerald-400 border-emerald-500 hover:bg-emerald-500'; 
  if (xp < 200) return 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700'; 
  return 'bg-emerald-800 border-emerald-900 hover:bg-emerald-900'; 
};

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [myUserData, setMyUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  // 1. FETCH DATA
  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data() as UserData);

        if (currentUser && currentUser.uid !== userId) {
           const myDocRef = doc(db, 'users', currentUser.uid);
           const myDocSnap = await getDoc(myDocRef);
           if (myDocSnap.exists()) setMyUserData(myDocSnap.data() as UserData);
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    }
    fetchData();
  }, [userId, currentUser]);

  // 2. AUTO-SCROLL HEATMAP TO END (TODAY)
  useEffect(() => {
    if (!loading && heatmapScrollRef.current) {
        heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth;
    }
  }, [loading, userData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={20} />
          </div>
          <p className="mt-3 text-slate-600 font-semibold text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (!userData) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"><div className="text-center text-slate-600">User not found</div></div>;

  const currentLevel = Math.floor((userData.totalXP || 0) / 100) + 1;
  
  // 📊 HEATMAP PREP
  const heatmapData = generateHeatmapData(userData.dailyHistory);
  const activeDaysCount = heatmapData.filter(day => day.xp > 0).length;
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) weeks.push(heatmapData.slice(i, i + 7));
  
  // 📈 CHART DATA PREP
  const chartData = getWeeklyChartData(userData.dailyHistory, myUserData?.dailyHistory || null);
  const targetTotal = chartData.reduce((acc, d) => acc + d.Target, 0);
  const myTotal = chartData.reduce((acc, d) => acc + (d.You || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto space-y-5 pb-16 p-4 md:p-6">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-all hover:-translate-x-1 mb-2 px-3 py-2 rounded-xl hover:bg-white/50 animate-in fade-in slide-in-from-left duration-500"
        >
          <ArrowLeft size={18} /> Back to Leaderboard
        </button>

        {/* 1. HERO PROFILE CARD - Compact & Modern */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-purple-100 overflow-hidden relative group animate-in fade-in slide-in-from-top duration-700">
          <div className="h-32 bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500 opacity-20 blur-3xl rounded-full translate-x-24 -translate-y-24 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-20 blur-3xl rounded-full -translate-x-24 translate-y-24 group-hover:scale-150 transition-transform duration-700"></div>
          </div>
          
          <div className="px-6 md:px-8 pb-6 flex flex-col md:flex-row items-start md:items-end -mt-14 gap-4 relative z-10">
            {/* Avatar - Slightly Smaller */}
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl border-4 border-white bg-gradient-to-br from-purple-400 to-indigo-600 shadow-2xl flex items-center justify-center text-4xl font-black text-white overflow-hidden ring-4 ring-purple-100">
                {userData.displayName?.[0]?.toUpperCase() || <UserIcon size={40} />}
              </div>
              {/* Level Badge */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-purple-500 to-indigo-600 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg border-2 border-white">
                <Shield className="text-white" size={14} />
                <span className="text-xs font-black text-white">LVL {currentLevel}</span>
              </div>
            </div>
            
            {/* Info - Compact */}
            <div className="flex-1 pt-4 md:pb-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                {userData.displayName}
                <Sparkles className="text-purple-500 animate-pulse" size={20} />
              </h1>
              <p className="text-slate-600 font-semibold text-sm flex items-center gap-2">
                <Activity size={14} className="text-purple-500" /> 
                Student at MathMaster
              </p>
            </div>
          </div>
        </div>

        {/* 2. STATS GRID - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom duration-700">
          {/* Level */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md relative z-10 group-hover:scale-110 transition-transform">
              <Award size={24} />
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black text-slate-900">{currentLevel}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Level</div>
            </div>
          </div>
          
          {/* XP */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-yellow-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white shadow-md relative z-10 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black text-slate-900">{(userData.totalXP || 0).toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total XP Earned</div>
            </div>
          </div>
          
          {/* Streak */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-orange-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md relative z-10 group-hover:scale-110 transition-transform">
              <Flame size={24} />
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black text-slate-900">{userData.currentStreak || 0} <span className="text-lg text-slate-400">days</span></div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Streak</div>
            </div>
          </div>
        </div>

        {/* 3 & 4. CHARTS GRID - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
          
          {/* WEEKLY PROGRESS CHART - Compact */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-blue-100 shadow-lg flex flex-col relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              <h3 className="font-black text-slate-800 text-lg">Weekly Progress</h3>
            </div>
            
            <div className="border-2 border-slate-100 rounded-xl p-4 bg-white/50 relative flex-1 min-h-[240px]">
                
                {/* Custom Legend - Compact */}
                <div className="flex justify-between items-start mb-3 px-1">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0ea5e9]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span> {userData.displayName}
                        </div>
                        {myUserData && (
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> You
                            </div>
                        )}
                    </div>
                    <div className="text-right space-y-1">
                        <div className="font-bold text-xs text-[#0ea5e9]">{targetTotal} XP</div>
                        {myUserData && <div className="font-bold text-xs text-gray-400">{myTotal} XP</div>}
                    </div>
                </div>

                {/* Chart - Compact */}
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} 
                        dy={8}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} 
                        width={28}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      
                      {myUserData && (
                        <Line 
                          type="monotone" 
                          dataKey="You" 
                          stroke="#9ca3af" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, fill: '#9ca3af', strokeWidth: 0 }} 
                          activeDot={{ r: 5 }}
                        />
                      )}

                      <Line 
                        type="monotone" 
                        dataKey="Target" 
                        stroke="#0ea5e9" 
                        strokeWidth={2.5} 
                        dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }} 
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* ACTIVITY HEATMAP - Compact */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-emerald-100 shadow-lg p-5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-5 gap-3 relative z-10">
              <div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Activity size={18} className="text-emerald-600" />
                  </div>
                  Learning Activity
                </h3>
                <p className="text-xs font-semibold text-slate-600">
                  <span className="text-emerald-600 font-black">{activeDaysCount}</span> days active this year 🎯
                </p>
              </div>
              
              <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                <span>Less</span>
                <div className={`w-3 h-3 rounded-sm border ${getCellColor(0)}`}></div>
                <div className={`w-3 h-3 rounded-sm border ${getCellColor(90)}`}></div>
                <div className={`w-3 h-3 rounded-sm border ${getCellColor(250)}`}></div>
                <span>More</span>
              </div>
            </div>
             
            {/* Scrollable Heatmap - Compact */}
            <div 
              ref={heatmapScrollRef} 
              className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 w-full relative z-10"
            >
              <div className="flex gap-2 min-w-max">
                <div className="flex flex-col gap-[3px] text-[9px] font-bold text-slate-400 pt-[2px] mt-3">
                  <span className="h-[9px]">M</span>
                  <span className="h-[9px]"></span>
                  <span className="h-[9px]">W</span>
                  <span className="h-[9px]"></span>
                  <span className="h-[9px]">F</span>
                </div>
                
                {/* Grid - Compact */}
                <div className="flex flex-col gap-1">
                  {/* Month Labels */}
                  <div className="flex h-3">
                    {weeks.map((week, i) => (
                      <div key={i} className="w-[11px] mr-[2px] relative">
                        {week[0].dayOfMonth <= 7 && (
                          <span className="absolute text-[9px] font-bold text-slate-500 top-0 left-0">
                            {week[0].month}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dots - Compact */}
                  <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
                    {heatmapData.map((day, i) => (
                      <div 
                        key={i} 
                        title={`${day.date}: ${day.xp} XP`} 
                        className={`w-[9px] h-[9px] rounded-[2px] border transition-all duration-200 cursor-pointer ${getCellColor(day.xp)}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}