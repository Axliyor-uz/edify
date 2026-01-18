'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile } from '@/services/userService';
import { getUserHistory, QuizAttempt } from '@/services/historyService';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Trophy, Flame, Target, ArrowRight, BookOpen, Star, 
  Edit2, CheckCircle, Zap, TrendingUp, Activity, Sparkles 
} from 'lucide-react';

interface UserProfile {
  displayName: string;
  email: string;
  totalXP: number;
  currentStreak: number;
  level: number;
  dailyGoal: number;
  dailyHistory: Record<string, number>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Goal Editing State
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(100);

  // 1. LOAD DATA (Profile + History)
  useEffect(() => {
    async function loadStats() {
      if (user) {
        try {
          const profileData = await getUserProfile(user.uid, user.email || '', user.displayName || 'Student');
          if (!profileData.dailyGoal) profileData.dailyGoal = 100;
          setProfile(profileData as UserProfile);
          setNewGoal(profileData.dailyGoal || 100);

          const historyData = await getUserHistory(user.uid);
          if (historyData && historyData.length > 0) {
            setLastAttempt(historyData[0]); 
          }
        } catch (error) {
          console.error("Error loading dashboard data:", error);
        }
      }
      setLoading(false);
    }
    loadStats();
  }, [user]);

  // 2. CALCULATIONS
  const todayKey = new Date().toISOString().split('T')[0];
  const todayXP = profile?.dailyHistory?.[todayKey] || 0;
  const dailyGoal = profile?.dailyGoal || 100;
  const progressPercent = Math.min(Math.round((todayXP / dailyGoal) * 100), 100);
  
  const currentLevel = Math.floor((profile?.totalXP || 0) / 100) + 1;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = (profile?.totalXP || 0) % 100;

