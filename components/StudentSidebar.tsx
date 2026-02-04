'use client';

import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { 
  LayoutDashboard, BookOpen, BarChart2, History, User, 
  LogOut, Sparkles, Menu, X, Flame, Trophy, ChevronDown, Check 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import UserSearchModal from '@/components/UserSearchModal';
import { LangType } from '@/app/(student)/layout';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore'; 

// --- TRANSLATIONS (Same as before) ---
const SIDEBAR_TRANSLATIONS = {
  uz: {
    brandSubtitle: "O'QUVCHI PORTALI",
    menu: { dashboard: "Boshqaruv", classes: "Sinflarim", leaderboard: "Reyting", history: "Tarix", profile: "Profil" },
    stats: { streak: "Olov", xp: "XP" },
    signOut: "Chiqish",
    search: "Qidiruv"
  },
  en: {
    brandSubtitle: "STUDENT PORTAL",
    menu: { dashboard: "Dashboard", classes: "My Classes", leaderboard: "Leaderboard", history: "History", profile: "Profile" },
    stats: { streak: "Streak", xp: "XP" },
    signOut: "Sign Out",
    search: "Search"
  },
  ru: {
    brandSubtitle: "ПОРТАЛ УЧЕНИКА",
    menu: { dashboard: "Главная", classes: "Мои Классы", leaderboard: "Рейтинг", history: "История", profile: "Профиль" },
    stats: { streak: "Серия", xp: "XP" },
    signOut: "Выйти",
    search: "Поиск"
  }
};

interface StudentSidebarProps {
  lang: LangType;
  setLang: (lang: LangType) => void;
}

// LanguageSelector Component (Unchanged)
const LanguageSelector = ({ lang, setLang }: { lang: LangType, setLang: (l: LangType) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const languages: { code: LangType; label: string }[] = [
    { code: 'uz', label: "O'zbek" }, { code: 'en', label: "English" }, { code: 'ru', label: "Русский" },
  ];
  const currentLabel = languages.find(l => l.code === lang)?.label || lang.toUpperCase();
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all border text-xs font-bold uppercase tracking-wide ${isOpen ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
        <span className="flex items-center gap-2">
           <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[9px] border border-slate-600">{lang.toUpperCase()}</span>
           <span className="truncate">{currentLabel}</span>
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full mt-2 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden p-1 z-50">
            {languages.map((item) => (
              <button key={item.code} onClick={() => { setLang(item.code); setIsOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${lang === item.code ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
                <span>{item.label}</span> {lang === item.code && <Check size={12} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function StudentSidebar({ lang, setLang }: StudentSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // 🟢 LIVE STATE for User Stats
  const [stats, setStats] = useState({ xp: 0, streak: 0 });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const t = SIDEBAR_TRANSLATIONS[lang];

  // 🟢 REAL-TIME LISTENER (Fixed Field Logic)
  useEffect(() => {
    if (!user) return;

    // Connect to the specific user document
    const userRef = doc(db, 'users', user.uid);

    // Open the Live Channel
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 🟢 FIX: Check ALL possible field names
        // 'totalXP' is the new standard, 'xp' might be old data
        const xpValue = data.totalXP ?? data.xp ?? 0;
        const streakValue = data.currentStreak ?? data.streak ?? 0;

        setStats({
          xp: xpValue,
          streak: streakValue
        });
      }
    }, (error) => {
      console.error("Sidebar Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const menuItems = [
    { name: t.menu.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.menu.classes, href: '/classes', icon: BookOpen },
    { name: t.menu.leaderboard, href: '/leaderboard', icon: BarChart2 },
    { name: t.menu.history, href: '/history', icon: History },
    { name: t.menu.profile, href: '/profile', icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      
      {/* 1. BRANDING & CONTROLS */}
      <div className="flex flex-col p-5 pb-6 border-b border-slate-800 shrink-0 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
            <Sparkles className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white tracking-tight leading-none">EdifyStudent</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t.brandSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex-1 min-w-0">
             <LanguageSelector lang={lang} setLang={setLang} />
           </div>
           <div className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-pointer shadow-sm shrink-0">
             <NotificationBell />
           </div>
        </div>
      </div>

      {/* 2. MENU ITEMS */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden ${isActive ? 'text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-transparent opacity-100" />}
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. USER STATS (LIVE DATA) */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center border border-slate-700/50 transition-all hover:border-orange-500/30">
            <Flame size={18} className={`mb-1 ${stats.streak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-600'}`} fill="currentColor" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.stats.streak}</span>
            <span className={`text-sm font-black ${stats.streak > 0 ? 'text-orange-100' : 'text-slate-500'}`}>
               {stats.streak}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center border border-slate-700/50 transition-all hover:border-yellow-500/30">
            <Trophy size={18} className="text-yellow-500 mb-1" fill="currentColor" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.stats.xp}</span>
            <span className="text-sm font-black text-white">{stats.xp.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white border-2 border-slate-600 overflow-hidden">
             {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : user?.displayName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.displayName || 'Student'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title={t.signOut}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 md:hidden flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg active:scale-95 transition-transform">
            <Menu size={24} />
          </button>
          <span className="font-black text-white text-lg tracking-tight">EdifyStudent</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-slate-400"><NotificationBell /></div>
        </div>
      </div>

      <div className="h-16 md:hidden"></div>

      <aside className="hidden md:block w-72 h-screen fixed top-0 left-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} className="absolute inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl border-r border-slate-800">
               <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-[-40px] p-2 bg-slate-800 text-slate-400 hover:text-white rounded-r-lg border-y border-r border-slate-700">
                 <X size={20} />
               </button>
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UserSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}