'use client';

// 👇 1. IMPORT NOTIFICATION BELL
import NotificationBell from '@/components/NotificationBell';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile } from '@/services/userService';
import { 
  Rocket, LogOut, LayoutDashboard, Users, 
  GraduationCap, Menu, X, FilePlus, FolderOpen, BarChart3, Settings, ChevronRight, BookOpen, User 
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- 1. PROTECTION LOGIC ---
  useEffect(() => {
    async function checkRole() {
      if (!loading) {
        if (!user) {
          router.push('/auth/login');
        } else {
          const profile = await getUserProfile(user.uid);
          if (profile?.role !== 'teacher') {
            router.push('/dashboard');
          } else {
            setIsAuthorized(true);
          }
        }
      }
    }
    checkRole();
  }, [user, loading, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          <p className="text-slate-400 text-sm font-bold animate-pulse">Loading EdifyTeacher...</p>
        </div>
      </div>
    );
  }

  // --- 2. NAVIGATION CONFIG ---
  const navItems = [
    { name: 'Overview', href: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Library', href: '/teacher/library', icon: FolderOpen },
    { name: 'My Classes', href: '/teacher/classes', icon: Users }, 
    { name: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/teacher/profile', icon: User },
  ];

  // --- 3. SIDEBAR COMPONENT ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      {/* 👇 2. UPDATED HEADER STRUCTURE */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40 text-white">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white leading-none">Edify<span className="text-indigo-400">Teacher</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Instructor Portal</p>
          </div>
        </div>

        {/* 👇 BELL ICON */}
        <div className="text-slate-400">
           <NotificationBell />
        </div>
      </div>

      {/* CREATE BUTTON */}
      <div className="px-4 mb-6">
        <Link 
          href="/teacher/create" 
          className="flex items-center justify-center gap-2 bg-white text-indigo-950 py-3.5 rounded-xl font-black shadow-lg shadow-indigo-900/10 transition-all hover:bg-indigo-50 active:scale-95 group"
        >
          <FilePlus size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" /> 
          Create New Test
        </Link>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-2">Main Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/teacher/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`group flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={`${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300'}`} /> 
                {item.name}
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
            </Link>
          );
        })}
      </nav>

      {/* USER FOOTER */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          
          <Link href="/teacher/settings" className="flex items-center gap-3 flex-1 group rounded-lg p-2 -ml-2 hover:bg-slate-800 transition-colors">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 shrink-0 border border-slate-600 group-hover:border-indigo-500 transition-colors">
                 {user?.photoURL ? (
                   <img src={user.photoURL} alt="Me" className="w-full h-full rounded-full object-cover" />
                 ) : (
                   <GraduationCap size={20} />
                 )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            
            <div className="overflow-hidden text-left">
              <p className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                {user?.displayName || 'Professor'}
              </p>
              <p className="text-xs text-slate-500 truncate">View Profile</p>
            </div>
          </Link>

          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* 📱 MOBILE HEADER */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 border-b border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 font-black text-lg">
          <BookOpen size={20} className="text-indigo-500"/>
          Edify<span className="text-indigo-400">Teacher</span>
        </div>
        
        {/* Mobile Controls */}
        <div className="flex items-center gap-3">
          {/* Also added Bell here for mobile users */}
          <div className="text-slate-300">
             <NotificationBell />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* 📱 MOBILE SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <aside className="relative w-72 bg-slate-900 text-white h-full shadow-2xl animate-in slide-in-from-left duration-300 border-r border-slate-800">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg z-10"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white fixed h-full hidden md:block z-10 border-r border-slate-800 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
}