'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  classId: string;
}

export default function RequestsTab({ classId }: Props) {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'classes', classId, 'requests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [classId]);

  const handleAccept = async (req: any) => {
    try {
      // 🟢 STANDARD UPDATE 🟢
      // Only add the ID to the array. 
      // The parent page listener will detect this and fetch the full profile automatically.
      await updateDoc(doc(db, 'classes', classId), {
        studentIds: arrayUnion(req.studentId)
      });

      // 2. Remove from requests queue
      await deleteDoc(doc(db, 'classes', classId, 'requests', req.id));
      
      toast.success(`Accepted ${req.studentName}`);
    } catch (e) { 
      console.error(e);
      toast.error("Error accepting student"); 
    }
  };

  const handleReject = async (reqId: string) => {
    if (!confirm("Reject this student?")) return;
    try {
      await deleteDoc(doc(db, 'classes', classId, 'requests', reqId));
      toast.success("Request rejected");
    } catch (e) { toast.error("Error rejecting"); }
  };

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-2xl">
        <Check size={48} className="mb-2 opacity-20" />
        <p className="text-sm font-bold">No pending requests</p>
        <p className="text-xs">Students using the Join Code will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{req.studentName}</p>
              <p className="text-xs text-slate-500">@{req.studentUsername || 'unknown'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleReject(req.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <button 
              onClick={() => handleAccept(req)}
              className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-lg shadow-green-200"
            >
              <Check size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}