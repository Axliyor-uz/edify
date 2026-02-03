'use client';

import { sendNotification } from '@/services/notificationService';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  X, Clock, Users, CheckCircle, Search, Loader2, AlignLeft, RotateCcw, 
  Plus, BookOpen, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const ASSIGN_MODAL_TRANSLATIONS = {
  uz: {
    titleCreate: "Test Biriktirish",
    titleEdit: "Topshiriqni Tahrirlash",
    titleConfig: "Qoidalarni Sozlash",
    howItWorks: {
      title: "Bu qanday ishlaydi",
      step1: "1. Kutubxonangizdan test shablonini tanlang.",
      step2: "2. Keyingi bosqichda muddat va urinishlar limitini belgilang.",
      step3: "3. O'quvchilar buni darhol ko'rishadi."
    },
    search: "Kutubxonangizdan qidiring...",
    empty: {
      title: "Kutubxonangiz Bo'sh",
      desc: "Sinfga biriktirishdan oldin test shablonini yaratishingiz kerak.",
      btn: "Yangi Test Yaratish"
    },
    questions: "Savollar",
    noLimit: "Cheklovsiz",
    config: {
      instructions: "Ko'rsatmalar",
      instPlace: "Masalan: Boshlashdan oldin 4-bobni o'qing...",
      attempts: "Ruxsat etilgan urinishlar",
      unlimited: "Cheklovsiz",
      x: "marta",
      attemptInfo: "O'quvchilar cheksiz qayta topshirishi mumkin. Faqat oxirgi natija saqlanadi.",
      attemptBlock: "O'quvchilar {n} ta urinishdan so'ng bloklanadi.",
      schedule: "Jadval",
      openDate: "Ochilish Sanasi",
      dueDate: "Tugash Sanasi",
      presets: {
        tmrw: "Ertaga 09:00",
        fri: "Juma 17:00"
      },
      assignTo: "Kimga Biriktirish",
      all: "Barcha O'quvchilar",
      individual: "Ayrim O'quvchilar",
      noStudents: "Sinfda o'quvchilar yo'q."
    },
    buttons: {
      back: "Ortga",
      next: "Keyingi",
      publish: "Topshiriqni Nashr Qilish",
      save: "O'zgarishlarni Saqlash",
      select: "Testni tanlang"
    },
    toasts: {
      updated: "Topshiriq Yangilandi!",
      published: "Topshiriq Nashr Qilindi!",
      fail: "Saqlashda xatolik"
    }
  },
  en: {
    titleCreate: "Assign a Test",
    titleEdit: "Edit Assignment",
    titleConfig: "Configure Rules",
    howItWorks: {
      title: "How this works",
      step1: "1. Select a test template from your library below.",
      step2: "2. Set deadlines and attempts limits in the next step.",
      step3: "3. Students will see it immediately in their dashboard."
    },
    search: "Search your library...",
    empty: {
      title: "Your Library is Empty",
      desc: "You need to create a test template before you can assign it to a class.",
      btn: "Create New Test"
    },
    questions: "Questions",
    noLimit: "No Limit",
    config: {
      instructions: "Instructions",
      instPlace: "e.g. Read Chapter 4 before starting...",
      attempts: "Attempts Allowed",
      unlimited: "Unlimited",
      x: "x",
      attemptInfo: "Students can retake indefinitely. Only the last score is saved.",
      attemptBlock: "Students are blocked after {n} submission{s}.",
      schedule: "Schedule",
      openDate: "Open Date",
      dueDate: "Due Date",
      presets: {
        tmrw: "Tomorrow 9AM",
        fri: "Friday 5PM"
      },
      assignTo: "Assign To",
      all: "All Students",
      individual: "Select Individuals",
      noStudents: "No students in class yet."
    },
    buttons: {
      back: "Back",
      next: "Next",
      publish: "Publish Assignment",
      save: "Save Changes",
      select: "Select a test"
    },
    toasts: {
      updated: "Assignment Updated!",
      published: "Assignment Published!",
      fail: "Failed to save"
    }
  },
  ru: {
    titleCreate: "Назначить Тест",
    titleEdit: "Редактировать Задание",
    titleConfig: "Настройка Правил",
    howItWorks: {
      title: "Как это работает",
      step1: "1. Выберите шаблон теста из вашей библиотеки.",
      step2: "2. Установите сроки и лимиты попыток на следующем шаге.",
      step3: "3. Ученики увидят его сразу в своем кабинете."
    },
    search: "Поиск в библиотеке...",
    empty: {
      title: "Ваша библиотека пуста",
      desc: "Вам нужно создать шаблон теста, прежде чем назначать его классу.",
      btn: "Создать Новый Тест"
    },
    questions: "Вопросов",
    noLimit: "Без лимита",
    config: {
      instructions: "Инструкции",
      instPlace: "Напр.: Прочитайте главу 4 перед началом...",
      attempts: "Допустимые попытки",
      unlimited: "Безлимит",
      x: "x",
      attemptInfo: "Ученики могут пересдавать бесконечно. Сохраняется только последний результат.",
      attemptBlock: "Ученики блокируются после {n} попыток.",
      schedule: "Расписание",
      openDate: "Дата Открытия",
      dueDate: "Срок Сдачи",
      presets: {
        tmrw: "Завтра 09:00",
        fri: "Пятница 17:00"
      },
      assignTo: "Кому Назначить",
      all: "Всем Ученикам",
      individual: "Выбрать Индивидуально",
      noStudents: "В классе пока нет учеников."
    },
    buttons: {
      back: "Назад",
      next: "Далее",
      publish: "Опубликовать Задание",
      save: "Сохранить Изменения",
      select: "Выберите тест"
    },
    toasts: {
      updated: "Задание Обновлено!",
      published: "Задание Опубликовано!",
      fail: "Ошибка сохранения"
    }
  }
};

