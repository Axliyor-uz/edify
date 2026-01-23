'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
// 🟢 1. Add 'collection' and 'query' to imports
import { doc, onSnapshot, getDoc, collection, query } from 'firebase/firestore';
import { Users, UserPlus, Hash, ChevronLeft, Inbox, FileText } from 'lucide-react';
import Link from 'next/link';
import RosterTab from './_components/RosterTab';
import RequestsTab from './_components/RequestsTab';
import AddStudentModal from './_components/AddStudentModal';
import AssignTestModal from './_components/AssignTestModal';
import AssignmentsTab from './_components/AssignmentsTab';

export default function ClassDetailsPage() {
  const { classId } = useParams() as { classId: string };
  
  // --- STATE ---
  const [classData, setClassData] = useState<any>(null);
  const [rosterData, setRosterData] = useState<any[]>([]);
  
  // 🟢 2. Add state for the counter
  const [requestCount, setRequestCount] = useState(0);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'requests'>('students');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<any>(null); 

  // --- LISTENERS ---
  useEffect(() => {
    if (!classId) return;
    const unsubscribe = onSnapshot(doc(db, 'classes', classId), (doc) => {
      if (doc.exists()) {
        setClassData({ id: doc.id, ...doc.data() });
      }
    });
    return () => unsubscribe();
  }, [classId]);

  // 🟢 3. NEW LISTENER: Count the requests in real-time
  useEffect(() => {
    if (!classId) return;
    // Listen to the 'requests' subcollection
    const q = query(collection(db, 'classes', classId, 'requests'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // snapshot.size gives the number of documents in the collection
      setRequestCount(snapshot.size);
    });
    
    return () => unsubscribe();
  }, [classId]);

  // Standard Method: Fetch Student Profiles one by one
  useEffect(() => {
    const fetchRoster = async () => {
      if (!classData?.studentIds || classData.studentIds.length === 0) {
        setRosterData([]);
        return;
      }
      try {
        const promises = classData.studentIds.map((uid: string) => getDoc(doc(db, 'users', uid)));
        const snapshots = await Promise.all(promises);
        const students = snapshots.map((snap, index) => {
          if (snap.exists()) return { uid: snap.id, ...snap.data() };
          return { uid: classData.studentIds[index], displayName: 'Unknown User', username: 'unknown' };
        });
        setRosterData(students);
      } catch (error) { console.error(error); } 
    };
    fetchRoster();
  }, [classData?.studentIds]);

  const handleEditAssignment = (assignment: any) => {
    setAssignmentToEdit(assignment);
    setIsAssignOpen(true);
  };

  const handleCreateAssignment = () => {
    setAssignmentToEdit(null);
    setIsAssignOpen(true);
  };

  if (!classData) return <div className="p-10 text-center text-slate-500">Loading Class...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* --- MODALS --- */}
      <AddStudentModal classId={classId} isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      
      <AssignTestModal 
        classId={classId} 
        isOpen={isAssignOpen} 
        onClose={() => setIsAssignOpen(false)} 
        roster={rosterData} 
        editData={assignmentToEdit} 
      />

      {/* --- HEADER --- */}
      <div>
        <Link href="/teacher/classes" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 transition-colors">
          <ChevronLeft size={14}/> Back to Classes
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{classData.title}</h1>
            <p className="text-slate-500 text-sm font-medium mb-3">{classData.description || "No description provided."}</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                <Hash size={14} className="text-indigo-500"/> 
                Code: <span className="font-mono text-slate-900 bg-slate-100 px-1 rounded ml-1">{classData.joinCode}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                <Users size={14} className="text-indigo-500"/> 
                {classData.studentIds?.length || 0} Students
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsAddOpen(true)}
              className="flex justify-center items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-sm active:scale-95"
            >
              <UserPlus size={18} /> Add Student
            </button>
            <button 
              onClick={handleCreateAssignment}
              className="flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 text-sm"
            >
              <FileText size={18} /> Assign Test
            </button>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-[120px] py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'students' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16} /> Students
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 min-w-[120px] py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText size={16} /> Assignments
          </button>
          
          {/* 🟢 4. UPDATED TAB BUTTON WITH BADGE */}
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 min-w-[120px] py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <Inbox size={16} /> Requests
            {requestCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {requestCount}
              </span>
            )}
          </button>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="p-4 md:p-6 bg-slate-50/30 min-h-[400px]">
          
          {activeTab === 'students' && (
            <RosterTab classId={classId} studentIds={classData.studentIds || []} />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsTab 
              classId={classId}
              roster={rosterData} 
              onEdit={handleEditAssignment} 
              onAdd={handleCreateAssignment} 
            />
          )}
          
          {activeTab === 'requests' && (
            <RequestsTab classId={classId} />
          )}
        </div>
      </div>
    </div>
  );
}