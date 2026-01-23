'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { FolderOpen, Archive, Loader2, Search } from 'lucide-react';
import TestCard from './_components/TestCard';
import EditTestModal from './_components/EditTestModal';
import PrintLauncher from '@/components/PrintLauncher';

export default function LibraryPage() {
  const { user, loading } = useAuth();
  
  // State
  const [tests, setTests] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch Tests Real-time
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'custom_tests'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTests(data);
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filtering Logic
  const filteredTests = tests.filter(test => {
    const matchesStatus = (test.status || 'active') === filter;
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          test.accessCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleManage = (test: any) => {
    setSelectedTest(test);
    setIsEditOpen(true);
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-6 py-6 md:py-8">
        
        {/* 1. Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">My Library</h1>
            <p className="text-sm md:text-base text-slate-600 mt-1">Manage and monitor your created assessments.</p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border-2 border-slate-200 shadow-md w-full md:w-auto">
             <button 
               onClick={() => setFilter('active')}
               className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${filter === 'active' ? 'bg-indigo-50 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               <FolderOpen size={16}/> 
               <span className="hidden sm:inline">Active</span>
             </button>
             <button 
               onClick={() => setFilter('archived')}
               className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${filter === 'archived' ? 'bg-slate-100 text-slate-700 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               <Archive size={16}/> 
               <span className="hidden sm:inline">Archived</span>
             </button>
          </div>
          
        </div>
        

        {/* 2. Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Title or Access Code..." 
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border-2 border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all shadow-md hover:shadow-lg text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 3. Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                onManage={() => handleManage(test)} 
              />
            ))
          ) : (
            <div className="col-span-full py-16 md:py-20 text-center flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 backdrop-blur-sm">
              <FolderOpen size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-base md:text-lg">No {filter} tests found.</p>
              <p className="text-xs md:text-sm mt-1">Create a new test to get started.</p>
            </div>
          )}
        </div>

       {/* 4. Edit Modal */}
       {selectedTest && (
          <EditTestModal 
            key={selectedTest.id} // 👈 THIS IS THE MAGIC FIX. Forces full reset.
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)} 
            test={selectedTest} 
          />
        )}

      </div>
    </div>
  );
}