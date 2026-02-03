'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const REQUESTS_TRANSLATIONS = {
  uz: {
    emptyTitle: "Kutilayotgan so'rovlar yo'q",
    emptyDesc: "Kirish kodi orqali qo'shilgan o'quvchilar shu yerda ko'rinadi.",
    accept: "{name} qabul qilindi",
    errAccept: "Qabul qilishda xatolik",
    confirmReject: "Bu o'quvchini rad etasizmi?",
    rejected: "So'rov rad etildi",
    errReject: "Rad etishda xatolik",
    unknown: "noma'lum"
  },
  en: {
    emptyTitle: "No pending requests",
    emptyDesc: "Students using the Join Code will appear here.",
    accept: "Accepted {name}",
    errAccept: "Error accepting student",
    confirmReject: "Reject this student?",
    rejected: "Request rejected",
    errReject: "Error rejecting",
    unknown: "unknown"
  },
  ru: {
    emptyTitle: "Нет ожидающих запросов",
    emptyDesc: "Ученики, использующие код входа, появятся здесь.",
    accept: "{name} принят(а)",
    errAccept: "Ошибка принятия",
    confirmReject: "Отклонить этого ученика?",
    rejected: "Запрос отклонен",
    errReject: "Ошибка отклонения",
    unknown: "неизвестно"
  }
};

interface Props {
  classId: string;
}

export default function RequestsTab({ classId }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  
  // 🟢 Use Language Hook
  const { lang } = useTeacherLanguage();
  const t = REQUESTS_TRANSLATIONS[lang];

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
      await updateDoc(doc(db, 'classes', classId), {
        studentIds: arrayUnion(req.studentId)
      });

      // 2. Remove from requests queue
      await deleteDoc(doc(db, 'classes', classId, 'requests', req.id));
      
      toast.success(t.accept.replace("{name}", req.studentName));
    } catch (e) { 
      console.error(e);
      toast.error(t.errAccept); 
    }
  };

  const handleReject = async (reqId: string) => {
    if (!confirm(t.confirmReject)) return;
    try {
      await deleteDoc(doc(db, 'classes', classId, 'requests', reqId));
      toast.success(t.rejected);
    } catch (e) { toast.error(t.errReject); }
  };

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-2xl">
        <Check size={48} className="mb-2 opacity-20" />
        <p className="text-sm font-bold">{t.emptyTitle}</p>
        <p className="text-xs">{t.emptyDesc}</p>
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
              <p className="text-xs text-slate-500">@{req.studentUsername || t.unknown}</p>
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