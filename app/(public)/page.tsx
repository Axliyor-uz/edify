import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Zap, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      
      {/* 1. HERO SECTION */}
      <section className="w-full max-w-4xl px-4 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Zap size={14} fill="currentColor" />
          The #1 Way to Master Algebra
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
          Master Math <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            One Level at a Time.
          </span>
        </h1>
        
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join 1,000+ students gamifying their education. Track your streaks, earn XP, and conquer the syllabus with interactive lessons.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/auth/signup" 
            className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Start Learning Free <ArrowRight size={20} />
          </Link>
          <Link 
            href="/syllabus" 
            className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-100 font-bold text-lg rounded-2xl hover:border-slate-200 hover:bg-slate-50 transition-all"
          >
            View Syllabus
          </Link>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="w-full bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Gamified Progress</h3>
            <p className="text-slate-500 leading-relaxed">
              Earn XP for every correct answer. Level up your profile and compete on the weekly leaderboard.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
              <Flame size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Daily Streaks</h3>
            <p className="text-slate-500 leading-relaxed">
              Build a habit that sticks. Our streak system keeps you motivated to practice just 5 minutes a day.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Mastery Tracking</h3>
            <p className="text-slate-500 leading-relaxed">
              Visualize your knowledge. We track your weak points and help you turn them into strengths.
            </p>
          </div>

        </div>
      </section>

      {/* 3. SOCIAL PROOF */}
      <section className="py-20 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8">Trusted by students from</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
           <span className="font-black text-xl">NewUU</span>
           <span className="font-black text-xl">Inha</span>
           <span className="font-black text-xl">Westminster</span>
           <span className="font-black text-xl">Amity</span>
        </div>
      </section>

    </div>
  );
}