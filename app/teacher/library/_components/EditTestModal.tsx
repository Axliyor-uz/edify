'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  X, Save, Trash2, Archive, RefreshCw, Settings, FileText, 
  Clock, CheckCircle, Shield, Eye, EyeOff, CalendarClock, AlertTriangle 
} from 'lucide-react';
import CartItem from '../../create/_components/CartItem';
import toast from 'react-hot-toast';
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook


// --- 1. TRANSLATION DICTIONARY ---
const EDIT_TEST_TRANSLATIONS = {
  uz: {
    title: "Testni Boshqarish",
    tabs: {
      settings: "Sozlamalar",
      questions: "Savollar"
    },
    settings: {
      name: "Test Nomi",
      duration: "Davomiyligi (Daqiqa)",
      mins: "daq",
      none: "Cheklovsiz",
      custom: "MAXSUS:",
      unlimited: "(Cheklovsiz Vaqt)",
      shuffleTitle: "Savollarni Aralashtirish",
      shuffleDesc: "Har bir o'quvchi uchun tartibni o'zgartirish",
      securityTitle: "Javoblar Xavfsizligi",
      afterDue: {
        title: "Muddatdan keyin ko'rsatish",
        desc: "O'quvchilar javoblarni faqat muddat tugagandan so'ng ko'rishadi."
      },
      never: {
        title: "Hech qachon ko'rsatilmasin",
        desc: "Qat'iy rejim. O'quvchilar faqat yakuniy ballni ko'rishadi."
      },
      always: {
        title: "Darhol ko'rsatish",
        desc: "Javoblar topshirilgandan so'ng darhol ochiladi."
      },
      danger: "Xavfli Hudud",
      archive: "Arxivlash",
      restore: "Tiklash",
      delete: "O'chirish"
    },
    questions: {
      empty: "Savollar mavjud emas."
    },
    buttons: {
      save: "O'zgarishlarni Saqlash",
      saving: "Saqlanmoqda..."
    },
    toasts: {
      saved: "O'zgarishlar saqlandi!",
      failSave: "Saqlashda xatolik",
      archived: "Test Arxivlandi",
      restored: "Test Tiklandi",
      failStatus: "Holatni yangilashda xatolik",
      deleted: "Test butunlay o'chirildi",
      failDelete: "O'chirishda xatolik",
      confirmDelete: "Ishonchingiz komilmi? Bu amalni qaytarib bo'lmaydi."
    }
  },
  en: {
    title: "Manage Test",
    tabs: {
      settings: "Settings",
      questions: "Questions"
    },
    settings: {
      name: "Test Title",
      duration: "Duration (Minutes)",
      mins: "m",
      none: "None",
      custom: "CUSTOM:",
      unlimited: "(Unlimited Time)",
      shuffleTitle: "Shuffle Questions",
      shuffleDesc: "Randomize order for every student",
      securityTitle: "Answer Key Security",
      afterDue: {
        title: "Show After Deadline",
        desc: "Students see answers only after the due date passes."
      },
      never: {
        title: "Never Show Answers",
        desc: "Strict mode. Students only see their final score."
      },
      always: {
        title: "Show Immediately",
        desc: "Answers revealed right after submission."
      },
      danger: "Danger Zone",
      archive: "Archive",
      restore: "Restore",
      delete: "Delete"
    },
    questions: {
      empty: "No questions available."
    },
    buttons: {
      save: "Save Changes",
      saving: "Saving..."
    },
    toasts: {
      saved: "Changes saved!",
      failSave: "Failed to save changes",
      archived: "Test Archived",
      restored: "Test Restored",
      failStatus: "Error updating status",
      deleted: "Test deleted permanently",
      failDelete: "Delete failed",
      confirmDelete: "Are you sure? This cannot be undone."
    }
  },
  ru: {
    title: "Управление Тестом",
    tabs: {
      settings: "Настройки",
      questions: "Вопросы"
    },
    settings: {
      name: "Название Теста",
      duration: "Длительность (Минуты)",
      mins: "мин",
      none: "Нет",
      custom: "СВОЕ:",
      unlimited: "(Без ограничений)",
      shuffleTitle: "Перемешать вопросы",
      shuffleDesc: "Случайный порядок для каждого ученика",
      securityTitle: "Безопасность ответов",
      afterDue: {
        title: "Показать после срока",
        desc: "Ученики увидят ответы только после истечения срока сдачи."
      },
      never: {
        title: "Никогда не показывать",
        desc: "Строгий режим. Ученики видят только итоговый балл."
      },
      always: {
        title: "Показать сразу",
        desc: "Ответы открываются сразу после сдачи."
      },
      danger: "Опасная Зона",
      archive: "Архивировать",
      restore: "Восстановить",
      delete: "Удалить"
    },
    questions: {
      empty: "Вопросов нет."
    },
    buttons: {
      save: "Сохранить изменения",
      saving: "Сохранение..."
    },
    toasts: {
      saved: "Изменения сохранены!",
      failSave: "Ошибка сохранения",
      archived: "Тест архивирован",
      restored: "Тест восстановлен",
      failStatus: "Ошибка обновления статуса",
      deleted: "Тест удален навсегда",
      failDelete: "Не удалось удалить",
      confirmDelete: "Вы уверены? Это действие нельзя отменить."
    }
  }
};

