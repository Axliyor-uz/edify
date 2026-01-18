'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore'; 
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { 
  User, Mail, Save, LogOut, Award, Flame, Zap, Trophy,
  Calendar, Edit2, Shield, X, Lock, CheckCircle, RefreshCw, XCircle,
  AlertCircle, Sparkles, MapPin, School, AtSign, GraduationCap, Quote, Phone, Briefcase
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { checkUsernameUnique } from '@/services/userService';

// --- CONSTANTS ---
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

// --- TYPES ---
interface UserData {
  username: string; 
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  role?: string; // Added Role
  location?: { country: string; region: string; district: string };
  education?: { institution: string; grade: string };
  totalXP: number;
  currentStreak: number;
  level: number;
  dailyHistory: Record<string, number>; 
}

// --- HELPERS ---
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
  if (xp < 50) return 'bg-emerald-200 border-emerald-300'; 
  if (xp < 100) return 'bg-emerald-400 border-emerald-500'; 
  if (xp < 200) return 'bg-emerald-600 border-emerald-700'; 
  return 'bg-emerald-800 border-emerald-900'; 
};

// Phone Formatter
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

// --- COMPONENT ---
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
                
                // Initialize Form
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

        // A. Basic Info
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

        // B. Handle Username Change
        if (formData.username !== userData?.username) {
            if (usernameAvailable === false) {
                toast.error("Username is already taken");
                setSaving(false); return;
            }
            // 1. Reserve new
            const newNameRef = doc(db, 'usernames', formData.username.toLowerCase());
            batch.set(newNameRef, { uid: user.uid });
            
            // 2. Delete old
            if (userData?.username) {
                const oldNameRef = doc(db, 'usernames', userData.username.toLowerCase());
                batch.delete(oldNameRef);
            }
            updates.username = formData.username.toLowerCase();
        }

        // C. Commit
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-slate-400"/></div>;
  if (!userData) return null;

  const currentLevel = calculateLevel(userData.totalXP);
  const heatmapData = generateHeatmapData(userData.dailyHistory);
  const activeDaysCount = heatmapData.filter(day => day.xp > 0).length;
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) weeks.push(heatmapData.slice(i, i + 7));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <Toaster position="top-center" />

        {/* 1. HERO PROFILE CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative group">
            {/* Background Pattern */}
            <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
            
            <div className="px-8 pb-6">
                <div className="flex flex-col md:flex-row gap-6 relative">
                    
                    {/* Avatar */}
                    <div className="-mt-16 relative shrink-0">
                        <div className="w-32 h-32 rounded-3xl border-4 border-white bg-slate-900 text-white flex items-center justify-center text-4xl font-bold shadow-xl overflow-hidden">
                            {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : userData.displayName?.[0]?.toUpperCase()}
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="pt-4 flex-1">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                    {userData.displayName}
                                    {/* STATUS BADGE */}
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
                                        <Briefcase size={12} /> {userData.role || 'Student'}
                                    </span>
                                </h1>
                                
                                <div className="flex items-center gap-3 mt-1">
                                    {userData.username && <span className="text-lg font-medium text-slate-400">@{userData.username}</span>}
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                        <Award size={12} /> LVL {currentLevel}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Header Buttons */}
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex items-center gap-2">
                                    <Edit2 size={16} /> Edit Profile
                                </button>
                                <button onClick={handleLogout} className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition border border-red-100 flex items-center gap-2">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                        
                        {/* ✒️ BEAUTIFUL BIO */}
                        {userData.bio && (
                            <div className="mt-6 relative pl-5 py-1 border-l-4 border-blue-200">
                                <Quote size={24} className="text-blue-100 absolute -top-3 -left-2 fill-current" />
                                <p className="text-slate-600 text-sm leading-relaxed italic font-medium">
                                    "{userData.bio}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 2. STATS & DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: ACCOUNT DETAILS (Moved Location/Edu Here) */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-4">
                        <User size={20} className="text-blue-500" /> Account Details
                    </h3>
                    <div className="space-y-5">
                        
                        {/* Email */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Mail size={18}/></div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                <p className="text-sm font-bold text-slate-700 truncate">{userData.email}</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><MapPin size={18}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                                <p className="text-sm font-bold text-slate-700">
                                    {userData.location?.district || 'Unknown'}, {userData.location?.region || 'Uzbekistan'}
                                </p>
                            </div>
                        </div>

                        {/* Education */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><School size={18}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Education</p>
                                <p className="text-sm font-bold text-slate-700">{userData.education?.institution || 'Not set'}</p>
                                <p className="text-xs font-semibold text-slate-500">
                                    {userData.education?.grade ? userData.education.grade.replace('school_', 'Grade ').replace('uni_', 'Year ') : ''}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Right: Gamification */}
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 mb-2"><Trophy size={24}/></div>
                        <div className="text-2xl font-black text-slate-900">{userData.totalXP}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Total XP</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-2"><Flame size={24}/></div>
                        <div className="text-2xl font-black text-slate-900">{userData.currentStreak}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Streak</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2"><Award size={24}/></div>
                        <div className="text-2xl font-black text-slate-900">{currentLevel}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Level</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Calendar size={20} className="text-emerald-500"/> Activity Log</h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{activeDaysCount} Days Active</span>
                    </div>
                    <div ref={heatmapScrollRef} className="overflow-x-auto pb-2 w-full">
                        <div className="flex gap-2 min-w-max">
                            <div className="flex flex-col gap-[3px] text-[10px] font-bold text-slate-300 pt-[2px] mt-4">
                                <span className="h-[10px]">M</span><span className="h-[10px]"></span><span className="h-[10px]">W</span><span className="h-[10px]"></span><span className="h-[10px]">F</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex h-3 relative">
                                    {weeks.map((week, i) => (<div key={i} className="w-[13px] mr-[3px] relative">{week[0].dayOfMonth <= 7 && <span className="absolute text-[10px] font-bold text-slate-400 top-0 left-0 whitespace-nowrap">{week[0].month}</span>}</div>))}
                                </div>
                                <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
                                    {heatmapData.map((day, i) => (<div key={i} title={`${day.date}: ${day.xp} XP`} className={`w-[11px] h-[11px] rounded-[2px] border ${getCellColor(day.xp)}`} />))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. EDIT MODAL */}
        {isEditing && (
            <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h2 className="text-xl font-black text-slate-800">Edit Profile</h2>
                        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
                        {['profile', 'account', 'security'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)} 
                                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab === 'profile' ? 'Public Profile' : tab === 'account' ? 'Account Details' : 'Security'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 bg-white">
                        
                        {/* 🔵 TAB 1: PUBLIC PROFILE (Location & Education BACK HERE) */}
                        {activeTab === 'profile' && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                                    <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-semibold text-slate-700 transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bio / About Me</label>
                                    <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-medium text-slate-700 resize-none transition-all" placeholder="Tell us about yourself..."></textarea>
                                </div>

                                {/* Location Selectors (Back Here) */}
                                <div className="grid grid-cols-2 gap-4 border-t pt-4 border-slate-100">
                                    <div className="col-span-2">
                                        <p className="text-sm font-black text-slate-800">Location</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Region</label>
                                        <select 
                                            value={formData.region} 
                                            onChange={(e) => setFormData({...formData, region: e.target.value, district: ''})} 
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium bg-white"
                                        >
                                            <option value="">Select Region</option>
                                            {Object.keys(UZB_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">District</label>
                                        <select 
                                            value={formData.district} 
                                            onChange={(e) => setFormData({...formData, district: e.target.value})} 
                                            disabled={!formData.region}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium bg-white disabled:bg-slate-50"
                                        >
                                            <option value="">Select District</option>
                                            {formData.region && UZB_LOCATIONS[formData.region]?.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Education Selectors (Back Here) */}
                                <div className="grid grid-cols-1 gap-4 border-t pt-4 border-slate-100">
                                    <div className="col-span-1">
                                        <p className="text-sm font-black text-slate-800">Education</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">School / University</label>
                                        <div className="relative">
                                            <School className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                            <input type="text" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium transition-all" placeholder="School Name" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Grade / Year</label>
                                        <select 
                                            value={formData.grade} 
                                            onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium bg-white"
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
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🔵 TAB 2: ACCOUNT DETAILS (Only Username & Phone) */}
                        {activeTab === 'account' && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                {/* Username */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Username (Unique)</label>
                                    <div className="relative">
                                        <AtSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={formData.username} 
                                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                                            className={`w-full pl-10 p-3 rounded-xl border outline-none font-bold transition-all ${
                                                usernameAvailable === true ? 'border-green-500 bg-green-50 text-green-700' : 
                                                usernameAvailable === false ? 'border-red-500 bg-red-50 text-red-700' : 
                                                'border-slate-200 focus:border-blue-500'
                                            }`} 
                                        />
                                        <div className="absolute right-3 top-3.5">
                                            {checkingUsername ? <RefreshCw className="animate-spin text-slate-400" size={18}/> : 
                                             usernameAvailable === true ? <CheckCircle className="text-green-500" size={18}/> :
                                             usernameAvailable === false ? <XCircle className="text-red-500" size={18}/> : null}
                                        </div>
                                    </div>
                                    {usernameAvailable === false && <p className="text-xs text-red-500 mt-1">Username is taken.</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Phone Number (Private)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input 
                                            type="tel" 
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})} 
                                            className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium transition-all" 
                                            placeholder="+998 (90) 123-45-67"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Address</label>
                                    <input type="text" value={userData.email} disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed" />
                                </div>
                            </div>
                        )}

                        {/* 🔵 TAB 3: SECURITY */}
                        {activeTab === 'security' && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex gap-3 text-orange-700 text-sm">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p>Changing your password will require you to log in again on other devices.</p>
                                </div>
                                <input type="password" placeholder="Current Password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
                                <input type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
                                <input type="password" placeholder="Confirm New Password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
                                <button onClick={handlePasswordUpdate} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-black transition shadow-lg">Update Password</button>
                            </div>
                        )}
                    </div>
                                                            
                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
                        {activeTab !== 'security' && (
                            <button 
                                onClick={handleSave} 
                                disabled={saving || usernameAvailable === false}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}