  // 3. SAVE GOAL
  const saveGoal = async (goal: number) => {
    if (!user || !profile) return;
    try {
      setProfile({ ...profile, dailyGoal: goal });
      setIsEditingGoal(false);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { dailyGoal: goal });
    } catch (e) {
      console.error("Failed to save goal", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="mt-4 text-slate-600 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
        
        {/* 1. WELCOME HEADER - Enhanced with gradient and animations */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in fade-in slide-in-from-top duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient">
                {profile?.displayName || user?.displayName || 'Student'}
              </span>! 
              <span className="inline-block animate-wave ml-2">👋</span>
            </h1>
            <p className="text-slate-600 font-medium flex items-center gap-2 text-lg">
              <Activity size={18} className="text-blue-500 animate-pulse" />
              Let's keep your momentum going. You're doing great!
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/profile" 
              className="px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              View Profile
            </Link>
            <Link 
              href={lastAttempt ? `/practice/${encodeURIComponent(lastAttempt.subtopicName)}` : "/syllabus"} 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <Zap size={18} className="animate-pulse" /> 
              {lastAttempt ? "Resume Learning" : "Start Learning"}
            </Link>
          </div>
        </div>

        {/* 2. MAIN STATS GRID - Enhanced cards with better gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom duration-700">
          
          {/* Total XP - Blue Theme */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Trophy size={28} />
                </div>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 mb-1">{(profile?.totalXP || 0).toLocaleString()}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total XP Earned</p>
              </div>
            </div>
          </div>

          {/* Current Streak - Orange Theme */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-orange-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Flame size={28} />
                </div>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 mb-1">
                  {profile?.currentStreak || 0} <span className="text-xl text-slate-400 font-semibold">days</span>
                </p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Current Streak</p>
              </div>
            </div>
          </div>

          {/* Current Level - Purple Theme */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-purple-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Star size={28} />
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{xpProgress}/{xpForNextLevel} XP</span>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 mb-3">Level {currentLevel}</p>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* DAILY GOAL CARD - Enhanced Dark Theme */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl shadow-2xl text-white relative overflow-hidden group border-2 border-slate-700 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 opacity-20 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 opacity-20 blur-3xl rounded-full -translate-x-10 translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="text-blue-400" size={20} />
                  </div>
                  <span className="font-bold text-sm text-blue-300 uppercase tracking-wide">Daily Goal</span>
                </div>
                <button 
                  onClick={() => setIsEditingGoal(true)} 
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all hover:scale-110"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="mt-6">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black">{todayXP}</span>
                  <span className="text-base font-medium text-slate-400 mb-1">/ {dailyGoal} XP</span>
                </div>
                <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 shadow-lg ${progressPercent >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-300 mt-2 font-semibold flex items-center gap-1">
                  {progressPercent >= 100 ? (
                    <>🎉 Goal Reached! Amazing work!</>
                  ) : (
                    <>{Math.round(progressPercent)}% complete. Keep pushing!</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DYNAMIC LEARNING SECTION - Enhanced with better gradients */}
        <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
          
          {/* Main Action Card */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-5 rounded-full translate-x-32 -translate-y-32 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-500 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-xs font-bold mb-6 shadow-lg">
                <TrendingUp size={14} /> 
                {lastAttempt ? "Recommended Next Step" : "Start Your Journey"}
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">
                {lastAttempt ? lastAttempt.subtopicName : "Welcome to MathMaster!"}
              </h2>
              
              <p className="text-slate-600 mb-8 max-w-lg leading-relaxed text-lg">
                {lastAttempt 
                  ? "Continue exactly where you left off. Review your last session or try a harder difficulty to master this topic."
                  : "Select a topic from the syllabus to begin your first streak. Logic and Sets are great places to start!"
                }
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={lastAttempt ? `/practice/${encodeURIComponent(lastAttempt.subtopicName)}` : "/syllabus"}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {lastAttempt ? "Continue Practice" : "Explore Syllabus"} 
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                {lastAttempt && (
                  <Link 
                    href="/syllabus"
                    className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <BookOpen size={20} />
                    Browse All Topics
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Activity Heatmap - Enhanced */}
          <div className="bg-white/80 backdrop-blur-sm border-2 border-orange-100 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-orange-600 opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Activity size={20} className="text-orange-600" />
                </div>
                Activity Streak
              </h3>
              
              <div className="flex gap-1.5 h-32 items-end justify-between px-1">
                {[...Array(14)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (13 - i));
                  const key = d.toISOString().split('T')[0];
                  const xp = profile?.dailyHistory?.[key] || 0;
                  const isToday = i === 13;
                  
                  const heightPercent = Math.min((xp / 200) * 100, 100); 
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 group/bar w-full relative" title={`${key}: ${xp} XP`}>
                      <div 
                        className={`w-full rounded-lg transition-all duration-300 hover:opacity-80 shadow-sm ${
                          isToday 
                            ? 'bg-gradient-to-t from-blue-600 to-blue-500' 
                            : xp > 0 
                              ? 'bg-gradient-to-t from-blue-300 to-blue-400' 
                              : 'bg-slate-200'
                        }`} 
                        style={{ height: `${heightPercent || 12}%` }}
                      ></div>
                      {isToday && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Today
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mt-4 px-1">
                <span>2 Weeks Ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. GOAL EDITING MODAL - Enhanced */}
        {isEditingGoal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <Target className="text-blue-600" size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Set Daily Goal</h3>
              </div>
              
              <p className="text-slate-600 mb-6">Choose a daily XP target that challenges you!</p>
              
              <div className="space-y-3">
                {[
                  { xp: 50, label: 'Casual', emoji: '😌', color: 'green' },
                  { xp: 100, label: 'Regular', emoji: '🎯', color: 'blue' },
                  { xp: 200, label: 'Serious', emoji: '🔥', color: 'orange' },
                  { xp: 500, label: 'Insane', emoji: '⚡', color: 'purple' }
                ].map(({ xp, label, emoji, color }) => (
                  <button
                    key={xp}
                    onClick={() => saveGoal(xp)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex justify-between items-center group hover:scale-[1.02] ${
                      newGoal === xp 
                        ? `border-${color}-500 bg-${color}-50 shadow-lg` 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{emoji}</span>
                      <div>
                        <span className="block font-black text-xl text-slate-900">{xp} XP</span>
                        <span className="text-sm text-slate-500 font-semibold">{label}</span>
                      </div>
                    </div>
                    {newGoal === xp && (
                      <div className={`p-2 bg-${color}-500 rounded-full`}>
                        <CheckCircle size={20} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setIsEditingGoal(false)} 
                className="w-full mt-6 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}