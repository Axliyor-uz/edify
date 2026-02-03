'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  User, MapPin, Briefcase, Calendar, Settings, 
  Mail, Phone, ShieldCheck, Globe, BookOpen,
  GraduationCap, Award, Loader2
} from 'lucide-react';
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const PROFILE_TRANSLATIONS = {
  uz: {
    notFound: "Profil topilmadi.",
    edit: "Profilni Tahrirlash",
    verified: "Tasdiqlangan",
    instructor: "O'qituvchi",
    student: "O'quvchi",
    contactTitle: "Aloqa Ma'lumotlari",
    email: "Email Manzili",
    phone: "Telefon Raqami",
    notProvided: "Kiritilmagan",
    workTitle: "Joylashuv va Ish",
    institution: "Muassasa",
    location: "Joylashuv",
    accountTitle: "Hisob Ma'lumotlari",
    tests: "Yaratilgan Testlar",
    classes: "Sinflar",
    students: "O'quvchilar",
    joined: "Qo'shilgan Yili"
  },
  en: {
    notFound: "Profile not found.",
    edit: "Edit Profile",
    verified: "Verified",
    instructor: "Instructor",
    student: "Student",
    contactTitle: "Contact Details",
    email: "Email Address",
    phone: "Phone Number",
    notProvided: "Not provided",
    workTitle: "Location & Work",
    institution: "Institution",
    location: "Location",
    accountTitle: "Account Information",
    tests: "Tests Created",
    classes: "Classes",
    students: "Students",
    joined: "Joined"
  },
  ru: {
    notFound: "Профиль не найден.",
    edit: "Редактировать",
    verified: "Подтвержден",
    instructor: "Преподаватель",
    student: "Ученик",
    contactTitle: "Контактные Данные",
    email: "Email адрес",
    phone: "Телефон",
    notProvided: "Не указано",
    workTitle: "Местоположение и Работа",
    institution: "Учреждение",
    location: "Местоположение",
    accountTitle: "Информация об Аккаунте",
    tests: "Создано Тестов",
    classes: "Классы",
    students: "Ученики",
    joined: "Дата регистрации"
  }
};

export default function TeacherProfilePage() {
  const { user } = useAuth();
  
  // 🟢 Use Language Hook
  const { lang } = useTeacherLanguage();
  const t = PROFILE_TRANSLATIONS[lang];

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32}/>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">{t.notFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-6 py-6 md:py-8">
        
        {/* --- HEADER / HERO SECTION --- */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
          {/* Banner with gradient */}
          <div className="h-40 md:h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
            
            <div className="absolute top-4 md:top-6 right-4 md:right-6">
              <Link 
                href="/teacher/settings" 
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl backdrop-blur-md font-bold text-xs md:text-sm transition-all hover:scale-105 active:scale-95 border border-white/30"
              >
                <Settings size={16} /> 
                <span className="hidden sm:inline">{t.edit}</span>
                <span className="sm:hidden">{t.edit}</span>
              </Link>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-6 md:px-8 pb-8">
            <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 -mt-16 md:-mt-20 mb-6">
              {/* Avatar */}
              <div className="flex items-end gap-4">
                <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-3xl p-2 shadow-2xl border-2 border-white">
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-black text-indigo-600">
                    {profile.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
                
                {/* Mobile badges */}
                <div className="flex flex-col gap-2 sm:hidden pb-2">
                  {profile.verifiedTeacher && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border-2 border-blue-200 shadow-sm">
                      <ShieldCheck size={14} /> {t.verified}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Name and username */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">{profile.displayName}</h1>
                {profile.verifiedTeacher && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border-2 border-blue-200 shadow-sm">
                    <ShieldCheck size={14} /> {t.verified} {t.instructor}
                  </span>
                )}
              </div>
              <p className="text-slate-500 font-semibold text-base md:text-lg mb-1">@{profile.username}</p>
              
              {/* Role badge */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-bold rounded-full border-2 border-indigo-200">
                  <GraduationCap size={14} /> {profile.role === 'teacher' ? t.instructor : t.student}
                </span>
              </div>

              {profile.bio && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- DETAILS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Contact Info */}
          <div className="bg-white p-6 md:p-7 rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <User size={20} className="text-indigo-600"/>
              </div>
              <h3 className="font-black text-slate-900 text-lg">{t.contactTitle}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 border-2 border-indigo-100">
                  <Mail size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{t.email}</p>
                  <p className="text-slate-800 font-semibold text-sm md:text-base break-words">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 flex-shrink-0 border-2 border-emerald-100">
                  <Phone size={18}/>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{t.phone}</p>
                  <p className="text-slate-800 font-semibold text-sm md:text-base">{profile.phone || t.notProvided}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Institution & Location */}
          <div className="bg-white p-6 md:p-7 rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Globe size={20} className="text-purple-600"/>
              </div>
              <h3 className="font-black text-slate-900 text-lg">{t.workTitle}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center text-purple-600 flex-shrink-0 border-2 border-purple-100">
                  <BookOpen size={18}/>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{t.institution}</p>
                  <p className="text-slate-800 font-semibold text-sm md:text-base">{profile.institution || t.notProvided}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-600 flex-shrink-0 border-2 border-amber-100">
                  <MapPin size={18}/>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{t.location}</p>
                  <p className="text-slate-800 font-semibold text-sm md:text-base">
                    {[profile.location?.district, profile.location?.region, profile.location?.country].filter(Boolean).join(', ') || t.notProvided}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- STATS SECTION --- */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-slate-700">
          <h3 className="text-white font-black text-lg md:text-xl mb-6 flex items-center gap-2">
            <Award size={24} className="text-indigo-400" />
            {t.accountTitle}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-2xl md:text-3xl font-black text-white mb-1">-</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.tests}</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-2xl md:text-3xl font-black text-white mb-1">-</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.classes}</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-2xl md:text-3xl font-black text-white mb-1">-</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.students}</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-2xl md:text-3xl font-black text-white mb-1">
                {profile.createdAt 
                  ? (profile.createdAt.toDate ? new Date(profile.createdAt.toDate()).getFullYear() : new Date(profile.createdAt).getFullYear())
                  : '-'}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.joined}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}