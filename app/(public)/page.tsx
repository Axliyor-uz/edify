'use client';

import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, BookOpen, Calculator, Globe, Brain, Palette, Zap, Star, 
  Users, Shield, BarChart3, Eye, Layout, GraduationCap,
  Maximize2, X, ChevronLeft, ChevronRight, CheckCircle2, 
  MapPin, Mail, Phone, Github, Linkedin, Send, FlaskConical 
} from 'lucide-react';
import Link from 'next/link';
import { LanguageContext } from './layout'; // 🟢 Importing Context from Layout

// --- 1. TRANSLATION DATA ---

const TRANSLATIONS = {
  uz: {
    hero: {
      badge: "✨ Ta'lim tizimining kelajagi shu yerda",
      titlePrefix: "Platforma:",
      titleHighlight: "Zamonaviy Ta'lim",
      titleSuffix: "Uchun",
      desc: "Edify o'qituvchilar va o'quvchilarni bog'laydi. Daqiqalar ichida kuchli testlar yarating, baholashni avtomatlashtiring va har bir o'quvchiga fanlarni o'zlashtirishda yordam bering.",
      btnStart: "Boshlash",
      btnLogin: "Kirish"
    },
    teacherSection: {
      badge: "O'qituvchilar Uchun",
      title: "O'qitishni kuchaytiruvchi vositalar.",
      desc: "AI yordamida test yaratishdan tortib chuqur tahlilgacha — o'qituvchilarga vaqtni tejash va o'quvchilar natijalarini yaxshilash uchun super kuchlarni bering."
    },
    studentSection: {
      badge: "O'quvchilar Uchun",
      title: "Qiziqarli o'quv jarayoni.",
      desc: "O'quvchilarga diqqatni jamlashga, o'sishni kuzatishga va natijalar bo'yicha tezkor fikr-mulohaza olishga yordam beradigan chalg'ituvchilarsiz muhit."
    },
    benefits: {
      title: "Nega Edify ni tanlash kerak?",
      items: [
        { title: "O'qituvchilar uchun", desc: "Soniya ichida test tuzing, sinflarni boshqaring va jurnallarni oson eksport qiling." },
        { title: "Xavfsiz Testlar", desc: "Fokus rejimi, tab almashishni aniqlash va aralashtirilgan savollar." },
        { title: "O'quvchilar uchun", desc: "Shaxsiy o'sishni kuzating, bo'shliqlarni aniqlang va fanlarni o'zlashtiring." },
        { title: "Tezkor Natijalar", desc: "O'quvchilar uchun darhol baholash, o'qituvchilar uchun batafsil tahlil." }
      ]
    },
    features: [
      { title: "Matematika", desc: "Murakkab formulalar uchun LaTeX, bosqichma-bosqich yechimlar va avto-baholash." },
      { title: "Adabiyot", desc: "Matn tahlili va insholarni avtomatik baholash yordamida o'qishni tushunish testlari." },
      { title: "Fan (Science)", desc: "Biologiya va Fizika uchun interaktiv vizual yordamlar bilan diagrammali savollar." },
      { title: "Tillar", desc: "So'z boyligi va grammatika uchun ko'p tilli baholash (O'zbek, Rus, Ingliz)." },
      { title: "San'at & Tarix", desc: "Gumanitar fanlar uchun vizual identifikatsiya viktorinalari va xronologik baholashlar." },
      { title: "Kimyo", desc: "Interaktiv davriy jadvallar, reaksiyalarni tenglashtirish va molekulyar tuzilmalar." }
    ],
    teacherData: [
      { title: "O'qituvchi Paneli", desc: "Sinfingiz uchun boshqaruv markazi. Faol testlar va statistikani bir qarashda ko'ring." },
      { title: "AI Test Yaratish", desc: "AI yordamida soniyalar ichida murakkab testlar tuzing. LaTeX va ochiq savollarni qo'llab-quvvatlaydi." },
      { title: "Aqlli Jurnal", desc: "Avtomatlashtirilgan baholash. Hisobotlarni eksport qiling va sinf ko'rsatkichlarini tahlil qiling." },
      { title: "Resurslar Kutubxonasi", desc: "Savollar bankini boshqaring, eski materiallardan qayta foydalaning va fanlar bo'yicha tartiblang." },
      { title: "Chop Etish Studiyasi", desc: "Raqamli testlarni oflayn imtihonlar uchun mukammal formatdagi PDF-larga aylantiring." },
      { title: "Sinf Sozlamalari", desc: "O'quvchilar ro'yxati, ruxsatnomalar va imtihon xavfsizligi konfiguratsiyalarini boshqaring." }
    ],
    studentData: [
      { title: "O'quvchi Portali", desc: "Shaxsiy ta'lim markazi. Kelgusi vazifalar, XP va kunlik faollikni kuzating." },
      { title: "Mening Sinflarim", desc: "Barcha yozilgan fanlar va kutilayotgan vazifalarning tartibli ko'rinishi." },
      { title: "Faol Imtihon", desc: "Kalkulyator va ma'lumotnomalar kabi o'rnatilgan vositalar bilan chalg'itmaydigan test muhiti." },
      { title: "Tezkor Natijalar", desc: "Batafsil yechim tushuntirishlari bilan natijalar bo'yicha darhol fikr-mulohaza." },
      { title: "O'quvchi Profili", desc: "Akademik o'sish, yutuqlar va to'plangan nishonlarni kuzatib boring." }
    ],
    experienceTitle: "Platformani His Qiling",
    experienceDesc: "Ta'limning har ikki tomoni uchun moslashtirilgan vositalar.",
    footer: {
      desc: "Wasp-2 AI tomonidan quvvatlanadi. Maktablar va undan tashqari uchun keyingi avlod baholash vositalarini yaratish.",
      platform: "Platforma",
      contact: "Aloqa",
      rights: "Barcha huquqlar himoyalangan."
    }
  },
  en: {
    hero: {
      badge: "✨ The Future of Assessment is Here",
      titlePrefix: "The Platform for",
      titleHighlight: "Modern Education",
      titleSuffix: "",
      desc: "Edify connects teachers and students. Create powerful assessments in minutes, automate grading, and help every student master their subjects.",
      btnStart: "Get Started",
      btnLogin: "Log In"
    },
    teacherSection: {
      badge: "For Educators",
      title: "Tools that empower teaching.",
      desc: "From AI-assisted test creation to deep analytics, give your faculty the superpowers they need to save time and improve student outcomes."
    },
    studentSection: {
      badge: "For Students",
      title: "Learning made engaging.",
      desc: "A distraction-free environment that helps students focus, track their growth, and receive instant feedback on their performance."
    },
    benefits: {
      title: "Why Choose Edify?",
      items: [
        { title: "For Teachers", desc: "Create custom tests in seconds, manage rosters, and export gradebooks effortlessly." },
        { title: "Secure Testing", desc: "Focus-mode, tab-switching detection, and randomized questions." },
        { title: "For Students", desc: "Track personal progress, identify weak spots, and master subjects." },
        { title: "Real-time Results", desc: "Instant grading and feedback for students, detailed analytics for educators." }
      ]
    },
    features: [
      { title: "Mathematics", desc: "LaTeX support for complex formulas, step-by-step solutions, and auto-grading." },
      { title: "Literature", desc: "Reading comprehension tests with rich text analysis." },
      { title: "Science", desc: "Diagram-based questions for Biology and Physics with interactive visual aids." },
      { title: "Languages", desc: "Multilingual assessment support (Uzbek, Russian, English)." },
      { title: "Arts & History", desc: "Visual identification quizzes and timeline-based assessments." },
      { title: "Chemistry", desc: "Interactive periodic tables, reaction balancing, and molecular structures." }
    ],
    teacherData: [
      { title: "Teacher Dashboard", desc: "A command center for your classroom. View active tests, recent activity, and quick stats at a glance." },
      { title: "AI Test Creation", desc: "Generate complex quizzes in seconds using AI. Supports LaTeX, multiple choice, and open-ended questions." },
      { title: "Smart Gradebook", desc: "Automated grading and score tracking. Export reports and analyze class performance trends." },
      { title: "Resource Library", desc: "Manage your question banks, reuse past materials, and organize content by subject." },
      { title: "Print Studio", desc: "Convert digital tests into perfectly formatted PDFs for offline exams with answer keys." },
      { title: "Class Settings", desc: "Manage student rosters, permissions, and exam security configurations." }
    ],
    studentData: [
      { title: "Student Portal", desc: "Your personal learning hub. Track upcoming assignments, XP, and daily streaks." },
      { title: "My Classes", desc: "Organized view of all enrolled subjects and pending tasks." },
      { title: "Active Exam Interface", desc: "A distraction-free testing environment with built-in tools like calculators and reference sheets." },
      { title: "Instant Results", desc: "Immediate feedback on performance with detailed solution explanations." },
      { title: "Student Profile", desc: "Track your academic growth, achievements, and badge collection." }
    ],
    experienceTitle: "Experience the Platform",
    experienceDesc: "Tailored tools for every side of the classroom.",
    footer: {
      desc: "Powered by Wasp-2 AI. Creating the next generation of assessment tools for Schools and beyond.",
      platform: "Platform",
      contact: "Contact",
      rights: "All rights reserved."
    }
  },
  ru: {
    hero: {
      badge: "✨ Будущее системы оценивания здесь",
      titlePrefix: "Платформа для",
      titleHighlight: "Современного Образования",
      titleSuffix: "",
      desc: "Edify соединяет учителей и учеников. Создавайте мощные тесты за минуты, автоматизируйте оценивание и помогайте каждому ученику осваивать предметы.",
      btnStart: "Начать",
      btnLogin: "Войти"
    },
    teacherSection: {
      badge: "Для Учителей",
      title: "Инструменты для эффективного обучения.",
      desc: "От создания тестов с ИИ до глубокой аналитики — дайте преподавателям суперсилы для экономии времени и улучшения результатов."
    },
    studentSection: {
      badge: "Для Учеников",
      title: "Увлекательное обучение.",
      desc: "Среда без отвлекающих факторов, помогающая ученикам сосредоточиться, отслеживать рост и получать мгновенную обратную связь."
    },
    benefits: {
      title: "Почему выбирают Edify?",
      items: [
        { title: "Для Учителей", desc: "Создавайте тесты за секунды, управляйте списками и экспортируйте журналы." },
        { title: "Безопасные Тесты", desc: "Режим фокусировки, детектор переключения вкладок и случайные вопросы." },
        { title: "Для Учеников", desc: "Отслеживайте прогресс, выявляйте слабые места и осваивайте предметы." },
        { title: "Мгновенные Результаты", desc: "Моментальная оценка для учеников, детальная аналитика для учителей." }
      ]
    },
    features: [
      { title: "Математика", desc: "Поддержка LaTeX для формул, пошаговые решения и авто-проверка." },
      { title: "Литература", desc: "Тесты на понимание прочитанного с анализом текста." },
      { title: "Наука", desc: "Вопросы с диаграммами по биологии и физике с визуальными подсказками." },
      { title: "Языки", desc: "Мультиязычная поддержка (Узбекский, Русский, Английский)." },
      { title: "Искусство и История", desc: "Викторины с визуальной идентификацией и хронологические оценки." },
      { title: "Химия", desc: "Интерактивные таблицы Менделеева, балансировка реакций и молекулярные структуры." }
    ],
    teacherData: [
      { title: "Панель Учителя", desc: "Командный центр вашего класса. Активные тесты и статистика с первого взгляда." },
      { title: "Создание Тестов с ИИ", desc: "Создавайте сложные тесты за секунды. Поддержка LaTeX и открытых вопросов." },
      { title: "Умный Журнал", desc: "Автоматическое оценивание. Экспорт отчетов и анализ успеваемости." },
      { title: "Библиотека Ресурсов", desc: "Управляйте банком вопросов и организуйте контент по предметам." },
      { title: "Студия Печати", desc: "Конвертация цифровых тестов в PDF для офлайн-экзаменов." },
      { title: "Настройки Класса", desc: "Управление списками учеников, правами доступа и безопасностью." }
    ],
    studentData: [
      { title: "Портал Ученика", desc: "Личный учебный центр. Предстоящие задания, XP и ежедневная активность." },
      { title: "Мои Классы", desc: "Организованный вид всех предметов и ожидающих задач." },
      { title: "Активный Экзамен", desc: "Среда тестирования без отвлечений с калькуляторами и справочниками." },
      { title: "Мгновенные Результаты", desc: "Моментальная обратная связь с подробным объяснением решений." },
      { title: "Профиль Ученика", desc: "Отслеживайте академический рост, достижения и коллекцию бейджей." }
    ],
    experienceTitle: "Опыт Платформы",
    experienceDesc: "Инструменты, адаптированные для обеих сторон учебного процесса.",
    footer: {
      desc: "При поддержке Wasp-2 AI. Создание инструментов оценки следующего поколения.",
      platform: "Платформа",
      contact: "Контакты",
      rights: "Все права защищены."
    }
  }
};

