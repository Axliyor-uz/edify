'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Hash, Loader2, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
// 👇 1. IMPORT NOTIFICATION SERVICE
import { sendNotification } from '@/services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinClassModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;

    setLoading(true);

    try {
      // 1. Find the class
      const q = query(collection(db, 'classes'), where('joinCode', '==', code.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Invalid Class Code");
        setLoading(false);
        return;
      }

      const classDoc = snapshot.docs[0];
      const classId = classDoc.id;
      const classData = classDoc.data();

      // 2. Check if already joined
      if (classData.studentIds?.includes(user.uid)) {
        toast.error("You are already in this class!");
        setLoading(false);
        return;
      }

      // 3. Check for pending request
      const requestQ = query(
        collection(db, 'classes', classId, 'requests'), 
        where('studentId', '==', user.uid)
      );
      const requestSnap = await getDocs(requestQ);
      
      if (!requestSnap.empty) {
        toast("Request already pending.", { icon: '⏳' });
        setLoading(false);
        return;
      }

      // 4. Send Request
      await addDoc(collection(db, 'classes', classId, 'requests'), {
        studentId: user.uid,
        studentName: user.displayName || 'Unknown Student',
        studentUsername: user.email?.split('@')[0] || 'student', 
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp()
      });

      // 🔔 5. NEW: SEND NOTIFICATION TO TEACHER
      // We check if teacherId exists to be safe
      if (classData.teacherId) {
        await sendNotification(
          classData.teacherId, 
          'request', 
          'New Join Request', 
          `${user.displayName || 'A student'} wants to join ${classData.title}`, 
          `/teacher/classes/${classId}` // Link takes teacher to the class
        );
      }

      setStatus('success');
      toast.success("Request sent successfully!");
      
      // Close automatically after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setCode('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Hash size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Join a Class</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Enter the 6-character code from your teacher.</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center animate-in zoom-in">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800">Request Sent!</h3>
            <p className="text-green-600 text-sm mt-1">Please wait for teacher approval.</p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              placeholder="Ex: A1B2C3"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full text-center text-3xl font-black tracking-[0.2em] p-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 placeholder:font-bold text-slate-800 uppercase"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || code.length < 3}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Send Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}