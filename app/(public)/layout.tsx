'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Menu, X, ChevronRight, Globe, ChevronDown, Check } from 'lucide-react';
import { useState, createContext, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. CONTEXT DEFINITIONS ---
type LangType = 'uz' | 'en' | 'ru';

interface LangContextType {
  lang: LangType;
  setLang: (lang: LangType) => void;
}

export const LanguageContext = createContext<LangContextType | undefined>(undefined);

// Helper Hook
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within Layout");
  return context;
}

// --- 2. TRANSLATIONS ---
const NAV_TRANSLATIONS = {
  uz: { login: "Kirish", start: "Boshlash", langName: "O'zbek" },
  en: { login: "Log in", start: "Get Started", langName: "English" },
  ru: { login: "Войти", start: "Начать", langName: "Русский" }
};

// --- 3. LANGUAGE DROPDOWN COMPONENT (Desktop) ---
const LanguageDropdown = () => {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: LangType; label: string }[] = [
    { code: 'uz', label: "O'zbek" },
    { code: 'en', label: "English" },
    { code: 'ru', label: "Русский" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
          isOpen 
            ? 'bg-slate-800 border-cyan-500/50 text-white' 
            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Globe size={16} className={isOpen ? "text-cyan-400" : "text-slate-400"} />
        <span className="text-xs font-bold uppercase w-5">{lang}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden p-1.5 z-50"
          >
            {languages.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setLang(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  lang === item.code
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {lang === item.code && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 4. NAVBAR COMPONENT (Consumes Context) ---
const Navbar = () => {
  const pathname = usePathname();
  const isAuthPage = pathname.includes('/auth/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  
  const t = NAV_TRANSLATIONS[lang]; // Get current text

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 h-16 transition-all">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
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
            
            {/* 🟢 Modern Language Dropdown */}
            <LanguageDropdown />

            <div className="h-6 w-px bg-slate-700/50"></div>

            <Link 
              href="/auth/login" 
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2"
            >
              {t.login}
            </Link>
            <Link 
              href="/auth/signup" 
              className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="relative z-10">{t.start}</span>
              <ChevronRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform"/>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        {!isAuthPage && (
          <div className="flex items-center gap-4 md:hidden">
            {/* Mobile Lang Indicator (Small) */}
            <div className="text-xs font-bold uppercase text-cyan-400 bg-cyan-950/30 border border-cyan-900 px-2 py-1 rounded">
                {lang}
            </div>

            <button 
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} className="text-cyan-400" /> : <Menu size={24} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && !isAuthPage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 p-4 flex flex-col gap-3 shadow-2xl md:hidden z-40"
          >
            {/* 🟢 LANGUAGE SWITCHER (Mobile Segmented Control) */}
            <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700 mb-2">
              {(['uz', 'en', 'ru'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${
                    lang === l 
                      ? 'bg-cyan-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <Link 
              href="/auth/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-3.5 font-bold text-slate-300 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors border border-slate-700"
            >
              {t.login}
            </Link>
            <Link 
              href="/auth/signup" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-3.5 font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              {t.start}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- 5. MAIN LAYOUT (Provider Wrapper) ---
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangType>('uz');

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </LanguageContext.Provider>
  );
}