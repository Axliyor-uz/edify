"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  User,
  Mail,
  LogOut,
  Award,
  Flame,
  Trophy,
  Calendar,
  Edit2,
  X,
  RefreshCw,
  MapPin,
  School,
  Quote,
  Briefcase,
  Menu,
  Info,
  Globe,
  Send,
  Github,
  Linkedin,
  Phone,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import EditProfileModal from "./_components/EditProfileModal";

// --- VISUAL COMPONENTS (Backgrounds & Nav) ---
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
          className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
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
            opacity: [
              particle.opacity,
              particle.opacity * 0.1,
              particle.opacity,
            ],
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

const GlowingOrb = ({
  color,
  size,
  position,
}: {
  color: string;
  size: number;
  position: { x: string; y: string };
}) => (
  <motion.div
    className={`absolute rounded-full ${color} blur-3xl opacity-20 pointer-events-none`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      left: position.x,
      top: position.y,
    }}
    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  />
);

const MobileNavBar = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center justify-between px-4 border-b border-slate-800 md:hidden">
    <div className="flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800"
      >
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-black text-white tracking-tight">Profile</h1>
    </div>
  </div>
);

// --- ABOUT / SUPPORT MODAL COMPONENT (Premium Version) ---
const AboutModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  // Contact Item Component for cleaner code
  const ContactCard = ({
    icon,
    title,
    value,
    href,
    colorClass,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    href?: string;
    colorClass: string;
  }) => {
    const Wrapper = href ? "a" : "div";
    return (
      <Wrapper
        href={href}
        target={href ? "_blank" : undefined}
        rel={href ? "noopener noreferrer" : undefined}
        className={`group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-${colorClass}-200 transition-all duration-300 cursor-pointer`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white bg-gradient-to-br ${colorClass} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
            {value}
          </p>
        </div>
      </Wrapper>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        // 🟢 Increased size to max-w-2xl for better PC view, w-full for mobile
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* PREMIUM HEADER */}
        <div className="relative h-40 bg-slate-900 overflow-hidden shrink-0">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2 animate-blob animation-delay-2000"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all z-20"
          >
            <X size={20} />
          </button>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-3">
              <span className="text-3xl font-black text-indigo-600">E</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Edify<span className="text-indigo-400">Platform</span>
            </h2>
            <p className="text-slate-400 text-xs font-medium mt-1">
              Empowering Education with AI
            </p>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 1: SUPPORT */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>{" "}
                Support & Contact
              </h3>

              {/* Telegram Card */}
              <ContactCard
                href="https://t.me/U_m_i_d_j_o_n_006"
                colorClass="from-blue-400 to-blue-600"
                title="Telegram Support"
                value="@U_m_i_d_j_o_n_006"
                icon={
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                }
              />

              {/* Phone Card */}
              <ContactCard
                colorClass="from-emerald-400 to-emerald-600"
                title="Call Center"
                value="+998 33 860 20 06"
                icon={<Phone size={24} />}
              />

              {/* Email Card (New) */}
              <ContactCard
                colorClass="from-orange-400 to-orange-600"
                title="Email Address"
                value="u.jumaqulov@newuu.uz"
                icon={<Mail size={24} />}
              />
            </div>

            {/* SECTION 2: DEVELOPER INFO */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>{" "}
                Developed By
              </h3>

              <div className="p-5 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Briefcase size={100} />
                </div>
                <h4 className="text-lg font-bold mb-1">WASP-2 AI Solutions</h4>
                <p className="text-slate-400 text-xs mb-4">
                  Innovating Education Technology
                </p>

                <div className="space-y-3">
                  {/* GitHub */}
                  <a
                    href="https://github.com/Wasp-2-AI"
                    target="_blank"
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="bg-white text-slate-900 p-1.5 rounded-full">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold">
                      github.com/wasp-2-ai
                    </span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/wasp-2-ai"
                    target="_blank"
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="bg-[#0077b5] text-white p-1.5 rounded-full">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold">
                      WASP-2 AI Solutions
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* VERSION FOOTER */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400">
              © 2026 WASP-2 AI Solutions. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                v1.0.0
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-600">
                System Operational
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- HELPER FUNCTIONS ---
const calculateLevel = (xp: number) => {
  if (!xp || xp < 0) return 1;
  return Math.floor(xp / 100) + 1;
};

const getCellColor = (xp: number) => {
  if (xp === 0) return "bg-slate-700/50 border-slate-600";
  if (xp < 50) return "bg-indigo-500/20 border-indigo-500/30";
  if (xp < 100) return "bg-indigo-500/40 border-indigo-500/50";
  if (xp < 200) return "bg-indigo-500/60 border-indigo-500/70";
  return "bg-indigo-500/80 border-indigo-500";
};

const generateHeatmapData = (history: Record<string, number> = {}) => {
  const days = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1);
  const currentDate = new Date(startDate);
  while (currentDate <= today || currentDate.getDay() !== 0) {
    const dateStr = currentDate.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      xp: history[dateStr] || 0,
      dayOfWeek: currentDate.getDay(),
      month: currentDate.toLocaleString("default", { month: "short" }),
      dayOfMonth: currentDate.getDate(),
      year: currentDate.getFullYear(),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
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
  birthDate?: string; // Added field
  totalXP: number;
  currentStreak: number;
  level: number;
  dailyHistory: Record<string, number>;
}

// --- MAIN PAGE ---
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const heatmapScrollRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false); // 🟢 New State for About Modal
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) {
        router.push("/auth/login");
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "users", u.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);
          setFormData({
            displayName: data.displayName || "",
            username: data.username || "",
            phone: data.phone || "+998 ",
            bio: data.bio || "",
            country: data.location?.country || "Uzbekistan",
            region: data.location?.region || "",
            district: data.location?.district || "",
            institution: data.education?.institution || "",
            grade: data.education?.grade || "",
            birthDate: data.birthDate || "", // 🟢 Populating Birth Date
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!loading && heatmapScrollRef.current) {
      heatmapScrollRef.current.scrollLeft =
        heatmapScrollRef.current.scrollWidth;
    }
  }, [loading, userData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (e) {
      console.error("Logout Failed", e);
    }
  };

  const handleSaveProfile = async (updatedData: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", user.uid);
      const updates: any = {
        displayName: updatedData.displayName,
        phone: updatedData.phone,
        bio: updatedData.bio,
        location: {
          country: updatedData.country,
          region: updatedData.region,
          district: updatedData.district,
        },
        education: {
          institution: updatedData.institution,
          grade: updatedData.grade,
        },
        birthDate: updatedData.birthDate, // 🟢 Saving Birth Date
      };

      if (updatedData.username !== userData?.username) {
        const newNameRef = doc(
          db,
          "usernames",
          updatedData.username.toLowerCase()
        );
        batch.set(newNameRef, { uid: user.uid });
        if (userData?.username) {
          const oldNameRef = doc(
            db,
            "usernames",
            userData.username.toLowerCase()
          );
          batch.delete(oldNameRef);
        }
        updates.username = updatedData.username.toLowerCase();
      }

      batch.update(userRef, updates);
      await batch.commit();
      setUserData({ ...userData!, ...updates });
      setFormData(updatedData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (current: string, newP: string) => {
    try {
      if (!user || !user.email) return;
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newP);
      toast.success("Password updated!");
    } catch (e) {
      toast.error("Failed. Check current password.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 flex items-center justify-center relative overflow-hidden">
        <FloatingParticles />
        <div className="z-10 text-center">
          <RefreshCw
            className="animate-spin text-blue-400 mx-auto mb-4"
            size={32}
          />
          <p className="text-blue-400 font-bold">Loading Profile...</p>
        </div>
      </div>
    );

  if (!userData) return null;

  const currentLevel = calculateLevel(userData.totalXP);
  const heatmapData = generateHeatmapData(userData.dailyHistory);
  const activeDaysCount = heatmapData.filter((day) => day.xp > 0).length;
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7)
    weeks.push(heatmapData.slice(i, i + 7));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <GlowingOrb
        color="bg-blue-500"
        size={300}
        position={{ x: "10%", y: "20%" }}
      />
      <GlowingOrb
        color="bg-purple-500"
        size={400}
        position={{ x: "85%", y: "15%" }}
      />
      <GlowingOrb
        color="bg-orange-500"
        size={250}
        position={{ x: "70%", y: "80%" }}
      />

      <MobileNavBar onMenuClick={() => setIsMobileMenuOpen(true)} />

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 md:hidden pt-20 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-white p-2 bg-slate-800 rounded-lg"
            >
              <X size={24} />
            </button>
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="block text-lg font-bold text-white py-3 px-4 bg-slate-800 rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/classes"
                className="block text-lg font-bold text-white py-3 px-4 bg-slate-800 rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Classes
              </Link>
              <Link
                href="/leaderboard"
                className="block text-lg font-bold text-white py-3 px-4 bg-slate-800 rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/history"
                className="block text-lg font-bold text-white py-3 px-4 bg-slate-800 rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </Link>
              <Link
                href="/profile"
                className="block text-lg font-bold text-white py-3 px-4 bg-indigo-600 rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto p-4 md:p-6 md:p-8 pb-20 pt-20 md:pt-8 relative z-10">
        <Toaster position="top-center" />

        <motion.div
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-40 bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800"></div>
          </div>

          <div className="px-4 md:px-6 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
              <div className="-mt-14 relative shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-slate-900 bg-slate-800/50 text-slate-300 flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <span>{userData.displayName?.[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                      {userData.displayName}
                      {userData.role === "teacher" && (
                        <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wide">
                          TEACHER
                        </span>
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm font-medium text-slate-400">
                      {userData.username && <span>@{userData.username}</span>}
                      <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Briefcase size={14} className="text-indigo-400" />{" "}
                        {userData.role === "teacher" ? "Instructor" : "Student"}
                      </span>
                      <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MapPin size={14} className="text-indigo-400" />{" "}
                        {userData.location?.region || "Uzbekistan"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                    {/* Edit Profile Button */}
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-800 border border-slate-600 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 size={16} /> Edit Profile
                    </motion.button>

                    {/* Support Button (Styled like Edit) */}
                    <motion.button
                      onClick={() => setIsAboutOpen(true)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-800 border border-slate-600 text-white font-bold rounded-xl text-sm hover:bg-slate-700 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Info size={16} /> Support
                    </motion.button>

                    {/* Logout Button (Red Style) */}
                    <motion.button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center"
                      title="Sign Out"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut size={16} />
                    </motion.button>
                  </div>
                </div>

                {userData.bio && (
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 relative">
                    <Quote
                      size={16}
                      className="text-indigo-200 absolute top-3 left-3 fill-current"
                    />
                    <p className="text-slate-300 text-sm leading-relaxed italic font-medium pl-6 relative z-10">
                      {userData.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ... (Stats & Details Grid remains unchanged) ... */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-lg h-full">
              <h3 className="text-sm font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2 pb-4 border-b border-slate-700">
                <User size={16} className="text-indigo-400" /> Personal Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-400">
                    <Mail size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Email Address
                    </p>
                    <p
                      className="text-sm font-bold text-white truncate"
                      title={userData.email}
                    >
                      {userData.email}
                    </p>
                  </div>
                </div>
                {/* 🟢 ADDED BIRTH DATE TO DISPLAY */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Birth Date
                    </p>
                    <p className="text-sm font-bold text-white">
                      {userData.birthDate || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Location
                    </p>
                    <p className="text-sm font-bold text-white">
                      {userData.location?.district
                        ? `${userData.location.district}, `
                        : ""}
                      {userData.location?.region || "Uzbekistan"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-400">
                    <School size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Education
                    </p>
                    <p className="text-sm font-bold text-white">
                      {userData.education?.institution || "Not provided"}
                    </p>
                    {userData.education?.grade && (
                      <p className="text-xs font-semibold text-slate-400 mt-1 bg-slate-700/50 inline-block px-2 py-0.5 rounded">
                        {userData.education.grade
                          .replace("school_", "Grade ")
                          .replace("uni_", "Year ")}
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
                {
                  icon: <Trophy size={20} />,
                  value: userData.totalXP.toLocaleString(),
                  label: "Total XP",
                  color: "yellow",
                },
                {
                  icon: <Flame size={20} />,
                  value: userData.currentStreak,
                  label: "Day Streak",
                  color: "orange",
                },
                {
                  icon: <Award size={20} />,
                  value: currentLevel,
                  label: "Current Level",
                  color: "purple",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center group hover:border-${stat.color}-500/30 transition-colors`}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`w-10 h-10 bg-${stat.color}-500/20 rounded-full flex items-center justify-center text-${stat.color}-400 mb-3 group-hover:scale-110 transition-transform`}
                  >
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-black text-white">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" /> Activity
                  Log
                </h3>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded-md">
                  {activeDaysCount} Days Active
                </span>
              </div>
              <div
                ref={heatmapScrollRef}
                className="overflow-x-auto pb-2 w-full custom-scrollbar"
              >
                <div className="flex gap-2 min-w-max">
                  <div className="flex flex-col gap-[3px] text-[9px] font-bold text-slate-400 pt-[2px] mt-4">
                    <span className="h-[10px]">Mon</span>
                    <span className="h-[10px]"></span>
                    <span className="h-[10px]">Wed</span>
                    <span className="h-[10px]"></span>
                    <span className="h-[10px]">Fri</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex h-3 relative">
                      {weeks.map((week, i) => (
                        <div key={i} className="w-[13px] mr-[3px] relative">
                          {week[0].dayOfMonth <= 7 && (
                            <span className="absolute text-[9px] font-bold text-slate-400 top-0 left-0 whitespace-nowrap">
                              {week[0].month}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
                      {heatmapData.map((day, i) => (
                        <div
                          key={i}
                          title={`${day.date}: ${day.xp} XP`}
                          className={`w-[11px] h-[11px] rounded-[2px] border ${getCellColor(
                            day.xp
                          )} hover:scale-125 transition-transform duration-200`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-400 font-medium">
                <span>Less</span>
                <div className="w-[10px] h-[10px] bg-slate-700/50 rounded-[2px] border border-slate-600"></div>
                <div className="w-[10px] h-[10px] bg-indigo-500/20 rounded-[2px] border border-indigo-500/30"></div>
                <div className="w-[10px] h-[10px] bg-indigo-500/40 rounded-[2px] border border-indigo-500/50"></div>
                <div className="w-[10px] h-[10px] bg-indigo-500/60 rounded-[2px] border border-indigo-500/70"></div>
                <div className="w-[10px] h-[10px] bg-indigo-500/80 rounded-[2px] border border-indigo-500"></div>
                <span>More</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* EDIT MODAL */}
        <AnimatePresence>
          {isEditing && (
            <EditProfileModal
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              userData={userData}
              initialData={formData}
              onSave={handleSaveProfile}
              onPasswordUpdate={handlePasswordUpdate}
              saving={saving}
            />
          )}
        </AnimatePresence>

        {/* 🟢 ABOUT MODAL */}
        <AnimatePresence>
          {isAboutOpen && (
            <AboutModal
              isOpen={isAboutOpen}
              onClose={() => setIsAboutOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
