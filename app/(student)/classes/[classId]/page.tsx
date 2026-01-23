'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  ChevronLeft, FileText, BarChart2, Info, LogOut, 
  BookOpen, User, Hash, Calendar
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// 👇 Import new component
import AssignmentsTab from './_components/AssignmentsTab';

export default function StudentClassPage() {
  const { classId } = useParams() as { classId: string };
  const { user } = useAuth();
  const router = useRouter();

  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'grades' | 'info'>('assignments');

  useEffect(() => {
    if (!user) return; 

    async function fetchData() {
      setLoading(true);
      try {
        // A. Fetch Class
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
          toast.error("Class not found");
          router.push('/classes');
          return;
        }
        setClassData({ id: classSnap.id, ...classSnap.data() });

        // B. Fetch Assignments
        const assignQuery = query(
          collection(db, 'classes', classId, 'assignments'), 
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        const assignSnap = await getDocs(assignQuery);
        const allAssignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const myAssignments = allAssignments.filter((a: any) => 
          a.assignedTo === 'all' || 
          (Array.isArray(a.assignedTo) && a.assignedTo.includes(user!.uid))
        );
        setAssignments(myAssignments);

        // C. Fetch Attempts
        const attemptQuery = query(
          collection(db, 'attempts'), 
          where('classId', '==', classId),
          where('userId', '==', user!.uid)
        );
        const attemptSnap = await getDocs(attemptQuery);
        setMyAttempts(attemptSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e: any) {
        console.error(e);
        if (e.code === 'permission-denied') {
          toast.error("Access Denied");
          router.push('/classes');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [classId, user, router]);

  const handleLeaveClass = async () => {
    if(!confirm("Are you sure you want to leave?")) return;
    try {
      await updateDoc(doc(db, 'classes', classId), { studentIds: arrayRemove(user?.uid) });
      toast.success("Left class successfully");
      router.push('/classes');
    } catch(e) { toast.error("Failed to leave"); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
       <div className="h-4 w-32 bg-slate-200 rounded"></div>
       <div className="space-y-4">
         <div className="h-10 w-3/4 bg-slate-200 rounded-lg"></div>
         <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
       </div>
       <div className="flex gap-4 border-b border-slate-200 pb-4">
         <div className="h-8 w-24 bg-slate-200 rounded-full"></div>
         <div className="h-8 w-24 bg-slate-200 rounded-full"></div>
       </div>
       <div className="space-y-4">
         {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>)}
       </div>
    </div>
  );

  if (!classData) return null;

  return (
    <div className="max-w-4xl mx-auto pb-20 px-6 pt-8">
      
      {/* 1. HEADER */}
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <Link href="/classes" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-4 transition-colors group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Back to My Classes
        </Link>
        <div className="flex items-start justify-between gap-4">
           <div>
             <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
               <BookOpen className="text-indigo-600 hidden md:block" size={32} strokeWidth={2.5} />
               {classData.title}
             </h1>
             <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
               {classData.description || "Welcome to your class workspace."}
             </p>
           </div>
           {/* Teacher Badge */}
           <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                {classData.teacherName?.[0] || 'T'}
              </div>
              <div className="text-sm">
                <p className="text-slate-400 font-bold text-[10px] uppercase">Instructor</p>
                <p className="font-bold text-slate-700">{classData.teacherName}</p>
              </div>
           </div>
        </div>
      </div>

      {/* 2. TABS */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-8 w-full md:w-fit overflow-x-auto">
        {[
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'grades', label: 'My Grades', icon: BarChart2 },
          { id: 'info', label: 'Class Info', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${isActive ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
               <Icon size={16} strokeWidth={2.5} /> {tab.label}
             </button>
          )
        })}
      </div>

      {/* 3. CONTENT AREA */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">
        
        {/* A. ASSIGNMENTS TAB (Uses new component) */}
        {activeTab === 'assignments' && (
          <AssignmentsTab 
            assignments={assignments} 
            myAttempts={myAttempts} 
            classId={classId} 
          />
        )}

        {/* B. GRADES TAB (Simplified for Single Attempt Mode) */}
{activeTab === 'grades' && (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
     <table className="w-full text-sm text-left">
     <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
  <tr>
    <th className="p-5 pl-6">Assignment</th>
    <th className="p-5 hidden sm:table-cell">Last Submitted</th>
    <th className="p-5 text-center">Tries</th>
    <th className="p-5 text-center">Current Score</th>
    <th className="p-5 text-right pr-6">Action</th>
  </tr>
</thead>
       <tbody className="divide-y divide-slate-100">
         {myAttempts.length === 0 ? (
           <tr>
             <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
               No grades recorded yet.
             </td>
           </tr>
         ) : (
           myAttempts.map((attempt) => {
             const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
             let badgeColor = 'bg-slate-100 text-slate-600';
             if (percentage >= 80) badgeColor = 'bg-green-100 text-green-700 border-green-200';
             else if (percentage >= 50) badgeColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
             else badgeColor = 'bg-red-100 text-red-700 border-red-200';

             return (
               <tr key={attempt.id} className="group hover:bg-slate-50/50 transition-colors">
                 <td className="p-5 pl-6 font-bold text-slate-800">
                   {attempt.testTitle}
                 </td>
                 <td className="p-5 text-slate-500 font-medium hidden sm:table-cell">
                   {attempt.submittedAt?.seconds ? new Date(attempt.submittedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                 </td>
                 <td className="p-5 text-center">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                      {attempt.attemptsTaken || 1}x
                    </span>
                 </td>
                 <td className="p-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border text-xs ${badgeColor}`}>
                      {percentage}% <span className="opacity-40">|</span> {attempt.score}/{attempt.totalQuestions}
                    </span>
                 </td>
                 <td className="p-5 pr-6 text-right">
                    <Link 
                      href={`/classes/${classId}/test/${attempt.assignmentId}/results`}
                      className="text-indigo-600 font-bold hover:underline text-xs"
                    >
                      View Result
                    </Link>
                 </td>
               </tr>
             );
           })
         )}
       </tbody>
     </table>
  </div>
)}

        {/* C. INFO TAB */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2"><Info size={20} className="text-indigo-600"/> Class Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm"><User size={20}/></div>
                   <div><p className="text-[10px] font-bold text-slate-400 uppercase">Teacher</p><p className="font-bold text-slate-800">{classData.teacherName || 'Unknown'}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm"><Hash size={20}/></div>
                   <div><p className="text-[10px] font-bold text-slate-400 uppercase">Join Code</p><p className="font-mono font-bold text-slate-800 text-lg tracking-widest">{classData.joinCode}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm"><Calendar size={20}/></div>
                   <div><p className="text-[10px] font-bold text-slate-400 uppercase">Created</p><p className="font-bold text-slate-800">{classData.createdAt?.seconds ? new Date(classData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                 <h4 className="font-bold text-red-800 mb-2">Danger Zone</h4>
                 <p className="text-red-600/80 text-sm mb-6">Leaving this class will remove you from the student list. You will lose access to all assignments.</p>
                 <button onClick={handleLeaveClass} className="w-full py-3.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm flex items-center justify-center gap-2 group">
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> Leave Class
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}