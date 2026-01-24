'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { fetchQuestions, Question } from '@/services/quizService'; 
import rawSyllabusData from '@/data/syllabus.json'; 
import QuestionCard from './_components/QuestionCard'; 
import CartItem from './_components/CartItem';
import TestConfigurationModal from './_components/TestConfigurationModal'; 

import { 
  Search, Save, FileText, ChevronRight, ChevronDown, 
  Filter, Layers, Database, Menu, X, ShoppingBag, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- TYPES ---
interface Subtopic { name: string; index: number; }
interface Chapter { chapter: string; index: number; subtopics: Subtopic[]; }
interface Category { category: string; index: number; chapters: Chapter[]; }
interface UIQuestion extends Question { uiDifficulty: 'Easy' | 'Medium' | 'Hard'; }

export default function CreateTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const categories: Category[] = Array.isArray(rawSyllabusData) ? (rawSyllabusData as any) : [];

  // --- STATE ---
  const [testTitle, setTestTitle] = useState('');
  
  // Navigation State
  const [activeCatIndex, setActiveCatIndex] = useState<number | null>(null);
  const [activeChapIndex, setActiveChapIndex] = useState<number | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<{name: string, index: number} | null>(null);
  
  // Data State
  const [difficultyFilter, setDifficultyFilter] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [availableQuestions, setAvailableQuestions] = useState<UIQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Pagination & Cache
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isCachedData, setIsCachedData] = useState(false);

  // Cart & Modal State
  const [addedQuestions, setAddedQuestions] = useState<UIQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  // UI Toggles (Mobile)
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 

  // --- CACHE HELPERS (7 Days TTL) ---
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; 
  
  // 🟢 LOGIC UPDATE: Cache key remains the same, as it depends on UI selection, not DB structure
  const getCacheKey = (subIdx: number, diff: string) => `quiz_cache_${activeCatIndex}_${activeChapIndex}_${subIdx}_${diff}`;

  const saveToCache = (key: string, questions: UIQuestion[]) => { 
    try { 
      const payload = JSON.stringify({ timestamp: Date.now(), data: questions });
      localStorage.setItem(key, payload);
    } catch(e: any) { 
      if (e.name === 'QuotaExceededError') {
        try {
          Object.keys(localStorage).forEach(k => k.startsWith('quiz_cache_') && localStorage.removeItem(k));
          localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data: questions }));
        } catch (retryError) { console.error("Cache Full", retryError); }
      }
    } 
  };

  const loadFromCache = (key: string): UIQuestion[] | null => { 
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - (parsed.timestamp || 0) > CACHE_TTL) { localStorage.removeItem(key); return null; }
      return parsed.data; 
    } catch(e) { return null; }
  };

  // --- FETCH LOGIC (UPDATED FOR FLAT STRUCTURE) ---
  const handleFetch = async (subtopic: typeof selectedSubtopic, difficulty: typeof difficultyFilter, cursor: DocumentSnapshot | string | null) => {
    // Safety check
    if (activeCatIndex === null || activeChapIndex === null || !subtopic) return;
    
    const cacheKey = getCacheKey(subtopic.index, difficulty);
    
    // 1. Check Cache (Only on initial load, not load more)
    if (!cursor) {
      const cached = loadFromCache(cacheKey);
      if (cached && cached.length > 0) {
        setAvailableQuestions(cached); 
        // 🟢 NOTE: We store the last ID string for cache recovery
        setLastDoc(cached[cached.length - 1].id); 
        setIsCachedData(true); 
        setHasMore(true); 
        return;
      }
    }
    
    setLoadingQuestions(true);
    try {
      // 🟢 LOGIC UPDATE: Pass raw numbers. The Service handles padding/strings.
      const pathIds = { 
        subjectId: "01", 
        topicId: activeCatIndex, 
        chapterId: activeChapIndex, 
        subtopicId: subtopic.index 
      };

      const { questions, lastDoc: newCursor } = await fetchQuestions(pathIds, difficulty, cursor);
      
      const formatted: UIQuestion[] = questions.map(q => ({ 
        ...q, 
        // Handle potentially different data shapes from legacy uploads
        text: typeof q.question === 'object' ? (q.question as any).uz || "Question Text" : q.question || "Question Text", 
        uiDifficulty: difficulty 
      }));
      
      setAvailableQuestions(prev => { 
        const upd = cursor ? [...prev, ...formatted] : formatted; 
        saveToCache(cacheKey, upd); 
        return upd; 
      });
      
      setLastDoc(newCursor); 
      setIsCachedData(false); 
      
      // If we got fewer than requested (5), we reached the end
      if (questions.length < 5) setHasMore(false);

    } catch (err) { 
      console.error(err); 
      toast.error("Failed to load questions"); 
    } finally { 
      setLoadingQuestions(false); 
    }
  };

  // --- HANDLERS (Unchanged) ---
  const handleSelectionChange = (newSub: typeof selectedSubtopic, newDiff: typeof difficultyFilter) => {
    if (!newSub) return; 
    setAvailableQuestions([]); setLastDoc(null); setHasMore(true); setIsCachedData(false); 
    handleFetch(newSub, newDiff, null);
    if (window.innerWidth < 1024) setIsSyllabusOpen(false); 
  };
  
  const handleLoadMore = () => { if (!lastDoc) return; handleFetch(selectedSubtopic, difficultyFilter, lastDoc); };
  const onDifficultyClick = (d: any) => { if (d === difficultyFilter) return; setDifficultyFilter(d); handleSelectionChange(selectedSubtopic, d); };
  const onSubtopicClick = (sub: any) => { setSelectedSubtopic(sub); handleSelectionChange(sub, difficultyFilter); };
  const handleAddQuestion = (q: UIQuestion) => { 
    if (addedQuestions.find(i => i.id === q.id)) return; 
    setAddedQuestions([...addedQuestions, q]); 
    toast.success("Added to test", { icon: '👍', duration: 1500 });
  };
  const handleRemoveQuestion = (qId: string) => setAddedQuestions(addedQuestions.filter(q => q.id !== qId));
  const handlePublishClick = () => {
    if (!testTitle.trim()) return toast.error("Please enter a test title");
    if (addedQuestions.length === 0) return toast.error("Add at least one question");
    setIsConfigModalOpen(true);
  };

  const handleFinalPublish = async (settings: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'custom_tests'), {
        teacherId: user.uid, teacherName: user.displayName, title: testTitle,
        accessCode: settings.accessCode, duration: settings.duration, shuffle: settings.shuffleQuestions,
        resultsVisibility: settings.resultsVisibility || 'never',
        status: 'active', createdAt: serverTimestamp(),
        questionCount: addedQuestions.length, questions: addedQuestions 
      });
      toast.success("Test Published!"); setIsConfigModalOpen(false); router.push('/teacher/dashboard');
    } catch (error) { console.error(error); toast.error("Failed to publish"); } finally { setIsSaving(false); }
  };

  if (!categories.length) return <div className="p-10 text-center">Data Error</div>;

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col overflow-hidden">
      
      <TestConfigurationModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={handleFinalPublish}
        questionCount={addedQuestions.length}
        testTitle={testTitle}
        isSaving={isSaving}
      />

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 z-20 shadow-sm relative">
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <button onClick={() => setIsSyllabusOpen(!isSyllabusOpen)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg active:bg-slate-200">
            <Menu size={20} />
          </button>
          
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-indigo-200 shadow-lg">
            <Sparkles size={18} />
          </div>
          
          <input 
            type="text" 
            placeholder="Untitled Test..." 
            className="text-lg font-bold text-slate-800 placeholder:text-slate-400 border-none outline-none bg-transparent w-full max-w-md focus:ring-0 p-0"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {addedQuestions.length} Questions
          </div>
          <button 
            onClick={handlePublishClick} 
            disabled={isSaving} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={16} /> <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* --- A. SYLLABUS --- */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 shadow-2xl lg:shadow-none
          ${isSyllabusOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-full
        `}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Layers size={16} className="text-indigo-500"/> Syllabus</h2>
            <button onClick={() => setIsSyllabusOpen(false)} className="lg:hidden text-slate-400 p-2"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar pb-20 lg:pb-2">
            {categories.map(cat => (
              <div key={cat.index} className="mb-1">
                <button 
                  onClick={() => setActiveCatIndex(activeCatIndex === cat.index ? null : cat.index)} 
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex justify-between items-center transition-colors ${activeCatIndex === cat.index ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {cat.category} <ChevronRight size={14} className={`transition-transform ${activeCatIndex === cat.index ? 'rotate-90' : ''}`}/>
                </button>
                {activeCatIndex === cat.index && (
                  <div className="ml-3 pl-3 border-l-2 border-slate-100 my-1 space-y-1">
                    {cat.chapters.map(chap => (
                      <div key={chap.index}>
                        <button 
                          onClick={() => setActiveChapIndex(activeChapIndex === chap.index ? null : chap.index)} 
                          className={`w-full text-left px-2 py-1.5 rounded text-xs font-semibold flex justify-between hover:text-indigo-600 ${activeChapIndex === chap.index ? 'text-indigo-600' : 'text-slate-500'}`}
                        >
                          <span className="truncate">{chap.chapter}</span>
                        </button>
                        {activeChapIndex === chap.index && chap.subtopics.map(sub => (
                          <button 
                            key={sub.index} 
                            onClick={() => onSubtopicClick(sub)} 
                            className={`w-full text-left px-3 py-2 rounded-md text-[11px] font-medium truncate mt-0.5 transition-all ${selectedSubtopic?.index === sub.index ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {isSyllabusOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsSyllabusOpen(false)} />}

        {/* --- B. MAIN FEED --- */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/50 w-full">
          <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 bg-slate-50/80 backdrop-blur-sm z-10 sticky top-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 truncate">
                 {selectedSubtopic ? selectedSubtopic.name : "Select a topic"}
              </h3>
              {isCachedData && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0"><Database size={10}/> Instant</span>}
            </div>
            
            <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
              {['Easy', 'Medium', 'Hard'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => onDifficultyClick(lvl as any)} 
                  className={`px-3 md:px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${difficultyFilter === lvl ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 md:px-6 pb-28 lg:pb-6 custom-scrollbar">
            {!selectedSubtopic ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4"><Filter size={32} className="opacity-20"/></div>
                <p className="text-sm font-medium">Select a subtopic</p>
              </div>
            ) : availableQuestions.length === 0 && !loadingQuestions ? (
              <div className="text-center py-20 text-slate-400 text-sm">No questions found.</div>
            ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                {availableQuestions.map((q, idx) => ( // 🟢 FIX: Added parentheses around (q, idx)
                  <QuestionCard 
                    key={q.id} 
                    question={q} 
                    index={idx + 1}
                    isAdded={addedQuestions.some(add => add.id === q.id)} 
                    onAdd={() => handleAddQuestion(q)} 
                  />
                ))}
                
                {hasMore && (
                  <div className="py-8 text-center">
                    <button 
                      onClick={handleLoadMore} 
                      disabled={loadingQuestions} 
                      className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-6 py-3 rounded-xl hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-all w-full md:w-auto"
                    >
                      {loadingQuestions ? 'Loading...' : 'Load More Questions'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* --- C. CART DRAWER --- */}
        <aside className={`
          fixed lg:static inset-x-0 bottom-0 lg:inset-y-0 lg:right-0 z-50 
          w-full lg:w-80 bg-slate-900 text-white 
          transform transition-transform duration-300 ease-out
          ${isCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
          lg:translate-x-0 flex flex-col border-t lg:border-l border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none 
          h-[85vh] lg:h-full rounded-t-3xl lg:rounded-none
        `}>
          <div className="lg:hidden flex justify-center pt-3 pb-1 w-full" onClick={() => setIsCartOpen(false)}>
             <div className="w-12 h-1.5 bg-slate-700 rounded-full cursor-pointer"></div>
          </div>

          <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div>
               <h3 className="font-bold flex items-center gap-2 text-indigo-400"><ShoppingBag size={18}/> Review Test</h3>
               <p className="text-xs text-slate-400 mt-0.5">{addedQuestions.length} Questions selected</p>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 bg-slate-800 rounded-full hover:bg-slate-700"><X size={16}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {addedQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center">
                <FileText size={32} className="mb-3 opacity-20"/>
                <p className="text-sm">Your test is empty.</p>
                <p className="text-xs text-slate-500 mt-1">Add questions from the list.</p>
              </div>
            ) : (
              addedQuestions.map((q, idx) => (
                <CartItem key={q.id} index={idx + 1} question={q} onRemove={() => handleRemoveQuestion(q.id)} />
              ))
            )}
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800 pb-8 lg:pb-4 shrink-0">
             <button 
               onClick={handlePublishClick}
               className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl font-bold text-white shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/80 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               Finalize & Publish
             </button>
          </div>
        </aside>

        {isCartOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />}

        {/* --- D. FLOATING ACTION BUTTON --- */}
        {!isCartOpen && (
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-auto">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 bg-slate-900 text-white pl-5 pr-6 py-3 rounded-full shadow-2xl shadow-slate-900/40 hover:scale-105 transition-transform active:scale-95 ring-2 ring-white/10 backdrop-blur-md"
            >
              <div className="relative">
                <ShoppingBag size={20} />
                {addedQuestions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] flex items-center justify-center font-bold border border-slate-900 animate-in zoom-in">
                    {addedQuestions.length}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm whitespace-nowrap">Review Selection</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}