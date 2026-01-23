'use client';

import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile, UserProfile } from '@/services/userService';
import { 
  LayoutDashboard, BookOpen, BarChart2, History, User, 
  LogOut, Sparkles, Search, Menu, X, Flame, Trophy 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import UserSearchModal from '@/components/UserSearchModal';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Classes', href: '/classes', icon: BookOpen },
  { name: 'Leaderboard', href: '/leaderboard', icon: BarChart2 },
  { name: 'History', href: '/history', icon: History },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (user) {
        const data = await getUserProfile(user.uid, user.email || '', user.displayName || 'Student');
        setProfile(data);
      }
    }
    loadData();
  }, [user]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* 1. BRANDING AREA */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">EdifyStudent</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Student Portal</p>
          </div>
        </div>
        
        {/* DESKTOP BELL (Hidden on Mobile) */}
        <div className="hidden md:block text-slate-400">
           <NotificationBell />
        </div>
      </div>

      {/* 2. MENU ITEMS */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <button 
          onClick={() => { setIsMobileOpen(false); setSearchOpen(true); }}
          className="w-full flex items-center gap-3 px-4 py-3 mb-6 rounded-xl text-sm font-semibold bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all group"
        >
          <Search size={18} className="text-slate-500 group-hover:text-white" />
          <span>Search Users</span>
          <kbd className="ml-auto text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 group-hover:text-slate-400">⌘K</kbd>
        </button>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. USER STATS */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-800 rounded-lg p-2.5 flex flex-col items-center border border-slate-700/50">
            <Flame size={16} className="text-orange-500 mb-1" fill="currentColor" />
            <span className="text-xs font-bold text-slate-400">Streak</span>
            <span className="text-sm font-black text-white">{profile?.currentStreak || 0}</span>
          </div>
          <div className="bg-slate-800 rounded-lg p-2.5 flex flex-col items-center border border-slate-700/50">
            <Trophy size={16} className="text-yellow-500 mb-1" fill="currentColor" />
            <span className="text-xs font-bold text-slate-400">XP</span>
            <span className="text-sm font-black text-white">{profile?.totalXP || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-white border-2 border-slate-800 shadow-sm">
             {user?.displayName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.displayName || 'Student'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 🟢 NEW: MOBILE HEADER BAR */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 z-50 md:hidden flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <span className="font-black text-white text-lg tracking-tight">EdifyStudent</span>
        </div>

        {/* MOBILE BELL */}
        <div className="text-slate-400">
           <NotificationBell />
        </div>
      </div>

      {/* Spacer to push content down on mobile */}
      <div className="h-16 md:hidden"></div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block w-72 h-screen fixed top-0 left-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
             {/* Close Button Inside Drawer */}
             <button 
               onClick={() => setIsMobileOpen(false)}
               className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-800 rounded-lg z-10"
             >
               <X size={20} />
             </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <UserSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}