'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  Award, Flame, Zap, Calendar, Shield, ArrowLeft, User as UserIcon, 
  TrendingUp, Sparkles, Briefcase, MapPin, Quote
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useStudentLanguage } from '@/app/(student)/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const PUBLIC_PROFILE_TRANSLATIONS = {
  uz: {
    loading: "Profil yuklanmoqda...",
    back: "Ortga",
    notFound: "Foydalanuvchi topilmadi",
    goBack: "Ortga qaytish",
    role: { teacher: "O'qituvchi", student: "O'quvchi", instructor: "Instruktor" },
    stats: { level: "Daraja", xp: "Jami XP", streak: "Kunlik Seriya", days: "kun" },
    charts: {
      weekly: "Haftalik Natijalar",
      last30: "So'nggi 30 Kun",
      avg: "Kunlik O'rtacha",
      target: "Ular",
      you: "Siz"
    }
  },
  en: {
    loading: "Loading profile...",
    back: "Back",
    notFound: "User not found",
    goBack: "Go Back",
    role: { teacher: "Teacher", student: "Student", instructor: "Instructor" },
    stats: { level: "Level", xp: "Total XP", streak: "Day Streak", days: "days" },
    charts: {
      weekly: "Weekly Comparison",
      last30: "Last 30 Days",
      avg: "Daily Avg",
      target: "Target",
      you: "You"
    }
  },
  ru: {
    loading: "Загрузка профиля...",
    back: "Назад",
    notFound: "Пользователь не найден",
    goBack: "Вернуться",
    role: { teacher: "Учитель", student: "Ученик", instructor: "Инструктор" },
    stats: { level: "Уровень", xp: "Всего XP", streak: "Серия", days: "дн." },
    charts: {
      weekly: "Сравнение за неделю",
      last30: "Посл. 30 дней",
      avg: "Среднее",
      target: "Они",
      you: "Вы"
    }
  }
};

// --- TYPES ---
interface UserData {
  displayName: string;
  username?: string;
  bio?: string;
  role?: string;
  location?: { region: string };
  email: string;
  totalXP: number;
  currentStreak: number;
  level: number;
  dailyHistory: Record<string, number>; 
}

// --- HELPER: LAST 30 DAYS DATA (Bar Chart) ---
const getLast30DaysData = (history: Record<string, number> = {}, lang: string = 'en') => {
  const days = [];
  const today = new Date();
  
  // Map our lang codes to standard locales
  const localeMap: Record<string, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
  const locale = localeMap[lang] || 'en-US';

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    const xp = history[dateStr] || 0;
    const displayDate = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    
    days.push({ fullDate: dateStr, displayDate, xp });
  }
  return days;
};

// --- HELPER: WEEKLY COMPARISON DATA (Line Chart) ---
const getWeeklyChartData = (targetHistory: Record<string, number>, myHistory: Record<string, number> | null, lang: string = 'en', t: any) => {
  const data = [];
  const today = new Date();
  
  const localeMap: Record<string, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
  const locale = localeMap[lang] || 'en-US';

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString(locale, { weekday: 'short' });
    
    data.push({
      name: dayLabel,
      [t.charts.target]: targetHistory[dateStr] || 0, // Dynamic Key Name
      [t.charts.you]: myHistory ? (myHistory[dateStr] || 0) : 0, 
    });
  }
  return data;
};

