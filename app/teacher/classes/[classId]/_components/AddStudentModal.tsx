'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStudentModal({ classId, isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!username.trim()) return;
    setIsSearching(true);
    setFoundUser(null);

    try {
      // 1. Check 'usernames' collection map
      const cleanName = username.replace('@', '').toLowerCase();
      const usernameRef = doc(db, 'usernames', cleanName);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        const uid = usernameSnap.data().uid;
        
        // 2. Fetch actual user profile
        const userSnap = await getDoc(doc(db, 'users', uid));
        
        if (userSnap.exists()) {
          const userData = userSnap.data();

          // 🛡️ GATEKEEPER LOGIC 🛡️
          if (uid === user?.uid) {
            toast.error("You cannot add yourself to the class!");
            setIsSearching(false);
            return;
          }

          if (userData.role === 'teacher') {
            toast.error("You cannot add other teachers as students.");
            setIsSearching(false);
            return;
          }

          // ✅ Passed!
          setFoundUser({ uid, ...userData });
        }
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddStudent = async () => {
    if (!foundUser) return;
    setIsAdding(true);
    try {
      const classRef = doc(db, 'classes', classId);
      
      // 🟢 STANDARD UPDATE 🟢
      // We ONLY add the ID to the array. 
      // The parent page will detect this change and fetch the profile automatically.
      await updateDoc(classRef, {
        studentIds: arrayUnion(foundUser.uid)
      });
      
      toast.success(`Added ${foundUser.displayName} to class!`);
      onClose();
      setFoundUser(null);
      setUsername('');
    } catch (error) {
      console.error(error);
      toast.error("Failed to add student");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800">Add Student Manually</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by @username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <button 
              onClick={handleSearch}
              disabled={isSearching || !username}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="animate-spin" size={12}/> : 'Find'}
            </button>
          </div>

          {foundUser && (
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-700">
                  {foundUser.displayName?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{foundUser.displayName}</p>
                  <p className="text-xs text-slate-500">@{foundUser.username || username}</p>
                </div>
              </div>
              <button 
                onClick={handleAddStudent}
                disabled={isAdding}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-green-200"
              >
                {isAdding ? <Loader2 className="animate-spin" size={20}/> : <UserPlus size={20}/>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}