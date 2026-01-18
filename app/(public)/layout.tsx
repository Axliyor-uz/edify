'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, LogIn } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.includes('/auth/');

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Rocket size={18} fill="currentColor" />
            </div>
            MathMaster
          </Link>

          {/* Right Actions (Hide on Auth pages to reduce distraction) */}
          {!isAuthPage && (
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login" 
                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-2"
              >
                <LogIn size={16} /> Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:scale-105 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="flex-1">
        {children}
      </main>

      {/* SIMPLE FOOTER */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} MathMaster. Built for students.</p>
      </footer>
    </div>
  );
}