// --- HELPER: LEVEL CALC ---
const calculateLevel = (xp: number) => Math.floor((xp || 0) / 100) + 1;

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  
  // 🟢 Use Language Hook
  const { lang } = useStudentLanguage();
  const t = PUBLIC_PROFILE_TRANSLATIONS[lang];

  const [userData, setUserData] = useState<UserData | null>(null);
  const [myUserData, setMyUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. REDIRECT IF VIEWING SELF
  useEffect(() => {
    if (currentUser && currentUser.uid === userId) {
      router.replace('/profile');
    }
  }, [currentUser, userId, router]);

  // 2. FETCH DATA
  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setUserData(null);
        }

        if (currentUser && currentUser.uid !== userId) {
           const myDocRef = doc(db, 'users', currentUser.uid);
           const myDocSnap = await getDoc(myDocRef);
           if (myDocSnap.exists()) setMyUserData(myDocSnap.data() as UserData);
        }
      } catch (e) { 
        console.error(e); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchData();
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={20} />
          </div>
          <p className="mt-3 text-slate-600 font-semibold text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  if (!userData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 gap-4">
      <div className="text-slate-400 mb-2"><UserIcon size={64} /></div>
      <h1 className="text-2xl font-bold text-slate-700">{t.notFound}</h1>
      <button onClick={() => router.back()} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors">
        {t.goBack}
      </button>
    </div>
  );

  const currentLevel = calculateLevel(userData.totalXP);
  
  // 📊 CHART DATA PREP (Localized)
  const last30Days = getLast30DaysData(userData.dailyHistory, lang);
  const maxXP = Math.max(...last30Days.map(d => d.xp), 10);
  const totalXP30d = last30Days.reduce((acc, curr) => acc + curr.xp, 0);
  const avgXP = Math.round(totalXP30d / 30);

  // 📈 COMPARISON DATA (Localized Keys)
  const weeklyData = getWeeklyChartData(userData.dailyHistory, myUserData?.dailyHistory || null, lang, t);
  
  // Cast (d as any) to fix the TypeScript indexing error
  const targetWeeklyTotal = weeklyData.reduce((acc, d) => acc + ((d as any)[t.charts.target] || 0), 0);
  const myWeeklyTotal = weeklyData.reduce((acc, d) => acc + ((d as any)[t.charts.you] || 0), 0);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto space-y-5 pb-16 p-4 md:p-6">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 mt-20 md:mt-0 text-slate-600 hover:text-slate-900 font-bold transition-all hover:-translate-x-1 mb-2 px-3 py-2 rounded-xl hover:bg-white/50 animate-in fade-in slide-in-from-left duration-500"
        >
          <ArrowLeft size={18} /> {t.back}
        </button>

        {/* 1. HERO PROFILE CARD */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-purple-100 overflow-hidden relative group animate-in fade-in slide-in-from-top duration-700">
          <div className="h-36 bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500 opacity-20 blur-3xl rounded-full translate-x-24 -translate-y-24 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-20 blur-3xl rounded-full -translate-x-24 translate-y-24 group-hover:scale-150 transition-transform duration-700"></div>
          </div>
          
          <div className="px-6 md:px-8 pb-6 flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-[5px] border-white bg-gradient-to-br from-purple-400 to-indigo-600 shadow-2xl flex items-center justify-center text-5xl font-black text-white overflow-hidden ring-4 ring-purple-100/50">
                {userData.displayName?.[0]?.toUpperCase() || <UserIcon size={48} />}
              </div>
              {/* Level Badge */}
              <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-purple-600 to-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border-[3px] border-white">
                <Shield className="text-yellow-400 fill-yellow-400" size={14} />
                <span className="text-xs font-black text-white tracking-wide">LVL {currentLevel}</span>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 pt-2 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {userData.displayName}
                    {userData.role === 'teacher' && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-indigo-200">
                        {t.role.instructor}
                      </span>
                    )}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500 mt-1">
                    {userData.username && <span className="text-indigo-600">@{userData.username}</span>}
                    <span className="flex items-center gap-1.5"><Briefcase size={14} /> {userData.role === 'teacher' ? t.role.teacher : t.role.student}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {userData.location?.region || 'Uzbekistan'}</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {userData.bio && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 relative group/bio">
                  <Quote size={14} className="text-purple-300 absolute top-2 left-2 fill-current" />
                  <p className="text-slate-600 text-sm italic font-medium pl-6 relative z-10 line-clamp-2">
                    {userData.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom duration-700">
          {[
            { label: t.stats.level, value: currentLevel, icon: Award, color: 'blue' },
            { label: t.stats.xp, value: (userData.totalXP || 0).toLocaleString(), icon: Zap, color: 'yellow' },
            { label: t.stats.streak, value: `${userData.currentStreak || 0} ${t.stats.days}`, icon: Flame, color: 'orange' },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-${stat.color}-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden group`}>
              <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-${stat.color}-400 to-${stat.color}-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 flex items-center justify-center text-white shadow-md relative z-10 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 3 & 4. CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
          
          {/* A. WEEKLY COMPARISON CHART */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-blue-100 shadow-lg flex flex-col relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              <h3 className="font-black text-slate-800 text-lg">{t.charts.weekly}</h3>
            </div>
            
            <div className="border-2 border-slate-100 rounded-xl p-4 bg-white/50 relative flex-1 min-h-[240px]">
                {/* Legend */}
                <div className="flex justify-between items-start mb-3 px-1">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0ea5e9]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span> {userData.displayName}
                        </div>
                        {myUserData && (
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> {t.charts.you}
                            </div>
                        )}
                    </div>
                    <div className="text-right space-y-1">
                        <div className="font-bold text-xs text-[#0ea5e9]">{targetWeeklyTotal} XP</div>
                        {myUserData && <div className="font-bold text-xs text-gray-400">{myWeeklyTotal} XP</div>}
                    </div>
                </div>

                {/* Line Chart */}
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} width={28} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      {myUserData && (
                        <Line type="monotone" dataKey={t.charts.you} stroke="#9ca3af" strokeWidth={2.5} dot={{ r: 3, fill: '#9ca3af', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      )}
                      <Line type="monotone" dataKey={t.charts.target} stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* B. LAST 30 DAYS ACTIVITY (Bar Chart) */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-indigo-100 shadow-lg p-5 flex flex-col relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-indigo-400 to-purple-600 opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-center mb-5 relative z-10">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Calendar size={18} className="text-indigo-600" />
                </div>
                {t.charts.last30}
              </h3>
              <div className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.charts.avg}</p>
                 <p className="text-xs font-black text-indigo-600">{avgXP} XP</p>
              </div>
            </div>
             
            {/* Bar Chart Container */}
            <div className="relative w-full h-[200px] flex items-end gap-1 pt-4 border-t border-slate-100">
               {/* Y-Axis Guidelines */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 pb-6">
                   <div className="border-t border-slate-300 w-full"></div>
                   <div className="border-t border-slate-300 dashed w-full"></div>
                   <div className="border-t border-slate-300 w-full"></div>
               </div>

               {/* Bars */}
               {last30Days.map((day, idx) => {
                  const heightPercent = (day.xp / maxXP) * 100;
                  const isToday = idx === 29; 

                  return (
                    <div key={day.fullDate} className="group/bar relative flex-1 h-full flex flex-col justify-end items-center">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity z-20 pointer-events-none">
                        <div className="bg-slate-800 text-white text-[10px] rounded-md py-1 px-2 shadow-xl whitespace-nowrap text-center">
                          <p className="font-bold">{day.xp} XP</p>
                          <p className="text-slate-400">{day.displayDate}</p>
                        </div>
                        <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                      </div>

                      {/* Bar */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPercent, 2)}%` }} 
                        transition={{ duration: 0.5, delay: idx * 0.01 }}
                        className={`w-full max-w-[10px] rounded-t-[2px] transition-all duration-200 
                          ${day.xp > 0 
                            ? 'bg-gradient-to-t from-indigo-500 to-purple-400 group-hover/bar:from-indigo-600 group-hover/bar:to-purple-500' 
                            : 'bg-slate-200'
                          }
                          ${isToday ? 'ring-2 ring-purple-200' : ''}
                        `}
                      />
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}