interface Props {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  roster: any[];
  editData?: any; 
}

export default function AssignTestModal({ classId, isOpen, onClose, roster, editData }: Props) {
  const { user } = useAuth();
  const router = useRouter(); 
  
  // 🟢 Use Language Hook
  const { lang } = useTeacherLanguage();
  const t = ASSIGN_MODAL_TRANSLATIONS[lang];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [myTests, setMyTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  
  // Rules State
  const [openAt, setOpenAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [description, setDescription] = useState('');
  const [assignMode, setAssignMode] = useState<'all' | 'individual'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [allowedAttempts, setAllowedAttempts] = useState<number>(1); 

  // Initialize Data
  useEffect(() => {
    if (isOpen && user) {
      if (editData) {
        setStep(2);
        setSelectedTest({ id: editData.testId, title: editData.testTitle, questionCount: editData.questionCount });
        setDescription(editData.description || '');
        setAllowedAttempts(editData.allowedAttempts ?? 1);
        
        const toInputString = (ts: any) => {
           if (!ts?.seconds) return '';
           const d = new Date(ts.seconds * 1000);
           d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
           return d.toISOString().slice(0, 16);
        };

        setOpenAt(toInputString(editData.openAt));
        setDueAt(toInputString(editData.dueAt));
        
        if (Array.isArray(editData.assignedTo)) {
          setAssignMode('individual');
          setSelectedStudentIds(editData.assignedTo);
        } else {
          setAssignMode('all');
        }

      } else {
        // Reset for Create Mode
        setStep(1);
        setOpenAt('');
        setDueAt('');
        setDescription('');
        setAssignMode('all');
        setSelectedStudentIds([]);
        setSelectedTest(null);
        setAllowedAttempts(1);

        const fetchTests = async () => {
          const q = query(collection(db, 'custom_tests'), where('teacherId', '==', user.uid));
          const snap = await getDocs(q);
          setMyTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchTests();
      }
    }
  }, [isOpen, user, editData]);

  // --- ACTIONS ---

  const handleSave = async () => {
    if (!selectedTest || !user) return;
    setLoading(true);

    try {
      const openDate = openAt ? new Date(openAt) : new Date();
      const dueDate = dueAt ? new Date(dueAt) : null;
      
      const payload = {
        testId: selectedTest.id,
        testTitle: selectedTest.title,
        questionCount: selectedTest.questionCount,
        description,
        openAt: openDate,
        dueAt: dueDate,
        assignedTo: assignMode === 'all' ? 'all' : selectedStudentIds,
        allowedAttempts: allowedAttempts,
        status: 'active',
        teacherId: user.uid
      };

      if (editData) {
        await updateDoc(doc(db, 'classes', classId, 'assignments', editData.id), payload);
        toast.success(t.toasts.updated);
      } else {
        await addDoc(collection(db, 'classes', classId, 'assignments'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        
        toast.success(t.toasts.published);

        // SEND NOTIFICATIONS
        if (assignMode === 'all') {
            roster.forEach(student => {
               if (student.uid) {
                 sendNotification(
                   student.uid, 
                   'assignment', 
                   'New Test Assigned', 
                   `You have a new test: ${selectedTest.title}`, 
                   `/classes/${classId}`
                 );
               }
            });
        } else {
            selectedStudentIds.forEach(uid => {
               sendNotification(
                 uid, 
                 'assignment', 
                 'New Test Assigned', 
                 `You have a new test: ${selectedTest.title}`, 
                 `/classes/${classId}`
               );
            });
        }
      }
      onClose();
    } catch (error) {
      toast.error(t.toasts.fail);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (uid: string) => {
    setSelectedStudentIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const applyPreset = (type: 'tmrw_am' | 'next_week' | 'friday') => {
    const now = new Date();
    let target = new Date();

    if (type === 'tmrw_am') {
       target.setDate(now.getDate() + 1);
       target.setHours(9, 0, 0, 0);
    } else if (type === 'friday') {
       const dist = (5 + 7 - now.getDay()) % 7;
       target.setDate(now.getDate() + (dist === 0 ? 7 : dist));
       target.setHours(17, 0, 0, 0);
    } else {
       target.setDate(now.getDate() + 7);
       target.setHours(9, 0, 0, 0);
    }
    
    target.setMinutes(target.getMinutes() - target.getTimezoneOffset());
    setDueAt(target.toISOString().slice(0, 16));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800">
            {editData ? t.titleEdit : (step === 1 ? t.titleCreate : t.titleConfig)}
          </h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: SELECT TEST */}
          {step === 1 && !editData && (
            <div className="space-y-4">
              
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 items-start">
                <BookOpen className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                <div>
                   <h3 className="text-sm font-bold text-indigo-900">{t.howItWorks.title}</h3>
                   <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                      {t.howItWorks.step1}<br/>
                      {t.howItWorks.step2}<br/>
                      {t.howItWorks.step3}
                   </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input type="text" placeholder={t.search} className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"/>
              </div>
              
              {/* List or Empty State */}
              {myTests.length === 0 ? (
                 <div className="text-center py-10 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                       <Search size={32} />
                    </div>
                    <h4 className="text-slate-800 font-bold text-lg">{t.empty.title}</h4>
                    <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto mb-6">
                       {t.empty.desc}
                    </p>
                    <button 
                       onClick={() => router.push('/teacher/create')}
                       className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                    >
                       <Plus size={18} /> {t.empty.btn}
                    </button>
                 </div>
              ) : (
                <div className="space-y-2">
                  {myTests.map(test => (
                    <div 
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${selectedTest?.id === test.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{test.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{test.questionCount} {t.questions} • {test.duration ? `${test.duration}m` : t.noLimit}</p>
                      </div>
                      {selectedTest?.id === test.id ? <CheckCircle size={20} className="text-indigo-600 fill-indigo-100"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-indigo-300"></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONFIGURE */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <AlignLeft size={12}/> {t.config.instructions}
                </label>
                <textarea 
                  rows={2}
                  placeholder={t.config.instPlace}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              {/* Attempts */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <RotateCcw size={12}/> {t.config.attempts}
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {[1, 2, 3, 0].map((num) => (
                    <button
                      key={num}
                      onClick={() => setAllowedAttempts(num)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        allowedAttempts === num 
                          ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {num === 0 ? t.config.unlimited : `${num}${t.config.x}`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <AlertCircle size={10}/>
                  {allowedAttempts === 0 
                    ? t.config.attemptInfo
                    : t.config.attemptBlock.replace("{n}", allowedAttempts.toString())}
                </p>
              </div>

              {/* Timing */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Clock size={14}/> {t.config.schedule}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.config.openDate}</label>
                    <input 
                      type="datetime-local" 
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-indigo-500 outline-none"
                      value={openAt}
                      onChange={e => setOpenAt(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.config.dueDate}</label>
                    <input 
                      type="datetime-local" 
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-indigo-500 outline-none"
                      value={dueAt}
                      onChange={e => setDueAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button onClick={() => applyPreset('tmrw_am')} className="whitespace-nowrap text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors">
                    {t.config.presets.tmrw}
                  </button>
                  <button onClick={() => applyPreset('friday')} className="whitespace-nowrap text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors">
                    {t.config.presets.fri}
                  </button>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Users size={14}/> {t.config.assignTo}
                </h3>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setAssignMode('all')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${assignMode === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                    {t.config.all}
                  </button>
                  <button 
                    onClick={() => setAssignMode('individual')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${assignMode === 'individual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                    {t.config.individual}
                  </button>
                </div>

                {assignMode === 'individual' && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                    {roster.length === 0 ? (
                       <p className="text-xs text-slate-400 p-2 italic text-center">{t.config.noStudents}</p>
                    ) : (
                      roster.map(student => (
                        <div 
                          key={student.uid} 
                          onClick={() => toggleStudent(student.uid)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedStudentIds.includes(student.uid) ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-white hover:shadow-sm border border-transparent'}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedStudentIds.includes(student.uid) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                            {selectedStudentIds.includes(student.uid) && <CheckCircle size={10} className="text-white"/>}
                          </div>
                          <span className={`text-xs font-bold ${selectedStudentIds.includes(student.uid) ? 'text-indigo-900' : 'text-slate-600'}`}>{student.displayName}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          {step === 2 && !editData && (
            <button onClick={() => setStep(1)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl text-sm transition-colors">
              {t.buttons.back}
            </button>
          )}
          <button 
            onClick={() => step === 1 ? (selectedTest ? setStep(2) : toast.error(t.buttons.select)) : handleSave()}
            disabled={loading}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 text-sm disabled:opacity-70 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : step === 1 ? t.buttons.next : (editData ? t.buttons.save : t.buttons.publish)}
          </button>
        </div>

      </div>
    </div>
  );
}