'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Users, Plus, Loader2 } from 'lucide-react';
import ClassCard from './_components/ClassCard';
import CreateClassModal from './_components/CreateClassModal';

export default function ClassesPage() {
  const { user, loading } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to classes where teacherId == me
    const q = query(
      collection(db, 'classes'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">My Classes</h1>
            <p className="text-sm md:text-base text-slate-600 mt-1">Manage students, rosters, and join requests.</p>
          </div>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200/50 transition-all active:scale-95 hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <Plus size={20} /> 
            <span>Create New Class</span>
          </button>
        </div>

        {/* Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))
          ) : (
            <div className="col-span-full py-16 md:py-20 text-center flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 backdrop-blur-sm shadow-md">
              <div className="p-4 bg-indigo-50 rounded-full mb-4">
                <Users size={48} className="text-indigo-200" />
              </div>
              <p className="font-bold text-base md:text-lg text-slate-700">No classes found.</p>
              <p className="text-xs md:text-sm mt-1 mb-6 text-slate-500">Create your first class to invite students.</p>
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="text-sm font-bold text-indigo-600 bg-white border-2 border-indigo-200 px-6 py-2.5 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                <Plus size={16} /> Create Class
              </button>
            </div>
          )}
        </div>

        {/* Create Modal */}
        <CreateClassModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
        />

      </div>
    </div>
  );
}