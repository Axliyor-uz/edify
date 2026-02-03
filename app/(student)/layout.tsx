'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext } from 'react'; // 🟢 Added imports
import StudentSidebar from '@/components/StudentSidebar';
import { Loader2 } from 'lucide-react';

export type LangType = 'uz' | 'en' | 'ru';

// 🟢 1. DEFINE CONTEXT
interface StudentLangContextType {
  lang: LangType;
  setLang: (lang: LangType) => void;
}

export const StudentLanguageContext = createContext<StudentLangContextType | undefined>(undefined);

// 🟢 2. EXPORT HOOK
export function useStudentLanguage() {
  const context = useContext(StudentLanguageContext);
  if (!context) throw new Error("useStudentLanguage must be used within StudentLayout");
  return context;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State
  const [lang, setLang] = useState<LangType>('uz');

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
    // 🟢 3. WRAP IN PROVIDER
    <StudentLanguageContext.Provider value={{ lang, setLang }}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Sidebar gets props directly (as we set up before) */}
        <div className="w-0 md:w-72 shrink-0 transition-all duration-300">
          <StudentSidebar lang={lang} setLang={setLang} />
        </div>

        {/* Children (Dashboard) get Lang via Context */}
        <main className="flex-1 min-w-0 overflow-x-hidden relative">
          {children}
        </main>

      </div>
    </StudentLanguageContext.Provider>
  );
}