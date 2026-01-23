'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StudentSidebar from '@/components/StudentSidebar';
import { Loader2 } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 gap-2">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <span className="font-bold">Loading EdifyStudent...</span>
      </div>
    );
  }
  
  if (!user) return null; 

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 1. SIDEBAR (Fixed Width: 18rem / 288px) */}
      {/* The component handles fixed positioning internally for visual stability */}
      <div className="w-0 md:w-72 shrink-0 transition-all duration-300">
        <StudentSidebar />
      </div>

      {/* 2. MAIN CONTENT */}
      {/* Flex-1 ensures it fills the remaining width. No padding here, content decides its own. */}
      <main className="flex-1 min-w-0 overflow-x-hidden relative">
        {children}
      </main>

    </div>
  );
}