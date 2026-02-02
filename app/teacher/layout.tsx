'use client';

import NotificationBell from '@/components/NotificationBell';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile } from '@/services/userService';
import { 
  LogOut, LayoutDashboard, Users, GraduationCap, Menu, X, 
  FilePlus, FolderOpen, BarChart3, BookOpen, 
  User, PanelLeftClose
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- PROTECTION LOGIC ---
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

  const navItems = [
    { name: 'Overview', href: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Library', href: '/teacher/library', icon: FolderOpen },
    { name: 'My Classes', href: '/teacher/classes', icon: Users }, 
    { name: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/teacher/profile', icon: User },
  ];

  // --- SIDEBAR CONTENT ---
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
    // Mobile is never collapsed in the "compact" sense
    const collapsed = mobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full relative transition-all duration-300">
        
        {/* HEADER SECTION */}
        <div className={`p-5 flex items-center transition-all duration-300 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          
          {/* Mobile Close Button (Left Side) */}
          {mobile && (
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg -ml-2"
            >
              <X size={24} />
            </button>
          )}

          {/* Logo Area */}
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden animate-in fade-in duration-300">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/40 text-white shrink-0">
                <BookOpen size={18} />
              </div>
              {!mobile && (
                <div>
                  <h1 className="font-black text-lg tracking-tight text-white leading-none whitespace-nowrap">
                    Edify<span className="text-indigo-400">Teacher</span>
                  </h1>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap">
                    Instructor Portal
                  </p>
                </div>
              )}
            </div>
          )}

          {/* RIGHT SIDE ACTIONS (Desktop) */}
          {!mobile && (
            <div className={`flex items-center gap-2 ${collapsed ? 'w-full justify-center' : ''}`}>
               
               {/* 1. BELL - EXPANDED MODE (Inside Header) */}
               {!collapsed && (
                  <div className="text-slate-400 hover:text-white transition-colors mr-1">
                     <NotificationBell />
                  </div>
               )}

               {/* 2. TOGGLE BUTTON */}
               <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`
                  p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
                  ${collapsed ? 'bg-slate-800 text-white' : ''} 
                `}
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {collapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
              </button>
            </div>
          )}
        </div>

        {/* 3. BELL - COMPACT MODE ONLY (Centered below header) */}
        {!mobile && collapsed && (
           <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Notifications">
                 <NotificationBell />
              </div>
           </div>
        )}

        {/* CREATE BUTTON */}
        <div className="px-4 mb-2">
          <Link 
            href="/teacher/create" 
            className={`
              flex items-center gap-2 bg-white text-indigo-950 rounded-xl font-black shadow-lg shadow-indigo-900/10 transition-all hover:bg-indigo-50 active:scale-95 group overflow-hidden border border-transparent hover:border-indigo-200
              ${collapsed ? 'justify-center py-3 w-10 mx-auto' : 'justify-center py-3.5 w-full'}
            `}
            title="Create New Test"
          >
            <FilePlus size={18} className="text-indigo-600 group-hover:scale-110 transition-transform shrink-0" /> 
            {!collapsed && (
              <span className="whitespace-nowrap animate-in fade-in duration-200">
                Create New Test
              </span>
            )}
          </Link>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {!collapsed && (
             <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-4 animate-in fade-in duration-300">Main Menu</p>
          )}
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/teacher/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`
                  group flex items-center px-3 py-3 rounded-xl font-bold text-sm transition-all relative
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                  ${collapsed ? 'justify-center' : 'justify-between'}
                `}
                title={collapsed ? item.name : ''}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={`shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300'}`} /> 
                  {!collapsed && (
                    <span className="whitespace-nowrap animate-in fade-in duration-200">
                      {item.name}
                    </span>
                  )}
                </div>
                {isActive && !collapsed && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                
                {/* Active Dot for Collapsed Mode */}
                {isActive && collapsed && (
                   <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-slate-900"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* USER FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center flex-col' : 'justify-between'}`}>
            
            <Link href="/teacher/settings" className={`flex items-center gap-3 flex-1 group rounded-lg p-2 transition-colors ${!collapsed && '-ml-2 hover:bg-slate-800'}`}>
              <div className="relative">
                <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 shrink-0 border border-slate-600 group-hover:border-indigo-500 transition-colors">
                   {user?.photoURL ? (
                     <img src={user.photoURL} alt="Me" className="w-full h-full rounded-full object-cover" />
                   ) : (
                     <GraduationCap size={18} />
                   )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              
              {!collapsed && (
                <div className="overflow-hidden text-left animate-in fade-in duration-200">
                  <p className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {user?.displayName || 'Professor'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">Setting</p>
                </div>
              )}
            </Link>

            <button 
              onClick={() => signOut(auth)}
              className={`text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors ${collapsed ? 'p-2 mt-2 bg-slate-800' : 'p-2'}`}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* 📱 MOBILE HEADER (Menu Left, Bell Right) */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 border-b border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 hover:bg-slate-800 rounded-lg transition"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 font-black text-lg">
            <BookOpen size={20} className="text-indigo-500"/>
            Edify<span className="text-indigo-400">Teacher</span>
          </div>
        </div>
        
        <div className="text-slate-300">
           <NotificationBell />
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
            <SidebarContent mobile={true} />
          </aside>
        </div>
      )}

      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside 
        className={`
          hidden md:block fixed h-full bg-slate-900 text-white z-20 border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main 
        className={`
          flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:ml-20' : 'md:ml-72'}
        `}
      >
        <div className="max-w-7xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
}