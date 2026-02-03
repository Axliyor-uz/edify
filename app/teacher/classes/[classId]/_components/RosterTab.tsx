'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Trash2, Eye, UserX, User } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentDetailsModal from './StudentDetailsModal';
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const ROSTER_TRANSLATIONS = {
  uz: {
    loading: "Jurnal yuklanmoqda...",
    empty: "Bu sinfda hali o'quvchilar yo'q.",
    unknown: "Noma'lum",
    deleted: "o'chirilgan",
    confirmRemove: "Bu o'quvchini sinfdan o'chirasizmi?",
    removed: "O'quvchi o'chirildi",
    errRemove: "O'quvchini o'chirishda xatolik",
    errLoad: "Sinf ma'lumotlarini yuklab bo'lmadi",
    hint: "Baholarni ko'rish uchun 'Batafsil' tugmasini bosing",
    details: "Batafsil",
    removeBtn: "Sinfdan o'chirish"
  },
  en: {
    loading: "Loading roster...",
    empty: "No students in this class yet.",
    unknown: "Unknown",
    deleted: "deleted",
    confirmRemove: "Remove this student from the class?",
    removed: "Student removed",
    errRemove: "Error removing student",
    errLoad: "Could not load class data",
    hint: "Click 'Details' to view grades",
    details: "Details",
    removeBtn: "Remove from class"
  },
  ru: {
    loading: "Загрузка списка...",
    empty: "В этом классе пока нет учеников.",
    unknown: "Неизвестно",
    deleted: "удален",
    confirmRemove: "Удалить этого ученика из класса?",
    removed: "Ученик удален",
    errRemove: "Ошибка удаления ученика",
    errLoad: "Не удалось загрузить данные класса",
    hint: "Нажмите 'Подробнее' для просмотра оценок",
    details: "Подробнее",
    removeBtn: "Удалить из класса"
  }
};

interface Props {
  classId: string;
  studentIds: string[];
}

export default function RosterTab({ classId, studentIds }: Props) {
  
  // 🟢 Use Language Hook
  const { lang } = useTeacherLanguage();
  const t = ROSTER_TRANSLATIONS[lang];

  // STATE: Only storing profiles and assignment list (Cheap)
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 1. Fetch Data (Profiles + Assignment Definitions Only)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // A. Fetch Students (One by One)
        if (studentIds && studentIds.length > 0) {
          const promises = studentIds.map(uid => getDoc(doc(db, 'users', uid)));
          const snaps = await Promise.all(promises);
          
          const loadedStudents = snaps.map((snap, index) => {
            if (snap.exists()) {
              return { uid: snap.id, ...snap.data() };
            } else {
              return { uid: studentIds[index], displayName: t.unknown, username: t.deleted, isDeleted: true };
            }
          });
          setStudents(loadedStudents);
        } else {
          setStudents([]);
        }

        // B. Fetch Assignments (To pass to modal later)
        const assignQuery = query(collection(db, 'classes', classId, 'assignments'), orderBy('createdAt', 'desc'));
        const assignSnap = await getDocs(assignQuery);
        const assignList = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAssignments(assignList);

      } catch (e) { 
        console.error("Error loading roster:", e);
        toast.error(t.errLoad);
      } finally { 
        setLoading(false); 
      }
    };

    fetchData();
  }, [classId, studentIds, t]); // Added 't' dependency

  const handleShowDetails = (student: any) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  const handleRemove = async (studentUid: string) => {
    if (!confirm(t.confirmRemove)) return;
    try {
      await updateDoc(doc(db, 'classes', classId), { 
        studentIds: arrayRemove(studentUid) 
      });
      toast.success(t.removed);
      setStudents(prev => prev.filter(s => s.uid !== studentUid));
    } catch (e) { 
      console.error(e);
      toast.error(t.errRemove); 
    }
  };

  if (loading) return <div className="py-10 text-center text-slate-400">{t.loading}</div>;

  if (students.length === 0) {
    return <div className="py-10 text-center text-slate-400 italic">{t.empty}</div>;
  }

  return (
    <>
      <StudentDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        student={selectedStudent}
        assignments={assignments}
        classId={classId} 
      />

      <div className="space-y-3">
        {students.map((student, index) => (
          <div key={student.uid} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 group hover:border-indigo-300 transition-all shadow-sm">
            
            {/* Left: Student Info */}
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-slate-300 w-6 text-center">{index + 1}</div>
              
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${student.isDeleted ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  {student.isDeleted ? <UserX size={18}/> : (student.displayName?.[0] || 'S')}
                </div>
                <div>
                  <p className={`font-bold text-sm ${student.isDeleted ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                    {student.displayName}
                  </p>
                  <p className="text-xs text-slate-500">@{student.username || 'student'}</p>
                </div>
              </div>
            </div>

            {/* Middle: Clean Status */}
            <div className="hidden md:flex flex-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                  {t.hint}
               </span>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleShowDetails(student)} 
                disabled={student.isDeleted} 
                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Eye size={14}/> {t.details}
              </button>
              
              <button 
                onClick={() => handleRemove(student.uid)} 
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                title={t.removeBtn}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}