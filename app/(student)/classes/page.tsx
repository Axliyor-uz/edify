'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import JoinClassModal from './_components/JoinClassModal';
import { 
  GraduationCap, Users, ChevronRight, Plus, BookOpen, 
  ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          className="absolute rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
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
const GlowingOrb = ({ color, size, position }: { color: string; size: number; position: { x: string; y: string } }) => {
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

export default function MyClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'classes'), 
          where('studentIds', 'array-contains', user.uid)
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setClasses(data);
      } catch (e) {
        console.error("Error fetching classes:", e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClasses();
  }, [user]);

  // --- SKELETON LOADING ---
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8 relative z-10">
        <div className="flex justify-between items-end animate-pulse">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-64 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-12 w-40 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg)' }}></div>
               <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
               <div className="h-16 w-full bg-slate-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Glowing Orbs */}
      <GlowingOrb color="bg-indigo-500" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-500" size={400} position={{ x: '85%', y: '15%' }} />
      <GlowingOrb color="bg-blue-500" size={250} position={{ x: '70%', y: '80%' }} />
      
      <div className="max-w-6xl mx-auto pb-20 p-6 md:p-8 relative z-10">
        
        {/* MODAL */}
        <JoinClassModal 
          isOpen={isJoinModalOpen} 
          onClose={() => setIsJoinModalOpen(false)} 
        />
        
        {/* HEADER SECTION */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <GraduationCap size={28} />
              </div>
              My Classes
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">
              Continue where you left off.
            </p>
          </div>
          
          {/* JOIN BUTTON */}
          <motion.button 
            onClick={() => setIsJoinModalOpen(true)}
            className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 hover:shadow-indigo-300"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={18} strokeWidth={3} /> Join New Class
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </motion.button>
        </div>

        {/* CLASS GRID */}
        {classes.length === 0 ? (
          // EMPTY STATE
          <motion.div 
            className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center shadow-sm relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <BookOpen size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No classes found</h3>
              <p className="text-slate-400 font-medium text-base mb-8 max-w-sm mx-auto leading-relaxed">
                You haven't enrolled in any classes yet. Ask your teacher for a 6-digit Join Code!
              </p>
              
              <motion.button 
                onClick={() => setIsJoinModalOpen(true)}
                className="text-indigo-600 font-black text-base hover:underline hover:text-indigo-700 flex items-center gap-2"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                Join a class now <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          // LIST OF CLASSES
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  href={`/classes/${cls.id}`}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                        {cls.joinCode || 'CLASS'}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm">
                         <ChevronRight size={16} strokeWidth={3} />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-1">
                      {cls.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed h-10 mb-2">
                      {cls.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-slate-500">
                      <Users size={14} />
                      {cls.studentIds?.length || 0} Students
                    </div>
                    {cls.teacherName && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700">
                          {cls.teacherName.charAt(0)}
                        </div>
                        <span className="truncate max-w-[80px]">{cls.teacherName}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Styles */}
        <style jsx global>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-20deg); }
            100% { transform: translateX(200%) skewX(-20deg); }
          }
          .animate-shimmer {
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
