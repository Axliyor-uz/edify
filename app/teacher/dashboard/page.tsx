'use client';

import { useAuth } from '@/lib/AuthContext';
import { 
  PlusCircle, FileText, Users, TrendingUp, 
  LayoutDashboard, Bell, Settings, Library, 
  GraduationCap, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Quick Actions Configuration
  // These are static and cost 0 reads to render
  const quickActions = [
    { 
      label: 'Create Test', 
      desc: 'Build a new quiz', 
      icon: <PlusCircle size={24} />, 
      href: '/teacher/create', 
      color: 'bg-indigo-600 text-white', 
      hover: 'hover:bg-indigo-700' 
    },
    { 
      label: 'My Classes', 
      desc: 'Manage roster', 
      icon: <Users size={24} />, 
      href: '/teacher/classes', 
      color: 'bg-purple-100 text-purple-600', 
      hover: 'hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100' 
    },
    { 
      label: 'Test Library', 
      desc: 'View drafts & archives', 
      icon: <Library size={24} />, 
      href: '/teacher/library', 
      color: 'bg-emerald-100 text-emerald-600', 
      hover: 'hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100' 
    },
    { 
      label: 'Notifications', 
      desc: 'Check alerts', 
      icon: <Bell size={24} />, 
      href: '/teacher/notifications', 
      color: 'bg-amber-100 text-amber-600', 
      hover: 'hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 md:px-6 pt-8">
        
        {/* 1. HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
               <LayoutDashboard size={20} />
               <span className="uppercase tracking-wider text-xs">Teacher Workspace</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Hello, {user?.displayName?.split(' ')[0] || 'Teacher'} 👋
            </h1>
            <p className="text-slate-600 font-medium">Manage your classroom and assessments.</p>
          </div>
          
          {/* Profile Settings Link (Zero Read) */}
          <Link 
            href="/teacher/profile" 
            className="text-slate-400 hover:text-indigo-600 transition-all hover:scale-110"
          >
            <Settings size={24} />
          </Link>
        </header>

        {/* 2. QUICK ACTIONS (ZERO READS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Link 
              key={idx} 
              href={action.href}
              className={`
                relative overflow-hidden p-5 rounded-2xl border-2 
                transition-all duration-300 active:scale-95 group
                hover:-translate-y-1
                ${action.label === 'Create Test' 
                  ? 'shadow-xl shadow-indigo-200/50 border-indigo-600 ' + action.color 
                  : 'bg-white border-slate-200 shadow-md hover:shadow-xl ' + action.hover}
              `}
              style={{
                animationDelay: `${idx * 100}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${action.label === 'Create Test' ? 'bg-white/20' : action.color}`}>
                  {action.icon}
                </div>
                {action.label !== 'Create Test' && (
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-all group-hover:translate-x-1" />
                )}
              </div>
              <div>
                <h3 className={`font-bold text-lg ${action.label === 'Create Test' ? 'text-white' : 'text-slate-800'}`}>
                  {action.label}
                </h3>
                <p className={`text-sm font-medium ${action.label === 'Create Test' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* 3. ANALYTICS OVERVIEW (Use Cached Data or Placeholders) */}
        {/* Note: To keep this "Zero Read", we display static placeholders or numbers stored in the user profile.
            If you want real numbers here, you MUST pay for reads. */}
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500"/> Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Tests */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-5">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">-</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Tests</p>
              </div>
            </div>

            {/* Students */}
            <div className="bg-white p-6 rounded-2xl border-2 border-violet-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-5">
              <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl">
                <GraduationCap size={28} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">-</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Students</p>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">--%</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg. Score</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 4. FOOTER BANNER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-center md:text-left md:flex items-center justify-between shadow-2xl border-2 border-slate-700 hover:shadow-slate-400/20 transition-all duration-300">
          <div>
             <h3 className="text-xl font-bold text-white mb-2">Ready to create a challenge?</h3>
             <p className="text-slate-400 max-w-md text-sm leading-relaxed">
               Select questions from our database or create your own to test your students' knowledge.
             </p>
          </div>
          <Link 
            href="/teacher/create"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all hover:scale-105 shadow-lg"
          >
            Start Building <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}