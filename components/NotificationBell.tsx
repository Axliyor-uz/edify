'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. LISTEN TO UNREAD COUNT ONLY
  useEffect(() => {
    if (!user) return;
    
    // We only need to know if there are unread items
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false) 
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. CLICK HANDLER
  const handleClick = () => {
    // Check if user is on a teacher path
    const isTeacher = pathname?.startsWith('/teacher');
    
    // Direct navigation
    if (isTeacher) {
      router.push('/teacher/notifications');
    } else {
      router.push('/notifications');
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 group"
      title="View Notifications"
    >
      <Bell size={22} className="group-hover:scale-110 transition-transform" />
      
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 md:border-white shadow-sm animate-bounce">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}