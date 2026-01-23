'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile, UserProfile } from '@/services/userService';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, BookOpen, User, LogOut, Flame, 
  Trophy, Star, Menu, History, BarChart2, X, Sparkles, Search 
} from 'lucide-react';
import UserSearchModal from '@/components/UserSearchModal';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  // 🟢 CHANGE: Renamed from 'Syllabus' to 'My Classes' to match the new page
  { name: 'My Classes', href: '/classes', icon: BookOpen }, 
  { name: 'Leaderboard', href: '/leaderboard', icon: BarChart2 },
  { name: 'History', href: '/history', icon: History },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Load User Data
  useEffect(() => {
    async function loadData() {
      if (user) {
        const data = await getUserProfile(user.uid, user.email || '', user.displayName || 'Student');
        setProfile(data);
      }
    }
    loadData();
  }, [user]);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K)
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

  return (
    <>
      {/* Dark Glassmorphic Background Layer */}
      <div className="fixed top-0 left-0 right-0 h-20 z-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/95 to-transparent"></div>
      </div>

      {/* Main Navbar - Dark Floating Design */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl h-16 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl z-50 shadow-2xl shadow-black/50">
        <div className="px-6 h-full flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:shadow-blue-400/70 group-hover:scale-105 transition-all duration-300">
              <Sparkles className="text-white" size={20} />
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              MathMaster
            </span>
          </Link>

          {/* CENTER NAVIGATION - Desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/50' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-2">
            
            {/* SEARCH BUTTON - Dark Theme */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 text-slate-400 hover:text-blue-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all duration-300 border border-slate-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 group"
              title="Search Users (Cmd+K)"
            >
              <Search size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block text-xs font-bold bg-slate-700/80 px-2 py-1 rounded-md text-slate-400 border border-slate-600 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors">
                ⌘K
              </span>
            </button>

            {/* Stats Group - Dark Theme */}
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-slate-800/80 to-slate-800/60 rounded-xl p-1.5 border border-slate-700/50 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-slate-700/30">
                <Flame size={16} className="text-orange-500" fill="currentColor" />
                <span className="text-sm font-black text-white">{profile?.currentStreak || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-slate-700/30">
                <Trophy size={16} className="text-yellow-500" fill="currentColor" />
                <span className="text-sm font-black text-white">{profile?.totalXP || 0}</span>
              </div>
            </div>

            {/* Logout Button - Dark Theme */}
            <button 
              onClick={() => signOut(auth)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 text-slate-300 hover:bg-red-500/20 hover:text-red-400 rounded-xl font-semibold text-sm transition-all duration-300 border border-slate-700/50 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20"
              title="Sign Out"
            >
              <LogOut size={16} strokeWidth={2.5} />
            </button>

            {/* Mobile Menu Button - Dark Theme */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 hover:bg-slate-800/80 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-700 text-slate-300"
            >
              {mobileMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Dark Theme */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          <div className="absolute top-24 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300 max-h-[75vh] overflow-y-auto">
            <div className="p-5 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/50' 
                        : 'text-slate-300 hover:bg-slate-800 active:scale-95'
                    }`}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all duration-300 active:scale-95"
              >
                <Search size={20} strokeWidth={2.5} />
                <span>Search Users</span>
              </button>
              
              <div className="my-3 border-t border-slate-700/50"></div>

              {/* Stats - Mobile Dark */}
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-slate-800/80 to-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 flex-1 justify-center bg-slate-900 rounded-lg px-3 py-2.5 shadow-lg border border-slate-700/30">
                  <Flame size={16} className="text-orange-500" fill="currentColor" />
                  <span className="text-sm font-black text-white">{profile?.currentStreak || 0}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-center bg-slate-900 rounded-lg px-3 py-2.5 shadow-lg border border-slate-700/30">
                  <Trophy size={16} className="text-yellow-500" fill="currentColor" />
                  <span className="text-sm font-black text-white">{profile?.totalXP || 0}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  signOut(auth);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-95 border border-red-500/50"
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SEARCH MODAL */}
      <UserSearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </>
  );
}