interface Props {
  test: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditTestModal({ test, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');
  const [isSaving, setIsSaving] = useState(false);
  
  // 🟢 Use Language Hook
  const { lang } = useTeacherLanguage();
  const t = EDIT_TEST_TRANSLATIONS[lang];

  // 1. UPDATED STATE: 'resultsVisibility' instead of 'showResults'
  const [settings, setSettings] = useState({
    title: '',
    duration: 0,
    shuffle: false,
    resultsVisibility: 'never' as 'always' | 'never' | 'after_due', // 👈 New Logic
    status: 'active'
  });
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (test) {
      // 2. MIGRATION LOGIC: Convert old boolean to new string if needed
      let visibility = test.resultsVisibility;
      if (!visibility) {
        visibility = test.showResults ? 'always' : 'never';
      }

      setSettings({
        title: test.title || '',
        duration: test.duration || 0,
        shuffle: test.shuffle || false,
        resultsVisibility: visibility, // 👈 Load correct value
        status: test.status || 'active'
      });
      setQuestions(test.questions || []);
    }
  }, [test]);

  if (!isOpen) return null;

  const handleRemoveQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'custom_tests', test.id);
      await updateDoc(docRef, {
        ...settings,
        // Remove the old field to keep DB clean (optional but good practice)
        showResults: settings.resultsVisibility === 'always', 
        questions: questions,
        questionCount: questions.length
      });
      toast.success(t.toasts.saved);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t.toasts.failSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    const newStatus = settings.status === 'active' ? 'archived' : 'active';
    try {
      await updateDoc(doc(db, 'custom_tests', test.id), { status: newStatus });
      toast.success(newStatus === 'archived' ? t.toasts.archived : t.toasts.restored);
      onClose();
    } catch (e) { toast.error(t.toasts.failStatus); }
  };

  const handleDeleteTest = async () => {
    if (!confirm(t.toasts.confirmDelete)) return;
    try {
      await deleteDoc(doc(db, 'custom_tests', test.id));
      toast.success(t.toasts.deleted);
      onClose();
    } catch (e) { toast.error(t.toasts.failDelete); }
  };

  const durationOptions = [0, 10, 20, 30, 45, 60];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-800">{t.title}</h2>
            <p className="text-xs text-slate-500 font-mono">{test.accessCode}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <Settings size={16} /> {t.tabs.settings}
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'questions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText size={16} /> {t.tabs.questions} ({questions.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.settings.name}</label>
                <input 
                  type="text" 
                  value={settings.title}
                  onChange={(e) => setSettings({...settings, title: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Duration */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-indigo-500"/> {t.settings.duration}
                </label>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {durationOptions.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSettings({ ...settings, duration: mins })}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        settings.duration === mins
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {mins === 0 ? t.settings.none : `${mins}${t.settings.mins}`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">{t.settings.custom}</span>
                  <input 
                    type="number" 
                    min="0"
                    value={settings.duration}
                    onChange={(e) => setSettings({...settings, duration: Number(e.target.value)})}
                    className="w-24 p-2 border border-slate-200 rounded-lg text-sm font-bold text-center focus:border-indigo-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    {settings.duration === 0 ? t.settings.unlimited : t.settings.mins}
                  </span>
                </div>
              </div>

              {/* Shuffle Switch */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                    <div className="text-sm font-bold text-slate-700">{t.settings.shuffleTitle}</div>
                    <p className="text-xs text-slate-500 mt-0.5">{t.settings.shuffleDesc}</p>
                </div>
                <button 
                    onClick={() => setSettings({...settings, shuffle: !settings.shuffle})}
                    className={`w-12 h-7 rounded-full transition-colors relative ${settings.shuffle ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 left-1 transition-transform ${settings.shuffle ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* 3. NEW: RESULTS VISIBILITY SELECTOR */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <Shield size={16} className="text-indigo-500"/> {t.settings.securityTitle}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  
                  {/* Option: After Deadline */}
                  <button 
                    onClick={() => setSettings({...settings, resultsVisibility: 'after_due'})}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      settings.resultsVisibility === 'after_due' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${settings.resultsVisibility === 'after_due' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      <CalendarClock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.settings.afterDue.title}</p>
                      <p className="text-[10px] text-slate-500">{t.settings.afterDue.desc}</p>
                    </div>
                    {settings.resultsVisibility === 'after_due' && <CheckCircle size={18} className="text-emerald-500 ml-auto" />}
                  </button>

                  {/* Option: Never */}
                  <button 
                    onClick={() => setSettings({...settings, resultsVisibility: 'never'})}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      settings.resultsVisibility === 'never' ? 'border-slate-600 bg-slate-100' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${settings.resultsVisibility === 'never' ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
                      <EyeOff size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.settings.never.title}</p>
                      <p className="text-[10px] text-slate-500">{t.settings.never.desc}</p>
                    </div>
                    {settings.resultsVisibility === 'never' && <CheckCircle size={18} className="text-slate-600 ml-auto" />}
                  </button>

                  {/* Option: Always */}
                  <button 
                    onClick={() => setSettings({...settings, resultsVisibility: 'always'})}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      settings.resultsVisibility === 'always' ? 'border-amber-400 bg-amber-50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${settings.resultsVisibility === 'always' ? 'bg-amber-200 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                      <Eye size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.settings.always.title}</p>
                      <p className="text-[10px] text-slate-500">{t.settings.always.desc}</p>
                    </div>
                    {settings.resultsVisibility === 'always' && <CheckCircle size={18} className="text-amber-500 ml-auto" />}
                  </button>

                </div>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-xs font-bold text-red-400 uppercase mb-4">{t.settings.danger}</p>
                <div className="flex gap-3">
                   <button 
                     onClick={handleArchiveToggle}
                     className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 text-sm"
                   >
                     {settings.status === 'active' ? <><Archive size={16}/> {t.settings.archive}</> : <><RefreshCw size={16}/> {t.settings.restore}</>}
                   </button>
                   <button 
                     onClick={handleDeleteTest}
                     className="flex-1 py-3 bg-red-50 border border-red-100 rounded-xl font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2 text-sm"
                   >
                     <Trash2 size={16}/> {t.settings.delete}
                   </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-slate-800 p-1 rounded-xl">
                    <CartItem 
                      question={q} 
                      index={idx + 1} 
                      onRemove={() => handleRemoveQuestion(q.id)} 
                    />
                </div>
              ))}
              {questions.length === 0 && (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                  <AlertTriangle size={32} className="mb-2 opacity-50"/>
                  <span className="text-sm">{t.questions.empty}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
           >
             {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
             {isSaving ? t.buttons.saving : t.buttons.save}
           </button>
        </div>
      </div>
    </div>
  );
}