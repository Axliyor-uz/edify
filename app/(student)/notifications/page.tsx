'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, writeBatch, limit, updateDoc 
} from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  Bell, Check, FileText, UserPlus, Trophy, Eye, Clock, 
  Trash2, Sparkles, Inbox
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentLanguage } from '@/app/(student)/layout'; // 🟢 Import Language Hook

// --- 1. TRANSLATION DICTIONARY ---
const NOTIF_TRANSLATIONS = {
  uz: {
    title: "Bildirishnomalar",
    subtitle: "Faollik va yangilanishlar",
    dismiss: "Yangi xabarlarni o'chirish",
    emptyTitle: "Hammasi ko'rib chiqildi!",
    emptyDesc: "Sizda yangi bildirishnomalar yo'q.",
    time: {
      now: "Hozirgina",
      view: "Batafsil"
    },
    confirmClear: "Barcha bildirishnomalarni o'chirasizmi? Bu amalni qaytarib bo'lmaydi.",
    newBadge: "YANGI"
  },
  en: {
    title: "Inbox",
    subtitle: "Your activity & updates",
    dismiss: "Dismiss New",
    emptyTitle: "All caught up!",
    emptyDesc: "You have no new notifications.",
    time: {
      now: "Just now",
      view: "View Details"
    },
    confirmClear: "Clear all notifications? This cannot be undone.",
    newBadge: "NEW"
  },
  ru: {
    title: "Входящие",
    subtitle: "Активность и обновления",
    dismiss: "Скрыть новые",
    emptyTitle: "Все прочитано!",
    emptyDesc: "У вас нет новых уведомлений.",
    time: {
      now: "Только что",
      view: "Подробнее"
    },
    confirmClear: "Очистить все уведомления? Это действие нельзя отменить.",
    newBadge: "НОВОЕ"
  }
};

// --- TYPES ---
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'submission' | 'request' | 'result' | 'general';
  read: boolean;
  link?: string;
  createdAt: any;
}

interface GlowingOrbProps {
  color: string;
  size: number;
  position: { x: string; y: string };
}

// --- VISUAL COMPONENTS ---
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-indigo-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [particle.opacity, 0, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const GlowingOrb = ({ color, size, position }: GlowingOrbProps) => (
  <motion.div
    className={`absolute rounded-full ${color} blur-3xl opacity-20 pointer-events-none`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      left: position.x,
      top: position.y,
    }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  />
);

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // 🟢 Use Language Hook
  const { lang } = useStudentLanguage();
  const t = NOTIF_TRANSLATIONS[lang];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. LISTEN TO ALL NOTIFICATIONS
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. ACTIONS
  const handleRead = async (notification: Notification) => {
    if (notification.link) router.push(notification.link);
    
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), { read: true });
      } catch (e) { 
        console.error("Error updating notification:", e); 
      }
    }
  };

  const markAllRead = async () => {
    const batch = writeBatch(db);
    let hasUpdates = false;

    notifications.forEach(n => {
      if (!n.read) {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }
  };

  const clearAll = async () => {
    if (!confirm(t.confirmClear)) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  };

  // 3. ICONS
  const getIcon = (type: string) => {
    const baseClass = "p-3 rounded-xl border backdrop-blur-md shadow-lg";
    switch (type) {
      case 'assignment': 
        return <div className={`${baseClass} bg-blue-500/20 text-blue-400 border-blue-500/30`}><FileText size={20} /></div>;
      case 'submission': 
        return <div className={`${baseClass} bg-emerald-500/20 text-emerald-400 border-emerald-500/30`}><Trophy size={20} /></div>;
      case 'request': 
        return <div className={`${baseClass} bg-purple-500/20 text-purple-400 border-purple-500/30`}><UserPlus size={20} /></div>;
      case 'result': 
        return <div className={`${baseClass} bg-orange-500/20 text-orange-400 border-orange-500/30`}><Eye size={20} /></div>;
      default: 
        return <div className={`${baseClass} bg-slate-700/50 text-slate-300 border-slate-600/50`}><Bell size={20} /></div>;
    }
  };

  const getTimeString = (timestamp: any) => {
    if (!timestamp) return t.time.now;
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- SKELETON LOADING ---
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="max-w-3xl mx-auto p-6 pt-12 space-y-8 relative z-10">
        <div className="flex justify-between items-end animate-pulse">
           <div className="h-10 w-40 bg-slate-700/50 rounded-lg"></div>
           <div className="h-10 w-24 bg-slate-700/50 rounded-lg"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-800/80 rounded-2xl border border-slate-700/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
          ))}
        </div>
      </div>
      <style jsx>{` @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <GlowingOrb color="bg-indigo-600" size={300} position={{ x: '10%', y: '10%' }} />
      <GlowingOrb color="bg-pink-600" size={400} position={{ x: '80%', y: '60%' }} />

      <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="pt-12 md:pt-0 text-3xl font-black text-white flex items-center gap-3 tracking-tight">
               <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                 <Inbox size={28} />
               </div>
               {t.title}
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-lg ml-1">
              {t.subtitle}
            </p>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={markAllRead} 
               disabled={!notifications.some(n => !n.read)}
               className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-700 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
               title={t.dismiss}
             >
               <Check size={16} /> {t.dismiss}
             </button>
             <button 
               onClick={clearAll} 
               disabled={notifications.length === 0}
               className="p-2.5 text-slate-400 border border-slate-700 bg-slate-800 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               title="Clear History"
             >
               <Trash2 size={20} />
             </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          <AnimatePresence mode='popLayout'>
            {notifications.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-center py-20 bg-slate-800/50 backdrop-blur-md rounded-3xl border border-dashed border-slate-700"
               >
                  <div className="w-20 h-20 bg-slate-700/50 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600/50 shadow-inner">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-1">{t.emptyTitle}</h3>
                  <p className="text-slate-400">{t.emptyDesc}</p>
               </motion.div>
            ) : (
              notifications.map((n) => (
                <motion.div 
                  key={n.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  onClick={() => handleRead(n)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-xl hover:-translate-y-1 overflow-hidden
                    ${!n.read 
                      ? 'bg-slate-800/80 border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* "New" Badge */}
                  {!n.read && (
                    <span className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-indigo-500/30 tracking-wider">
                      {t.newBadge}
                    </span>
                  )}

                  <div className="flex items-start gap-5 relative z-10">
                    <div className="shrink-0 transition-transform group-hover:scale-110 duration-300">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                       <div className="flex items-center gap-2 mb-1.5 pr-12">
                          <h3 className={`text-base md:text-lg leading-tight ${!n.read ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                            {n.title}
                          </h3>
                       </div>
                       <p className={`text-sm leading-relaxed mb-3 ${!n.read ? 'text-slate-300' : 'text-slate-500'}`}>
                         {n.message}
                       </p>
                       
                       <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-900/30 px-2 py-1 rounded-md">
                            <Clock size={12} /> {getTimeString(n.createdAt)}
                          </span>
                          {n.link && (
                            <span className="text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                              {t.time.view} <Eye size={12}/>
                            </span>
                          )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}