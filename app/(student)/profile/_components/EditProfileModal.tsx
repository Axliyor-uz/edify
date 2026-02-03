'use client';

import { useState, useEffect } from 'react';
import { 
  X, MapPin, AtSign, RefreshCw, CheckCircle, 
  XCircle, Phone, Mail, AlertCircle, Save, AlertTriangle, Trash2,
  Calendar, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { checkUsernameUnique } from '@/services/userService';

// Firebase Imports
import { db, auth } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { collection, query, where, getDocs, arrayRemove, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup 
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { useStudentLanguage } from '@/app/(student)/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const EDIT_MODAL_TRANSLATIONS = {
  uz: {
    title: "Profilni Tahrirlash",
    tabs: {
      profile: "Ommaviy Profil",
      account: "Hisob",
      security: "Xavfsizlik"
    },
    labels: {
      fullName: "To'liq Ism (F.I.O)",
      birthDate: "Tug'ilgan Sana",
      bio: "O'zingiz haqingizda",
      region: "Viloyat",
      district: "Tuman",
      selectRegion: "Viloyatni tanlang",
      selectDistrict: "Tumanni tanlang",
      school: "Maktab / Universitet",
      schoolPlace: "Muassasa nomi",
      username: "Foydalanuvchi nomi",
      phone: "Telefon raqami",
      email: "Email"
    },
    status: {
      minChar: "Kamida 5 ta belgi",
      regex: "Harf bilan boshlang (a-z, 0-9, _)",
      taken: "Bu nom band qilingan",
      avail: "Bu nom bo'sh!"
    },
    security: {
      warn: "Parolni o'zgartirish qayta kirishni talab qiladi.",
      googleWarn: "Siz Google orqali kirdingiz. Parol kerak emas.",
      current: "Joriy Parol",
      new: "Yangi Parol",
      confirm: "Tasdiqlash",
      updateBtn: "Parolni Yangilash",
      danger: "Xavfli Hudud",
      deleteTitle: "Hisobni O'chirish",
      deleteDesc: "Hisob o'chirilgach, uni qayta tiklab bo'lmaydi.",
      deleteBtn: "O'chirish",
      sureTitle: "Haqiqatan ham ishonchingiz komilmi?",
      sureDesc: "Bu amal hisobingizni, barcha yutuqlar, tarix va ma'lumotlarni butunlay o'chirib tashlaydi.",
      passPlace: "Tasdiqlash uchun parolni kiriting",
      cancel: "Bekor qilish",
      yesDelete: "Ha, Hisobimni O'chirish"
    },
    footer: {
      cancel: "Bekor qilish",
      save: "Saqlash"
    },
    toasts: {
      passReq: "Iltimos, parolni kiriting",
      clean: "Ma'lumotlar tozalanmoqda...",
      deleted: "Hisob butunlay o'chirildi.",
      wrongPass: "Noto'g'ri parol.",
      popupClosed: "Tasdiqlash bekor qilindi",
      delFail: "Hisobni o'chirishda xatolik."
    }
  },
  en: {
    title: "Edit Profile",
    tabs: {
      profile: "Public Profile",
      account: "Account",
      security: "Security"
    },
    labels: {
      fullName: "Full Name",
      birthDate: "Date of Birth",
      bio: "Bio",
      region: "Region",
      district: "District",
      selectRegion: "Select Region",
      selectDistrict: "Select District",
      school: "School / University",
      schoolPlace: "School Name",
      username: "Username",
      phone: "Phone",
      email: "Email"
    },
    status: {
      minChar: "Minimum 5 characters",
      regex: "Start with letter, use a-z, 0-9, _",
      taken: "Username is already taken",
      avail: "Username is available!"
    },
    security: {
      warn: "Changing password requires re-login.",
      googleWarn: "You are logged in with Google. You don't need a password.",
      current: "Current Password",
      new: "New Password",
      confirm: "Confirm Password",
      updateBtn: "Update Password",
      danger: "Danger Zone",
      deleteTitle: "Delete Account",
      deleteDesc: "Once you delete your account, there is no going back.",
      deleteBtn: "Delete",
      sureTitle: "Are you absolutely sure?",
      sureDesc: "This action will permanently delete your account, including all progress, history, and profile data.",
      passPlace: "Enter your password to confirm",
      cancel: "Cancel",
      yesDelete: "Yes, Delete My Account"
    },
    footer: {
      cancel: "Cancel",
      save: "Save Changes"
    },
    toasts: {
      passReq: "Please enter your password",
      clean: "Cleaning up data...",
      deleted: "Account permanently deleted.",
      wrongPass: "Incorrect password.",
      popupClosed: "Verification cancelled",
      delFail: "Failed to delete account."
    }
  },
  ru: {
    title: "Редактировать Профиль",
    tabs: {
      profile: "Профиль",
      account: "Аккаунт",
      security: "Безопасность"
    },
    labels: {
      fullName: "Полное Имя",
      birthDate: "Дата Рождения",
      bio: "О себе",
      region: "Регион",
      district: "Район",
      selectRegion: "Выберите регион",
      selectDistrict: "Выберите район",
      school: "Школа / ВУЗ",
      schoolPlace: "Название учреждения",
      username: "Имя пользователя",
      phone: "Телефон",
      email: "Эл. почта"
    },
    status: {
      minChar: "Минимум 5 символов",
      regex: "Начинайте с буквы (a-z, 0-9, _)",
      taken: "Имя уже занято",
      avail: "Имя доступно!"
    },
    security: {
      warn: "Смена пароля требует повторного входа.",
      googleWarn: "Вы вошли через Google. Пароль не нужен.",
      current: "Текущий пароль",
      new: "Новый пароль",
      confirm: "Подтвердите пароль",
      updateBtn: "Обновить Пароль",
      danger: "Опасная Зона",
      deleteTitle: "Удалить Аккаунт",
      deleteDesc: "После удаления аккаунта пути назад нет.",
      deleteBtn: "Удалить",
      sureTitle: "Вы абсолютно уверены?",
      sureDesc: "Это действие навсегда удалит ваш аккаунт, включая прогресс, историю и данные профиля.",
      passPlace: "Введите пароль для подтверждения",
      cancel: "Отмена",
      yesDelete: "Да, Удалить Мой Аккаунт"
    },
    footer: {
      cancel: "Отмена",
      save: "Сохранить"
    },
    toasts: {
      passReq: "Пожалуйста, введите пароль",
      clean: "Очистка данных...",
      deleted: "Аккаунт удален навсегда.",
      wrongPass: "Неверный пароль.",
      popupClosed: "Проверка отменена",
      delFail: "Не удалось удалить аккаунт."
    }
  }
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onSave: (formData: any) => Promise<void>;
  onPasswordUpdate: (current: string, newP: string) => Promise<void>;
  saving: boolean;
  initialData: any;
}

const UZB_LOCATIONS: Record<string, string[]> = {
    "Tashkent City": ["Bektemir","Chilanzar","Mirzo Ulugbek","Mirobod","Olmazor","Sergeli","Shaykhantakhur","Uchtepa","Yakkasaray","Yashnobod","Yunusabad","Yangihayot"],
    "Tashkent Region": ["Angren","Bekabad","Buka","Chinaz","Chirchik","Kibray","Ohangaron","Parkent","Piskent","Quyi Chirchiq","Orta Chirchiq","Yuqori Chirchiq","Yangiyo‘l","Zangiota"],
    "Samarkand": ["Samarkand City","Bulungur","Ishtikhon","Jomboy","Kattakurgan","Narpay","Nurabad","Oqdaryo","Pastdargom","Paxtachi","Payariq","Toyloq","Urgut"],
    "Bukhara": ["Bukhara City","Gijduvan","Jondor","Kogon","Olot","Peshku","Qorako‘l","Romitan","Shofirkon","Vobkent"],
    "Andijan": ["Andijan City","Asaka","Baliqchi","Bo‘z","Buloqboshi","Izboskan","Jalaquduq","Kurgontepa","Marhamat","Oltinko‘l","Paxtaobod","Shahrixon","Ulugnor","Xo‘jaobod"],
    "Fergana": ["Fergana City","Beshariq","Bog‘dod","Buvayda","Dang‘ara","Furqat","Kokand","Margilan","Oltiariq","Qo‘shtepa","Quva","Rishton","So‘x","Toshloq","Uchko‘prik","Yozyovon"],
    "Namangan": ["Namangan City","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To‘raqo‘rg‘on","Uchqo‘rg‘on","Uychi","Yangiqo‘rg‘on"],
    "Khorezm": ["Urgench","Bog‘ot","Gurlan","Hazorasp","Khiva","Qo‘shko‘pir","Shovot","Xonqa","Yangiariq","Yangibozor"],
    "Kashkadarya": ["Karshi","Chiroqchi","Dehqonobod","G‘uzor","Kasbi","Kitob","Koson","Mirishkor","Muborak","Nishon","Qamashi","Shahrisabz","Yakkabog‘"],
    "Surkhandarya": ["Termez","Angor","Bandixon","Boysun","Denau","Jarqo‘rg‘on","Qiziriq","Qumqo‘rg‘on","Muzrabot","Oltinsoy","Sariosiyo","Sherobod","Sho‘rchi","Uzun"],
    "Navoi": ["Navoi City","Zarafshan","Karmana","Konimex","Navbahor","Nurota","Qiziltepa","Tomdi","Uchquduq","Xatirchi"],
    "Jizzakh": ["Jizzakh City","Arnasoy","Bakhmal","Dustlik","Forish","Gallaorol","Mirzachul","Paxtakor","Sharof Rashidov","Zafarobod","Zarbdor","Zaamin"],
    "Syrdarya": ["Gulistan","Akaltyn","Bayaut","Khavast","Mirzaobod","Saykhunobod","Sardoba","Sirdaryo","Yangiyer","Shirin"],
    "Karakalpakstan": ["Nukus","Amudarya","Beruniy","Chimbay","Ellikqala","Kegeyli","Kungrad","Moynaq","Qanlikol","Shumanay","Takhiatash","Turtkul","Xojeli"]
};

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '+998 ';
  let formatted = '+998 ';
  const inputNumbers = numbers.startsWith('998') ? numbers.slice(3) : numbers;
  if (inputNumbers.length > 0) formatted += `(${inputNumbers.slice(0, 2)}`;
  if (inputNumbers.length >= 2) formatted += `) ${inputNumbers.slice(2, 5)}`;
  if (inputNumbers.length >= 5) formatted += `-${inputNumbers.slice(5, 7)}`;
  if (inputNumbers.length >= 7) formatted += `-${inputNumbers.slice(7, 9)}`;
  return formatted;
};

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export default function EditProfileModal({ 
  isOpen, onClose, userData, onSave, onPasswordUpdate, saving, initialData 
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>('profile');
  const [formData, setFormData] = useState(initialData);
  
  // 🟢 Use Language Hook
  const { lang } = useStudentLanguage();
  const t = EDIT_MODAL_TRANSLATIONS[lang];

  // Security State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Username Logic State
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');

  // CHECK GOOGLE USER
  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  useEffect(() => {
    if (isOpen) setFormData(initialData);
  }, [isOpen, initialData]);

  // Username Checker Effect
  useEffect(() => {
    const input = formData.username.trim().toLowerCase();
    const original = userData?.username?.toLowerCase();

    if (!input) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    if (input.length < 5) {
      setUsernameStatus('invalid');
      setUsernameError(t.status.minChar);
      return;
    }
    if (!USERNAME_REGEX.test(input)) {
      setUsernameStatus('invalid');
      setUsernameError(t.status.regex);
      return;
    }

    if (input === original) {
      setUsernameStatus('valid');
      setUsernameError('');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const isUnique = await checkUsernameUnique(input);
        if (isUnique) {
          setUsernameStatus('valid');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(t.status.taken);
        }
      } catch (error) {
        console.error(error);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, userData?.username, t]);

  const handleSaveClick = () => onSave(formData);

  const handlePasswordClick = () => {
    if (newPass !== confirmPass) return; 
    onPasswordUpdate(currentPass, newPass);
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
  };

  // --- DELETE ACCOUNT LOGIC ---
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Manual users need password
    if (!isGoogleUser && !deletePassword) {
      toast.error(t.toasts.passReq);
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading(t.toasts.clean);

    try {
      // 1. RE-AUTHENTICATE
      if (isGoogleUser) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else {
        const credential = EmailAuthProvider.credential(user.email!, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      // 2. DATA CLEANUP
      try {
        const attemptsQ = query(collection(db, 'attempts'), where('userId', '==', user.uid));
        const attemptsSnap = await getDocs(attemptsQ);
        const deleteAttempts = attemptsSnap.docs.map(d => deleteDoc(d.ref));

        const notifQ = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const notifSnap = await getDocs(notifQ);
        const deleteNotifs = notifSnap.docs.map(d => deleteDoc(d.ref));

        const classesQ = query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));
        const classesSnap = await getDocs(classesQ);
        const updateClasses = classesSnap.docs.map(d => 
           updateDoc(d.ref, { studentIds: arrayRemove(user.uid) })
        );

        await Promise.all([...deleteAttempts, ...deleteNotifs, ...updateClasses]);
      } catch (cleanupError) {
        console.warn("Some data could not be cleaned up:", cleanupError);
      }

      // 3. DELETE PROFILE
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', user.uid));
      if (userData.username) {
        batch.delete(doc(db, 'usernames', userData.username.toLowerCase()));
      }
      await batch.commit();

      // 4. DELETE USER
      await deleteUser(user);

      toast.success(t.toasts.deleted, { id: toastId });
      window.location.href = '/auth/login';

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        toast.error(t.toasts.wrongPass, { id: toastId });
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error(t.toasts.popupClosed, { id: toastId });
      } else {
        toast.error(t.toasts.delFail, { id: toastId });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-700"
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white">{t.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
            <X size={20}/>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6 bg-slate-900/30">
          {['profile', 'account', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors uppercase tracking-wide ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              {/* @ts-ignore */}
              {t.tabs[tab]}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-800">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.fullName}</label>
                <input 
                  type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                  <Calendar size={14} /> {t.labels.birthDate}
                </label>
                <input 
                  type="date" 
                  value={formData.birthDate} 
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.bio}</label>
                <textarea 
                  value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} 
                  className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.region}</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value, district: ''})}
                    className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">{t.labels.selectRegion}</option>
                    {Object.keys(UZB_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.district}</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    disabled={!formData.region}
                    className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none disabled:opacity-50"
                  >
                    <option value="">{t.labels.selectDistrict}</option>
                    {formData.region && UZB_LOCATIONS[formData.region]?.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.school}</label>
                <input 
                  type="text" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none" placeholder={t.labels.schoolPlace}
                />
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.username}</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().trim()})}
                    className={`w-full pl-10 p-3 rounded-xl border bg-slate-700/50 outline-none font-bold transition-colors text-white ${
                      usernameStatus === 'valid' ? 'border-emerald-500/50 focus:border-emerald-500' :
                      usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-rose-500/50 focus:border-rose-500' :
                      'border-slate-600 focus:border-indigo-500'
                    }`}
                  />
                  <div className="absolute right-3 top-3.5">
                    {usernameStatus === 'checking' && <RefreshCw className="animate-spin text-slate-400" size={18}/>}
                    {usernameStatus === 'valid' && <CheckCircle className="text-emerald-400" size={18}/>}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="text-rose-400" size={18}/>}
                  </div>
                </div>
                {usernameStatus === 'invalid' && <p className="text-xs text-rose-400 mt-1.5 ml-1 font-medium">{usernameError}</p>}
                {usernameStatus === 'taken' && <p className="text-xs text-rose-400 mt-1.5 ml-1 font-medium">{usernameError}</p>}
                {usernameStatus === 'valid' && formData.username !== userData.username && (
                   <p className="text-xs text-emerald-400 mt-1.5 ml-1 font-medium">{t.status.avail}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.phone}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})}
                    className="w-full pl-10 p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t.labels.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input type="text" value={userData.email} disabled className="w-full pl-10 p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed"/>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-6">
               
               {!isGoogleUser && (
                 <div className="space-y-4">
                   <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3 text-orange-400 text-sm">
                      <AlertCircle size={20} className="shrink-0" />
                      <p>{t.security.warn}</p>
                   </div>
                   <input type="password" placeholder={t.security.current} value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white outline-none"/>
                   <input type="password" placeholder={t.security.new} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white outline-none"/>
                   <input type="password" placeholder={t.security.confirm} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-600 bg-slate-700/50 text-white outline-none"/>
                   <button onClick={handlePasswordClick} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition shadow-lg">{t.security.updateBtn}</button>
                 </div>
               )}

               {isGoogleUser && (
                 <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-blue-400 text-sm">
                    <CheckCircle size={20} className="shrink-0" />
                    <p>{t.security.googleWarn}</p>
                 </div>
               )}

               {/* DANGER ZONE - DELETE ACCOUNT */}
               <div className="pt-6 border-t border-slate-700">
                  <h3 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle size={16}/> {t.security.danger}
                  </h3>
                  
                  {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
                      <div className="text-xs text-slate-400">
                        <p className="font-bold text-slate-300">{t.security.deleteTitle}</p>
                        <p>{t.security.deleteDesc}</p>
                      </div>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg border border-red-500/50 transition-colors"
                      >
                        {t.security.deleteBtn}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 border border-red-500/50 bg-red-500/10 rounded-xl animate-in fade-in zoom-in-95">
                      <p className="text-sm font-bold text-red-200">{t.security.sureTitle}</p>
                      <p className="text-xs text-red-300/80">
                        {t.security.sureDesc}
                      </p>
                      
                      {!isGoogleUser && (
                        <input 
                          type="password" 
                          placeholder={t.security.passPlace}
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full p-3 rounded-lg border border-red-500/30 bg-slate-900/50 text-white text-sm outline-none focus:border-red-500"
                        />
                      )}

                      <div className="flex gap-3">
                         <button 
                           onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                           className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg"
                         >
                           {t.security.cancel}
                         </button>
                         <button 
                           onClick={handleDeleteAccount}
                           disabled={(!isGoogleUser && !deletePassword) || isDeleting}
                           className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           {isDeleting ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                           {t.security.yesDelete}
                         </button>
                      </div>
                    </div>
                  )}
               </div>
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-400 font-bold hover:text-white transition">{t.footer.cancel}</button>
          {activeTab !== 'security' && (
            <button
              onClick={handleSaveClick}
              disabled={saving || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {t.footer.save}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}