// --- 2. STATIC ASSETS & CONFIG ---

const teacherImages = [
  "/previews/teacher_dashboard.png",
  "/previews/teacher_create_test.png",
  "/previews/teacher_gradebook.png",
  "/previews/teacher_library.png",
  "/previews/teacher_print_studio.png",
  "/previews/teacher_setting.png"
];

const studentImages = [
  "/previews/student_dashboard.png",
  "/previews/student_class.png",
  "/previews/student_inside_class.png",
  "/previews/student_test_result.png",
  "/previews/student_profile.png"
];

const featureConfig = [
  { icon: Calculator, gradient: "from-blue-500 to-cyan-500", delay: 0.1 },
  { icon: BookOpen, gradient: "from-emerald-500 to-teal-500", delay: 0.2 },
  { icon: Brain, gradient: "from-purple-500 to-pink-500", delay: 0.3 },
  { icon: Globe, gradient: "from-orange-500 to-red-500", delay: 0.4 },
  { icon: Palette, gradient: "from-indigo-500 to-violet-500", delay: 0.5 },
  { icon: FlaskConical, gradient: "from-teal-500 to-green-500", delay: 0.6 }
];

const benefitConfig = [
  { icon: Users },
  { icon: Shield },
  { icon: BarChart3 },
  { icon: Zap }
];

