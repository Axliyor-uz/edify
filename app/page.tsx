'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Rocket, ArrowRight, Target, Flame, Shield, LogIn, LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Rocket size={18} fill="currentColor" />
            </div>
            MathMaster
          </div>

          {/* Dynamic Right Actions */}
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <Link 
                href="/dashboard" 
                className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition flex items-center gap-2"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="text-sm font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-2"
                >
                  <LogIn size={16} /> Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center pt-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8">
          <Flame size={14} fill="currentColor" />
          The #1 Way to Master Algebra
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
          Master Math <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            One Level at a Time.
          </span>
        </h1>
        
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join students gamifying their education. Track your streaks, earn XP, and conquer the syllabus with interactive lessons.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
          {user ? (
             <Link 
               href="/dashboard" 
               className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
             >
               Go to Dashboard <ArrowRight size={20} />
             </Link>
          ) : (
             <Link 
               href="/auth/signup" 
               className="px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-black hover:scale-105 transition-all flex items-center justify-center gap-2"
             >
               Start Learning Free <ArrowRight size={20} />
             </Link>
          )}
        </div>

        {/* FEATURES */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl pb-20 text-left">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <Target className="text-blue-600 mb-4" size={32} />
            <h3 className="font-bold text-lg text-slate-900">Gamified Progress</h3>
            <p className="text-slate-500 text-sm mt-2">Earn XP and level up as you master complex math topics.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <Flame className="text-orange-500 mb-4" size={32} />
            <h3 className="font-bold text-lg text-slate-900">Daily Streaks</h3>
            <p className="text-slate-500 text-sm mt-2">Build a learning habit that sticks with our streak system.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <Shield className="text-green-600 mb-4" size={32} />
            <h3 className="font-bold text-lg text-slate-900">Mastery Tracking</h3>
            <p className="text-slate-500 text-sm mt-2">Visualize your weak points and turn them into strengths.</p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-100 text-center text-slate-400 text-sm font-medium">
        &copy; 2026 MathMaster. Built for students.
      </footer>
    </div>
  );
}