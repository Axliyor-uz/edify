'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Users, Hash, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateClassModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate secure 6-char code
  const [joinCode] = useState(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  });

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!title.trim() || !user) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, 'classes'), {
        title,
        description,
        joinCode,
        teacherId: user.uid,
        teacherName: user.displayName,
        studentIds: [], // Empty start
        studentCount: 0,
        createdAt: serverTimestamp(),
      });

      toast.success("Class Created Successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create class");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800">Create New Class</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Name</label>
            <input 
              type="text" 
              placeholder="e.g. Algebra 9-B"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
             <textarea 
               rows={2}
               placeholder="Morning session..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none resize-none"
             />
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase">Join Code</p>
              <p className="text-xl font-black text-indigo-700 tracking-widest">{joinCode}</p>
            </div>
            <Hash size={24} className="text-indigo-300" />
          </div>
          <p className="text-xs text-center text-slate-400">Students will use this code to request access.</p>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button 
            onClick={handleCreate}
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
            Create Class
          </button>
        </div>
      </div>
    </div>
  );
}