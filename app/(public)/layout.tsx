'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide nav buttons on auth pages to reduce distraction
  const isAuthPage = pathname.includes('/auth/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // Updated Root Background to match the Dark Theme
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. DARK GLASS NAVBAR */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
          
          {/* Logo Area */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 via-cyan-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Rocket size={18} className="fill-white/20" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              Edify<span className="text-cyan-400">.</span>
            </span>
          </Link>

          {/* Desktop Actions */}
          {!isAuthPage && (
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/auth/login" 
                className="text-sm font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2"
              >
                Log in
              </Link>
              <Link 
                href="/auth/signup" 
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="relative z-10">Get Started</span>
                <ChevronRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform"/>
                {/* Button Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {!isAuthPage && (
            <button 
              className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} className="text-cyan-400" /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown (Slide Down) */}
        <AnimatePresence>
          {isMobileMenuOpen && !isAuthPage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 p-4 flex flex-col gap-3 shadow-2xl md:hidden z-40"
            >
              <Link 
                href="/auth/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3.5 font-bold text-slate-300 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors border border-slate-700"
              >
                Log In
              </Link>
              <Link 
                href="/auth/signup" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3.5 font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                Get Started Free
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. PAGE CONTENT */}
      {/* Background gradient applied here to cover full height even on short pages */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}