// --- 3. COMPONENTS ---

// Full Screen Modal
const FullScreenModal = ({ isOpen, onClose, images, startIndex }: { isOpen: boolean, onClose: () => void, images: any[], startIndex: number }) => {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => { if (isOpen) setIndex(startIndex); }, [isOpen, startIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">{images[index].title}</span>
            <span className="text-slate-400 text-sm bg-white/10 px-2 py-0.5 rounded-full">{index + 1} / {images.length}</span>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-300 transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden" onClick={onClose}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex((prev) => (prev - 1 + images.length) % images.length); }}
          className="absolute left-4 p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition z-50 hidden md:block"
        >
          <ChevronLeft size={48} />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setIndex((prev) => (prev + 1) % images.length); }}
          className="absolute right-4 p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition z-50 hidden md:block"
        >
          <ChevronRight size={48} />
        </button>

        <div className="relative w-full h-full flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <AnimatePresence mode='wait'>
            <motion.img
                key={index}
                src={images[index].src}
                alt={images[index].title}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            </AnimatePresence>
            <p className="text-slate-300 text-base max-w-2xl text-center bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                {images[index].desc}
            </p>
        </div>
      </div>
    </motion.div>
  );
};

// Interactive Showcase Row
const ShowcaseRow = ({ title, description, role, data, badgeText }: { title: string, description: string, role: 'teacher' | 'student', data: any[], badgeText: string }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % data.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay, data.length]);

  const handleManualSwitch = (idx: number) => {
    setAutoPlay(false);
    setActiveTab(idx);
  };

  const themeColor = role === 'teacher' ? 'cyan' : 'purple';
  const gradient = role === 'teacher' ? 'from-cyan-500 to-blue-600' : 'from-purple-500 to-pink-600';
  const logoSrc = role === 'teacher' ? '/previews/teacher_logo.jpg' : '/previews/student_logo.png';
  const reverse = role === 'student';

  return (
    <div className={`flex flex-col gap-8 lg:gap-16 items-start lg:items-center py-20 ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      
      <div className="flex-1 w-full lg:w-1/2 px-4 flex flex-col justify-center h-full">
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl bg-${themeColor}-500/10 border border-${themeColor}-500/20`}>
                <img src={logoSrc} alt={`${role} logo`} className="w-8 h-8 object-contain" />
            </div>
            <span className={`text-${themeColor}-400 font-bold uppercase tracking-widest text-sm`}>
                {badgeText}
            </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{title}</h2>
        <p className="text-xl text-slate-300 mb-10 leading-relaxed">{description}</p>

        <div className="space-y-3">
          {data.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleManualSwitch(idx)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 border flex items-center justify-between group ${
                activeTab === idx 
                  ? `bg-gradient-to-r ${gradient} border-transparent shadow-lg transform scale-[1.02]` 
                  : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${activeTab === idx ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {idx + 1}
                </div>
                <div>
                  <h4 className={`font-bold ${activeTab === idx ? 'text-white' : 'text-slate-300'}`}>{item.title}</h4>
                  {activeTab === idx && <p className="text-xs text-white/80 mt-1 hidden sm:block animate-in fade-in">{item.desc}</p>}
                </div>
              </div>
              {activeTab === idx && <ChevronRight className="text-white" size={20} />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full lg:w-1/2 px-4 relative flex items-center">
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br ${gradient} opacity-20 blur-3xl -z-10`} />
         
         <motion.div 
           whileHover={{ scale: 1.02 }}
           className="relative cursor-zoom-in group w-full"
           onClick={() => setIsModalOpen(true)}
         >
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
               <Maximize2 size={14} /> Full Screen
            </div>

            <div className="bg-slate-900 rounded-t-2xl border-[8px] border-slate-800 border-b-0 shadow-2xl overflow-hidden aspect-[16/10] relative w-full">
               <AnimatePresence mode='wait'>
                  <motion.img 
                    key={activeTab}
                    src={data[activeTab].src} 
                    alt={data[activeTab].title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover object-top"
                  />
               </AnimatePresence>
            </div>
            <div className="h-4 bg-slate-800 rounded-b-2xl shadow-xl relative w-full">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-slate-700 rounded-b-lg"></div>
            </div>
         </motion.div>
      </div>

      <FullScreenModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        images={data} 
        startIndex={activeTab} 
      />
    </div>
  );
};


// --- 3. MAIN PAGE ---

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // 🟢 CONSUME CONTEXT from Layout
  // We explicitly cast the context type for simplicity here
  const { lang } = useContext(LanguageContext) as { lang: 'uz'|'en'|'ru' }; 
  
  // Get current translation
  const t = TRANSLATIONS[lang];

  // Merge static config with translated text
  const currentFeatures = featureConfig.map((f, i) => ({ ...f, ...t.features[i] }));
  const currentBenefits = benefitConfig.map((b, i) => ({ ...b, ...t.benefits.items[i] }));
  
  // Merge image paths with translated text for Showcase
  const currentTeacherData = teacherImages.map((src, i) => ({ src, ...t.teacherData[i] }));
  const currentStudentData = studentImages.map((src, i) => ({ src, ...t.studentData[i] }));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />
        <motion.div
          className="fixed w-80 h-80 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-full blur-3xl pointer-events-none"
          animate={{ x: mousePosition.x - 160, y: mousePosition.y - 160 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      {/* CONTENT */}
      <main className="flex-1 pt-24 lg:pt-5 relative z-10">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-32 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-cyan-400 font-bold text-sm tracking-wide">
                {t.hero.badge}
              </div>
              <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6">
                {t.hero.titlePrefix} <br/>
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t.hero.titleHighlight}
                </span>
                <br/> {t.hero.titleSuffix}
              </h1>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
                {t.hero.desc}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2">
                      {t.hero.btnStart} <ChevronRight size={20} />
                    </motion.button>
                </Link>
                <Link href="/auth/login">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-700 hover:border-slate-600 transition-colors">
                      {t.hero.btnLogin}
                    </motion.button>
                </Link>
              </div>
            </motion.div>
        </section>

        {/* FEATURES GRID */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-slate-600 transition-all group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PLATFORM SHOWCASE (ZIG-ZAG) */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 relative">
           
           <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">{t.experienceTitle}</h2>
              <p className="text-slate-400 text-xl">{t.experienceDesc}</p>
           </div>

           {/* Teacher Row */}
           <ShowcaseRow 
             role="teacher"
             title={t.teacherSection.title}
             description={t.teacherSection.desc}
             badgeText={t.teacherSection.badge}
             data={currentTeacherData}
           />

           <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-10" />

           {/* Student Row */}
           <ShowcaseRow 
             role="student"
             title={t.studentSection.title}
             description={t.studentSection.desc}
             badgeText={t.studentSection.badge}
             data={currentStudentData}
           />
        </section>

        {/* BENEFITS SECTION */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-12">{t.benefits.title}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {currentBenefits.map((benefit, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <benefit.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-400">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            
            {/* 1. Company Info & Socials */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-xl bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                  Edify.
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                {t.footer.desc}
              </p>
              
              <div className="flex gap-5">
                <motion.a 
                  href="https://github.com/Wasp-2-AI" 
                  target="_blank"
                  className="w-12 h-12 rounded-xl bg-slate-800/70 flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-cyan-500 transition-all border border-slate-700/50"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Github className="w-6 h-6" />
                </motion.a>
                <motion.a 
                  href="https://www.linkedin.com/company/wasp-2-ai" 
                  className="w-12 h-12 rounded-xl bg-slate-800/70 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-gradient-to-br hover:from-blue-600 hover:to-cyan-500 transition-all border border-slate-700/50"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Linkedin className="w-6 h-6" />
                </motion.a>
                <motion.a 
                  href="https://t.me/u_m_i_d_j_o_n_006" 
                  className="w-12 h-12 rounded-xl bg-slate-800/70 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-gradient-to-br hover:from-cyan-600 hover:to-teal-500 transition-all border border-slate-700/50"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="w-6 h-6 -ml-0.5 mt-0.5" /> 
                </motion.a>
              </div>
            </div>

            {/* 2. Platform Links */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">{t.footer.platform}</h3>
              <ul className="space-y-3">
                {['For Teachers', 'For Students', 'Features', 'Pricing', 'Login'].map((link) => (
                  <motion.li key={link}>
                    <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors hover:underline">
                      {link}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* 3. Contact & Map */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">{t.footer.contact}</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 text-sm">Afrosiyob koʻchasi, 15/2, Tashkent</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 text-sm">u.jumaqulov@newuu.uz</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 text-sm">+998 33 860 20 06</span>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden h-40 w-full border border-slate-700/50 shadow-lg grayscale hover:grayscale-0 transition-all duration-500 relative group">
                <iframe 
                  src="https://maps.google.com/maps?q=41.296837,69.272712&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                ></iframe>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-700/50 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} Wasp-2 AI Solutions. {t.footer.rights}</p>
          </div>
        </div>
      </footer>

    </div>
  );
}