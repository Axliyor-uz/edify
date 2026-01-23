'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import {
  User, Mail, Save, LogOut, Award, Flame, Zap, Trophy,
  Calendar, Edit2, Shield, X, Lock, CheckCircle, RefreshCw, XCircle,
  AlertCircle, Sparkles, MapPin, School, AtSign, GraduationCap, Quote, Phone, Briefcase, Camera
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { checkUsernameUnique } from '@/services/userService';
import { motion } from 'framer-motion';

// --- FLOATING PARTICLES & GLOWING ORBS (Same as other pages) ---
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(particle.id) * 50, 0],
            opacity: [particle.opacity, particle.opacity * 0.1, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const GlowingOrb = ({ color, size, position }: { color: string; size: number; position: { x: string; y: string } }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${color} blur-3xl opacity-20`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: position.x,
        top: position.y,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// --- CONSTANTS & TYPES (Unchanged) ---
const UZB_LOCATIONS: Record<string, string[]> = {
  "Tashkent City": ["Chilanzar", "Yunusabad", "Mirzo Ulugbek", "Yashnobod", "Sergeli", "Bektemir", "Uchtepa", "Shaykhantakhur", "Almazar", "Yakkasaray", "Mirobod"],
  "Tashkent Region": ["Chirchik", "Angren", "Almalyk", "Yangiyo'l", "Bekabad", "Parkent", "Buka", "Chinaz"],
  "Samarkand": ["Samarkand City", "Urgut", "Ishtikhon", "Kattaqo'rg'on", "Pastdargom"],
  "Bukhara": ["Bukhara City", "Gijduvan", "Kogon", "Vobkent"],
  "Andijan": ["Andijan City", "Asaka", "Shahrixon"],
  "Fergana": ["Fergana City", "Margilan", "Kokand", "Rishton"],
  "Namangan": ["Namangan City", "Chust", "Kosonsoy"],
  "Khorezm": ["Urgench", "Khiva", "Shovot"],
  "Navoi": ["Navoi City", "Zarafshan", "Uchquduq"],
  "Kashkadarya": ["Karshi", "Shakhrisabz", "Kitob"],
  "Surkhandarya": ["Termez", "Denau", "Sherobod"],
  "Jizzakh": ["Jizzakh City", "Zomin", "Gallaorol"],
  "Syrdarya": ["Gulistan", "Yangiyer", "Sirdaryo"],
  "Karakalpakstan": ["Nukus", "Turtkul", "Beruniy"]
};

interface UserData {
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  role?: string;
  location?: { country: string; region: string; district: string };
  education?: { institution: string; grade: string };
  totalXP: number;
  currentStreak: number;
  level: number;
  dailyHistory: Record<string, number>;
}

const calculateLevel = (xp: number) => {
  if (!xp || xp < 0) return 1;
  return Math.floor(xp / 100) + 1;
};

const generateHeatmapData = (history: Record<string, number> = {}) => {
  const days = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1);
  const currentDate = new Date(startDate);
  while (currentDate <= today || currentDate.getDay() !== 0) {
    const dateStr = currentDate.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      xp: history[dateStr] || 0,
      dayOfWeek: currentDate.getDay(),
      month: currentDate.toLocaleString('default', { month: 'short' }),
      dayOfMonth: currentDate.getDate(),
      year: currentDate.getFullYear()
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
};

const getCellColor = (xp: number) => {
  if (xp === 0) return 'bg-slate-100 border-slate-200';
  if (xp < 50) return 'bg-indigo-200 border-indigo-300';
  if (xp < 100) return 'bg-indigo-400 border-indigo-500';
  if (xp < 200) return 'bg-indigo-600 border-indigo-700';
  return 'bg-indigo-800 border-indigo-900';
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

// --- MAIN COMPONENT ---
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>('profile');
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    phone: '',
    bio: '',
    country: 'Uzbekistan',
    region: '',
    district: '',
    institution: '',
    grade: ''
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Security State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // 1. FETCH DATA
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) {
        router.push('/auth/login');
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'users', u.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);
          setFormData({
            displayName: data.displayName || '',
            username: data.username || '',
            phone: data.phone || '+998 ',
            bio: data.bio || '',
            country: data.location?.country || 'Uzbekistan',
            region: data.location?.region || '',
            district: data.location?.district || '',
            institution: data.education?.institution || '',
            grade: data.education?.grade || '',
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. AUTO-SCROLL HEATMAP
  useEffect(() => {
    if (!loading && heatmapScrollRef.current) {
      heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth;
    }
  }, [loading, userData]);

  // 3. USERNAME CHECKER
  useEffect(() => {
    const check = async () => {
      if (formData.username === userData?.username) {
        setUsernameAvailable(true);
        return;
      }
      if (!formData.username || formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const isUnique = await checkUsernameUnique(formData.username);
        setUsernameAvailable(isUnique);
      } catch (error) {
        console.error(error);
        setUsernameAvailable(true);
      } finally {
        setCheckingUsername(false);
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [formData.username, userData?.username]);

  // 4. ACTIONS
  const handleLogout = async () => {
    try { await signOut(auth); router.push('/auth/login'); }
    catch (e) { console.error("Logout Failed", e); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {};
      updates.displayName = formData.displayName;
      updates.phone = formData.phone;
      updates.bio = formData.bio;
      updates.location = {
        country: formData.country,
        region: formData.region,
        district: formData.district
      };
      updates.education = {
        institution: formData.institution,
        grade: formData.grade
      };
      if (formData.username !== userData?.username) {
        if (usernameAvailable === false) {
          toast.error("Username is already taken");
          setSaving(false); return;
        }
        const newNameRef = doc(db, 'usernames', formData.username.toLowerCase());
        batch.set(newNameRef, { uid: user.uid });
        if (userData?.username) {
          const oldNameRef = doc(db, 'usernames', userData.username.toLowerCase());
          batch.delete(oldNameRef);
        }
        updates.username = formData.username.toLowerCase();
      }
      batch.update(userRef, updates);
      await batch.commit();
      setUserData({ ...userData!, ...updates });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPass !== confirmPass) return toast.error("Passwords do not match");
    if (newPass.length < 6) return toast.error("Password too short");
    try {
      const cred = EmailAuthProvider.credential(user!.email!, currentPass);
      await reauthenticateWithCredential(user!, cred);
      await updatePassword(user!, newPass);
      toast.success("Password updated!");
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e) {
      toast.error("Check current password.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      <FloatingParticles />
      <div className="text-center relative z-10">
        <RefreshCw className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
        <p className="text-indigo-600 font-bold">Loading Profile...</p>
      </div>
    </div>
  );

  if (!userData) return null;

  const currentLevel = calculateLevel(userData.totalXP);
  const heatmapData = generateHeatmapData(userData.dailyHistory);
  const activeDaysCount = heatmapData.filter(day => day.xp > 0).length;
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) weeks.push(heatmapData.slice(i, i + 7));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Background */}
      <FloatingParticles />
      <GlowingOrb color="bg-indigo-500" size={300} position={{ x: '10%', y: '20%' }} />
      <GlowingOrb color="bg-purple-500" size={400} position={{ x: '85%', y: '15%' }} />

      <div className="max-w-6xl mx-auto p-6 md:p-8 pb-20 relative z-10">
        <Toaster position="top-center" />

        {/* HERO PROFILE CARD */}
        <motion.div 
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-40 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950"></div>
          </div>
          
          <div className="px-6 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 relative">
              <div className="-mt-14 relative shrink-0">
                <div className="w-28 h-28 rounded-2xl border-4 border-white bg-slate-100 text-slate-400 flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <span>{userData.displayName?.[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      {userData.displayName}
                      {userData.role === 'teacher' && (
                        <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wide">
                          TEACHER
                        </span>
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm font-medium text-slate-500">
                      {userData.username && <span>@{userData.username}</span>}
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Briefcase size={14} className="text-indigo-600" />
                        {userData.role === 'teacher' ? 'Instructor' : 'Student'}
                      </span>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <MapPin size={14} className="text-indigo-600" />
                        {userData.location?.region || 'Uzbekistan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 size={16} /> Edit Profile
                    </motion.button>
                    <motion.button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut size={16} />
                    </motion.button>
                  </div>
                </div>

                {userData.bio && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                    <Quote size={16} className="text-indigo-200 absolute top-3 left-3 fill-current" />
                    <p className="text-slate-600 text-sm leading-relaxed italic font-medium pl-6 relative z-10">
                      {userData.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS & DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                <User size={16} className="text-indigo-600" /> Personal Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <Mail size={16}/>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                    <p className="text-sm font-bold text-slate-800 truncate" title={userData.email}>{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <MapPin size={16}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                    <p className="text-sm font-bold text-slate-800">
                      {userData.location?.district ? `${userData.location.district}, ` : ''}{userData.location?.region || 'Uzbekistan'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <School size={16}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Education</p>
                    <p className="text-sm font-bold text-slate-800">{userData.education?.institution || 'Not provided'}</p>
                    {userData.education?.grade && (
                      <p className="text-xs font-semibold text-slate-500 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">
                        {userData.education.grade.replace('school_', 'Grade ').replace('uni_', 'Year ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Trophy size={20}/>, value: userData.totalXP.toLocaleString(), label: "Total XP", color: "yellow" },
                { icon: <Flame size={20}/>, value: userData.currentStreak, label: "Day Streak", color: "orange" },
                { icon: <Award size={20}/>, value: currentLevel, label: "Current Level", color: "purple" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-${stat.color}-200 transition-colors`}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-10 h-10 bg-${stat.color}-50 rounded-full flex items-center justify-center text-${stat.color}-500 mb-3 group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600"/> Activity Log
                </h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">
                  {activeDaysCount} Days Active
                </span>
              </div>
              <div ref={heatmapScrollRef} className="overflow-x-auto pb-2 w-full custom-scrollbar">
                <div className="flex gap-2 min-w-max">
                  <div className="flex flex-col gap-[3px] text-[9px] font-bold text-slate-300 pt-[2px] mt-4">
                    <span className="h-[10px]">Mon</span><span className="h-[10px]"></span><span className="h-[10px]">Wed</span><span className="h-[10px]"></span><span className="h-[10px]">Fri</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex h-3 relative">
                      {weeks.map((week, i) => (
                        <div key={i} className="w-[13px] mr-[3px] relative">
                          {week[0].dayOfMonth <= 7 && <span className="absolute text-[9px] font-bold text-slate-400 top-0 left-0 whitespace-nowrap">{week[0].month}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
                      {heatmapData.map((day, i) => (
                        <div
                          key={i}
                          title={`${day.date}: ${day.xp} XP`}
                          className={`w-[11px] h-[11px] rounded-[2px] border ${getCellColor(day.xp)} hover:scale-125 transition-transform duration-200`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-400 font-medium">
                <span>Less</span>
                <div className="w-[10px] h-[10px] bg-slate-100 rounded-[2px] border border-slate-200"></div>
                <div className="w-[10px] h-[10px] bg-indigo-200 rounded-[2px] border border-indigo-300"></div>
                <div className="w-[10px] h-[10px] bg-indigo-400 rounded-[2px] border border-indigo-500"></div>
                <div className="w-[10px] h-[10px] bg-indigo-600 rounded-[2px] border border-indigo-700"></div>
                <div className="w-[10px] h-[10px] bg-indigo-800 rounded-[2px] border border-indigo-900"></div>
                <span>More</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* EDIT MODAL */}
        {isEditing && (
          <motion.div 
            className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Modal content remains exactly as before — no changes needed */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h2 className="text-lg font-black text-slate-900">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="flex border-b border-slate-100 px-6 bg-slate-50">
                {['profile', 'account', 'security'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors uppercase tracking-wide ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    {tab === 'profile' ? 'Public Profile' : tab === 'account' ? 'Account' : 'Security'}
                  </button>
                ))}
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Full Name</label>
                      <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold text-slate-800 transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Bio / About Me</label>
                      <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 resize-none transition-all placeholder:text-slate-300" placeholder="Tell us about yourself..."></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                      <div className="col-span-2">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <MapPin size={16} className="text-indigo-600"/> Location
                        </h4>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Region</label>
                        <div className="relative">
                          <select
                            value={formData.region}
                            onChange={(e) => setFormData({...formData, region: e.target.value, district: ''})}
                            className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-medium appearance-none"
                          >
                            <option value="">Select Region</option>
                            {Object.keys(UZB_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <div className="absolute right-4 top-4 pointer-events-none text-slate-400">▼</div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">District</label>
                        <div className="relative">
                          <select
                            value={formData.district}
                            onChange={(e) => setFormData({...formData, district: e.target.value})}
                            disabled={!formData.region}
                            className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-medium appearance-none disabled:opacity-50"
                          >
                            <option value="">Select District</option>
                            {formData.region && UZB_LOCATIONS[formData.region]?.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <div className="absolute right-4 top-4 pointer-events-none text-slate-400">▼</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-6">
                      <div className="col-span-1">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <School size={16} className="text-indigo-600"/> Education
                        </h4>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">School / University</label>
                        <input type="text" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all" placeholder="School Name" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Grade / Year</label>
                        <div className="relative">
                          <select
                            value={formData.grade}
                            onChange={(e) => setFormData({...formData, grade: e.target.value})}
                            className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-medium appearance-none"
                          >
                            <option value="">Select Grade</option>
                            <option value="school_7">7th Grade</option>
                            <option value="school_8">8th Grade</option>
                            <option value="school_9">9th Grade</option>
                            <option value="school_10">10th Grade</option>
                            <option value="school_11">11th Grade</option>
                            <option value="uni_1">University - 1st Year</option>
                            <option value="uni_2">University - 2nd Year</option>
                            <option value="uni_3">University - 3rd Year</option>
                            <option value="uni_4">University - 4th Year</option>
                          </select>
                          <div className="absolute right-4 top-4 pointer-events-none text-slate-400">▼</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Username (Unique)</label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          className={`w-full pl-10 p-3 h-12 rounded-xl border bg-slate-50 outline-none font-bold transition-all ${
                            usernameAvailable === true ? 'border-green-500 text-green-700 bg-green-50' :
                            usernameAvailable === false ? 'border-red-500 text-red-700 bg-red-50' :
                            'border-slate-200 focus:bg-white focus:border-indigo-500'
                          }`}
                        />
                        <div className="absolute right-3 top-3.5">
                          {checkingUsername ? <RefreshCw className="animate-spin text-slate-400" size={18}/> :
                          usernameAvailable === true ? <CheckCircle className="text-green-500" size={18}/> :
                          usernameAvailable === false ? <XCircle className="text-red-500" size={18}/> : null}
                        </div>
                      </div>
                      {usernameAvailable === false && <p className="text-xs font-bold text-red-500 mt-1 ml-1">Username is taken.</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Phone Number (Private)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})}
                          className="w-full pl-10 p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
                          placeholder="+998 (90) 123-45-67"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input type="text" value={userData.email} disabled className="w-full pl-10 p-3 h-12 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">Email cannot be changed.</p>
                    </div>
                  </div>
                )}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 text-orange-800 text-sm">
                      <AlertCircle size={20} className="shrink-0 text-orange-500" />
                      <p className="font-medium">Changing your password will require you to log in again on other devices.</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Current Password</label>
                      <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">New Password</label>
                      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Confirm Password</label>
                      <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="w-full p-3 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" />
                    </div>
                    <button onClick={handlePasswordUpdate} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg shadow-slate-200">
                      Update Password
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
                <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition text-sm">Cancel</button>
                {activeTab !== 'security' && (
                  <button
                    onClick={handleSave}
                    disabled={saving || usernameAvailable === false}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
