'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, limit, startAt, endAt, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Search, Loader2, ChevronRight } from 'lucide-react';

interface SearchResult {
  username: string; // The doc ID from 'usernames' collection
  uid: string;      // The field stored inside
}

export default function UserSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. HANDLE SEARCH (Debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const term = searchTerm.toLowerCase();
        
        // Firestore "Starts With" Query
        const q = query(
          collection(db, 'usernames'),
          orderBy('__name__'),
          startAt(term),
          endAt(term + '\uf8ff'), 
          limit(5)
        );

        const snapshot = await getDocs(q);
        const users: SearchResult[] = snapshot.docs.map(doc => ({
          username: doc.id,
          uid: doc.data().uid
        }));

        setResults(users);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setLoading(false);
      }
    }, 300); 

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // 2. LISTEN FOR ESCAPE KEY
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 3. LOCK BODY SCROLL
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Disable scroll
    } else {
      document.body.style.overflow = 'unset';  // Enable scroll
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Don't render if closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        
        {/* Header / Input */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100 gap-3">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search students by username..."
            className="flex-1 text-lg font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded-lg transition"
            title="Close (Esc)"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((user) => (
                <button
                  key={user.username}
                  onClick={() => {
                    router.push(`/profile/${user.uid}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase">
                      {user.username[0]}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800">@{user.username}</span>
                      <span className="text-xs text-slate-500 font-medium">Student</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
                </button>
              ))}
            </div>
          ) : searchTerm.length > 1 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No students found matching "{searchTerm}"
            </div>
          ) : (
            <div className="py-8 text-center text-slate-300 text-sm font-medium">
              Try searching for a username
            </div>
          )}
        </div>
        
        {/* Footer Hint */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
           <span>Pro Tip</span>
           <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}