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

// Floating Particles Background
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(particle.id) * 50, 0],
            opacity: [particle.opacity, particle.opacity * 0.1, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Glowing Orb Component
interface GlowingOrbProps {
    color: string;
    size: number;
    position: { x: string; y: string };
  }
  
const GlowingOrb = ({ color, size, position }: GlowingOrbProps) => {
    return (
      <motion.div
        className={`absolute rounded-full ${color} blur-3xl opacity-20`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: position.x,
          top: position.y,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  };

export default function StudentClassPage() {
  const { classId } = useParams() as { classId: string };
  const { user } = useAuth();
  const router = useRouter();

  const [classData, setClassData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');

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

        const myAssignments = allAssignments.filter((a) => 
          a.assignedTo === 'all' || 
          (Array.isArray(a.assignedTo) && a.assignedTo.includes(user.uid))
        );
        setAssignments(myAssignments);

        // C. Fetch Attempts
        const attemptQuery = query(
          collection(db, 'attempts'), 
          where('classId', '==', classId),
          where('userId', '==', user.uid)
        );
        const attemptSnap = await getDocs(attemptQuery);
        setMyAttempts(attemptSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <GlowingOrb color="bg-blue-500" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-500" size={400} position={{ x: '85%', y: '15%' }} />
      <GlowingOrb color="bg-orange-500" size={250} position={{ x: '70%', y: '80%' }} />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10 pt-16 md:pt-8">
         <div className="h-4 w-32 bg-slate-700 rounded"></div>
         <div className="space-y-4">
           <div className="h-10 w-3/4 bg-slate-700 rounded-lg"></div>
           <div className="h-4 w-1/2 bg-slate-700 rounded"></div>
         </div>
         <div className="flex gap-4 border-b border-slate-700 pb-4">
           <div className="h-8 w-24 bg-slate-700 rounded-full"></div>
           <div className="h-8 w-24 bg-slate-700 rounded-full"></div>
         </div>
         <div className="space-y-4">
           {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-800/90 backdrop-blur-xl rounded-xl border border-slate-700"></div>)}
         </div>
      </div>
    </div>
  );

  if (!classData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Glowing Orbs */}
      <GlowingOrb color="bg-blue-500" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-500" size={400} position={{ x: '85%', y: '15%' }} />
      <GlowingOrb color="bg-orange-500" size={250} position={{ x: '70%', y: '80%' }} />
      
      <div className="max-w-4xl mx-auto pb-20 px-4 md:px-6 pt-16 md:pt-8 relative z-10">
        
        {/* 1. HEADER */}
        <div className="mb-8">
          <Link href="/classes" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-400 mb-4 transition-colors group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Back to My Classes
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
             <div>
               <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                 <BookOpen className="text-blue-400" size={28} strokeWidth={2.5} />
                 {classData.title}
               </h1>
               <p className="text-slate-400 font-medium text-base leading-relaxed max-w-2xl">
                 {classData.description || "Welcome to your class workspace."}
               </p>
             </div>
             {/* Teacher Badge */}
             <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {classData.teacherName?.[0] || 'T'}
                </div>
                <div className="text-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Instructor</p>
                  <p className="font-bold text-white">{classData.teacherName}</p>
                </div>
             </div>
          </div>
        </div>

        {/* 2. TABS */}
        <div className="flex p-1 bg-slate-800/50 rounded-xl mb-8 w-full overflow-x-auto scrollbar-hide">
          {[
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'grades', label: 'My Grades', icon: BarChart2 },
            { id: 'info', label: 'Class Info', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
               <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                 <Icon size={16} strokeWidth={2.5} /> {tab.label}
               </button>
            )
          })}
        </div>

        {/* 3. CONTENT AREA */}
        <div className="min-h-[400px]">
          
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
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
               <table className="w-full text-sm text-left">
               <thead className="bg-slate-800/50 text-slate-400 font-bold border-b border-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4 pl-5">Assignment</th>
                <th className="p-4 hidden sm:table-cell">Last Submitted</th>
                <th className="p-4 text-center">Tries</th>
                <th className="p-4 text-center">Current Score</th>
                <th className="p-4 text-right pr-5">Action</th>
              </tr>
            </thead>
               <tbody className="divide-y divide-slate-700/50">
                 {myAttempts.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                       No grades recorded yet.
                     </td>
                   </tr>
                 ) : (
                   myAttempts.map((attempt) => {
                     const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                     let badgeColor = 'bg-slate-700 text-slate-300 border-slate-600';
                     if (percentage >= 80) badgeColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                     else if (percentage >= 50) badgeColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                     else badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';

                     return (
                       <tr key={attempt.id} className="group hover:bg-slate-800/50 transition-colors">
                         <td className="p-4 pl-5 font-bold text-white">
                           {attempt.testTitle}
                         </td>
                         <td className="p-4 text-slate-400 font-medium hidden sm:table-cell">
                           {attempt.submittedAt?.seconds ? new Date(attempt.submittedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                         </td>
                         <td className="p-4 text-center">
                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold">
                              {attempt.attemptsTaken || 1}x
                            </span>
                         </td>
                         <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border text-xs ${badgeColor}`}>
                              {percentage}% <span className="opacity-40">|</span> {attempt.score}/{attempt.totalQuestions}
                            </span>
                         </td>
                         <td className="p-4 pr-5 text-right">
                            <Link 
                              href={`/classes/${classId}/test/${attempt.assignmentId}/results`}
                              className="text-blue-400 font-bold hover:text-blue-300 text-xs"
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
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-slate-700 shadow-lg space-y-6">
                <h3 className="font-black text-white text-lg flex items-center gap-2"><Info size={20} className="text-blue-400"/> Class Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                     <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 border border-slate-600"><User size={20}/></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase">Teacher</p><p className="font-bold text-white">{classData.teacherName || 'Unknown'}</p></div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                     <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 border border-slate-600"><Hash size={20}/></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase">Join Code</p><p className="font-mono font-bold text-white text-lg tracking-widest">{classData.joinCode}</p></div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                     <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 border border-slate-600"><Calendar size={20}/></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase">Created</p><p className="font-bold text-white">{classData.createdAt?.seconds ? new Date(classData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/30 text-center">
                   <h4 className="font-bold text-red-400 mb-2">Danger Zone</h4>
                   <p className="text-red-400/80 text-sm mb-6">Leaving this class will remove you from the student list. You will lose access to all assignments.</p>
                   <button onClick={handleLeaveClass} className="w-full py-3.5 bg-slate-800 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all shadow-lg flex items-center justify-center gap-2 group">
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> Leave Class
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { motion } from 'framer-motion';