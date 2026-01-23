'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
// 1. Import deleteDoc
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, limit, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  Bell, Check, FileText, UserPlus, Trophy, Eye, Clock, 
  Trash2, ChevronLeft, Filter 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. LISTEN TO ALL NOTIFICATIONS (Limit 50)
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. ACTIONS

  // 🟢 MODIFIED: Delete immediately when clicked
  const handleRead = async (id: string, link?: string) => {
    // Navigate immediately (Optimistic UI) 
    if (link) router.push(link);

    try {
      // Instead of updating 'read: true', we DELETE it
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) { 
      console.error("Error deleting notification:", e); 
    }
  };

  // 🟢 MODIFIED: Delete all UNREAD items when "Mark all read" is clicked
  const markAllRead = async () => {
    const batch = writeBatch(db);
    let hasUpdates = false;

    notifications.forEach(n => {
      // If it's new (unread), we assume "Mark Read" means "I've seen it, remove it"
      if (!n.read) {
        batch.delete(doc(db, 'notifications', n.id));
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications? This cannot be undone.")) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  };

  // 3. ICONS
  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><FileText size={20} /></div>;
      case 'submission': return <div className="bg-green-100 text-green-600 p-3 rounded-full"><Trophy size={20} /></div>;
      case 'request': return <div className="bg-purple-100 text-purple-600 p-3 rounded-full"><UserPlus size={20} /></div>;
      case 'result': return <div className="bg-orange-100 text-orange-600 p-3 rounded-full"><Eye size={20} /></div>;
      default: return <div className="bg-slate-100 text-slate-600 p-3 rounded-full"><Bell size={20} /></div>;
    }
  };

  // 4. TIME FORMATTER
  const getTimeString = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading inbox...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Inbox</h1>
          <p className="text-slate-500 font-medium">Your activity & updates</p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={markAllRead} 
             disabled={!notifications.some(n => !n.read)}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
             title="Dismiss all new notifications"
           >
             <Check size={16} /> Dismiss New
           </button>
           <button 
             onClick={clearAll} 
             disabled={notifications.length === 0}
             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
             title="Clear History"
           >
             <Trash2 size={20} />
           </button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {notifications.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={40} />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
              <p className="text-slate-500">You have no new notifications.</p>
           </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => handleRead(n.id, n.link)}
              className={`relative bg-white p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 ${!n.read ? 'border-indigo-200 shadow-sm' : 'border-slate-100 opacity-80 hover:opacity-100'}`}
            >
              {/* "New" Badge */}
              {!n.read && (
                <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm shadow-indigo-200">
                  NEW
                </span>
              )}

              <div className="flex items-start gap-5">
                {/* Icon */}
                <div className="shrink-0">{getIcon(n.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-base ${!n.read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {n.title}
                      </h3>
                   </div>
                   <p className="text-slate-600 text-sm leading-relaxed mb-3">{n.message}</p>
                   
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {getTimeString(n.createdAt)}
                      </span>
                      {n.link && <span className="text-indigo-500 group-hover:underline">View Details</span>}
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}