"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from "firebase/auth";
import { doc, writeBatch, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { checkUsernameUnique } from "@/services/userService";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  GraduationCap,
  School,
  User,
  Mail,
  Lock,
  MapPin,
  Building2,
  BookOpen,
  Eye,
  EyeOff,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

// --- DATA: Expanded Uzbekistan Regions (Unchanged) ---
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

// --- HELPER: Phone Formatter ---
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length === 0) return "+998 ";
  let formatted = "+998 ";
  const inputNumbers = numbers.startsWith("998") ? numbers.slice(3) : numbers;
  if (inputNumbers.length > 0) formatted += ` (${inputNumbers.slice(0, 2)}`;
  if (inputNumbers.length >= 2) formatted += `) ${inputNumbers.slice(2, 5)}`;
  if (inputNumbers.length >= 5) formatted += `-${inputNumbers.slice(5, 7)}`;
  if (inputNumbers.length >= 7) formatted += `-${inputNumbers.slice(7, 9)}`;
  return formatted;
};

// --- HELPER: Password Validator ---
const validatePassword = (pwd: string) => {
  if (pwd.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(pwd))
    return "Password must contain at least one letter.";
  return null;
};

// --- HELPER: Telegram-Style Username Validator 🟢 ---
const validateUsernameFormat = (username: string) => {
  if (!username) return null;
  if (username.length < 5) return "Min 5 characters.";
  if (!/^[a-zA-Z]/.test(username)) return "Must start with a letter.";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Only a-z, 0-9, and _ allowed.";
  return null;
};

export default function SignupPage() {
  const router = useRouter();

  // State
  // Step 0: Role, Step 1: Login, Step 2: Personal, Step 3: Location, Step 4: Work/Edu
  // Step 10: Google Finalization (Special State)
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showPassword, setShowPassword] = useState(false);

  // Google State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);

  // Username Check
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    birthDate: "",
    phone: "+998 ",
    country: "Uzbekistan",
    region: "",
    district: "",
    institutionName: "",
    gradeLevel: "",
    schoolSubject: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let { name, value } = e.target;
    if (name === "phone") {
      if (value.length < 5) value = "+998 ";
      else value = formatPhoneNumber(value);
    }
    setFormData({ ...formData, [name]: value });
  };

  // 1. USERNAME CHECK (Works for both Manual and Google Finalize)
  useEffect(() => {
    const check = async () => {
      setUsernameAvailable(null);
      setUsernameError(null);

      if (!formData.username) return;

      const formatError = validateUsernameFormat(formData.username);
      if (formatError) {
        setUsernameError(formatError);
        return;
      }

      setIsCheckingUser(true);
      try {
        const isUnique = await checkUsernameUnique(formData.username);
        setUsernameAvailable(isUnique);
      } catch (error) {
        setUsernameAvailable(true); 
      } finally {
        setIsCheckingUser(false);
      }
    };

    const timeoutId = setTimeout(check, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  // 2. GOOGLE SIGN IN LOGIC
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in DB
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        // --- SCENARIO A: ACCOUNT EXISTS ---
        const existingData = userDoc.data();
        toast.success(`Welcome back, ${existingData.displayName || "User"}!`);
        // Redirect based on stored role, ignoring current selection
        if (existingData.role === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        // --- SCENARIO B: NEW ACCOUNT (LIMBO) ---
        setGoogleUser(user);
        setStep(10); // Go to "Google Finalize" step
        setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setLoading(false);
      toast.error("Google Sign-In failed.");
    }
  };

  // 3. GOOGLE FINALIZE (Submit)
  const handleGoogleFinalize = async () => {
    if (!googleUser) return;
    
    // Validate
    if (!formData.username) return toast.error("Username is required");
    if (usernameError) return toast.error(usernameError);
    if (usernameAvailable === false) return toast.error("Username is taken");
    if (role === 'teacher' && !formData.schoolSubject) return toast.error("Please select a subject");

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", googleUser.uid);

      // Construct Profile (Lazy Data Collection: Nulls for missing fields)
      const newProfile: any = {
        uid: googleUser.uid,
        email: googleUser.email,
        username: formData.username.toLowerCase(),
        displayName: googleUser.displayName || "User",
        photoURL: googleUser.photoURL || null,
        phone: null, // Lazy
        birthDate: null, // Lazy
        role: role,
        institution: null, // Lazy
        location: {
          country: "Uzbekistan",
          region: null,
          district: null,
        },
        createdAt: new Date().toISOString(),
      };

      if (role === "student") {
        newProfile.grade = null; // Lazy
        newProfile.totalXP = 0;
        newProfile.currentStreak = 0;
        newProfile.level = 1;
        newProfile.dailyHistory = {};
        newProfile.progress = {
          completedTopicIndex: 0,
          completedChapterIndex: 0,
          completedSubtopicIndex: 0,
        };
      } else {
        newProfile.grade = "Teacher";
        newProfile.subject = formData.schoolSubject; // Saved!
        newProfile.verifiedTeacher = false;
        newProfile.createdTests = [];
      }

      // Commit
      batch.set(userRef, newProfile);
      batch.set(doc(db, "usernames", formData.username.toLowerCase()), { uid: googleUser.uid });

      await batch.commit();
      toast.success("Account created successfully!");
      
      if (role === "teacher") router.push("/teacher/dashboard");
      else router.push("/dashboard");

    } catch (error) {
      console.error(error);
      toast.error("Failed to complete registration");
    } finally {
      setLoading(false);
    }
  };

  // 4. MANUAL VALIDATION (Existing)
  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.username || !formData.password)
        return toast.error("Please fill in all fields.");
      if (usernameError) return toast.error(usernameError);
      if (usernameAvailable === false) return toast.error("Username is taken.");
      if (usernameAvailable === null && formData.username.length > 0)
        return toast.error("Checking username...");
      const pwdError = validatePassword(formData.password);
      if (pwdError) return toast.error(pwdError);
      if (formData.password !== formData.confirmPassword)
        return toast.error("Passwords do not match.");
    }
    if (step === 2) {
      if (!formData.fullName || !formData.birthDate || !formData.phone)
        return toast.error("Please fill in personal info.");
      if (formData.phone.length < 17)
        return toast.error("Invalid phone number.");
    }
    if (step === 3) {
      if (!formData.region || !formData.district)
        return toast.error("Please select your location.");
    }
    setStep((prev) => prev + 1);
  };

  // 5. MANUAL SUBMIT (Existing)
  const handleManualSignup = async () => {
    setLoading(true);
    let user = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      user = userCredential.user;
      await updateProfile(user, { displayName: formData.fullName });

      const batch = writeBatch(db);
      const userRef = doc(db, "users", user.uid);

      const newProfile: any = {
        uid: user.uid,
        email: formData.email,
        username: formData.username.toLowerCase(),
        displayName: formData.fullName,
        phone: formData.phone,
        birthDate: formData.birthDate,
        role: role,
        institution: formData.institutionName,
        location: {
          country: formData.country,
          region: formData.region,
          district: formData.district,
        },
        createdAt: new Date().toISOString(),
      };

      if (role === "student") {
        newProfile.grade = formData.gradeLevel;
        newProfile.totalXP = 0;
        newProfile.currentStreak = 0;
        newProfile.level = 1;
        newProfile.dailyHistory = {};
        newProfile.progress = { completedTopicIndex: 0, completedChapterIndex: 0, completedSubtopicIndex: 0 };
      } else {
        newProfile.grade = "Teacher";
        newProfile.subject = formData.schoolSubject;
        newProfile.verifiedTeacher = false;
        newProfile.createdTests = [];
      }

      batch.set(userRef, newProfile);
      batch.set(doc(db, "usernames", formData.username.toLowerCase()), { uid: user.uid });

      await batch.commit();
      toast.success(`Welcome, ${role === "teacher" ? "Professor" : "Student"}!`);
      if (role === "teacher") router.push("/teacher/dashboard");
      else router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      if (user && auth.currentUser) await deleteUser(auth.currentUser);
      if (error.code === "auth/email-already-in-use") toast.error("Email already in use.");
      else toast.error("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2rem] shadow-2xl shadow-purple-900/20"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {step === 0 ? "Choose your path" : step === 10 ? "Almost there!" : "Create Account"}
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            {step === 0 ? "Are you learning or teaching?" : step === 10 ? "Just a few more details" : `Step ${step} of 4`}
          </p>

          {step > 0 && step < 10 && (
            <div className="w-full bg-slate-800 h-2 rounded-full mt-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${step * 25}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* STEP 0: ROLE SELECTION */}
        {step === 0 && (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => { setRole("student"); setStep(1); }}
              className="group p-6 rounded-2xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800 hover:border-cyan-500/50 transition-all text-left flex items-center gap-5"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <GraduationCap size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400">I am a Student</h3>
                <p className="text-sm text-slate-400">I want to learn math, earn XP, and track my progress.</p>
              </div>
            </button>

            <button
              onClick={() => { setRole("teacher"); setStep(1); }}
              className="group p-6 rounded-2xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800 hover:border-purple-500/50 transition-all text-left flex items-center gap-5"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <School size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400">I am a Teacher</h3>
                <p className="text-sm text-slate-400">I want to create tests and manage my students.</p>
              </div>
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">Already have an account? <Link href="/auth/login" className="text-cyan-400 font-bold hover:underline">Log in</Link></p>
            </div>
          </div>
        )}

        {/* STEP 10: GOOGLE FINALIZE (Interstitial) */}
        {step === 10 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right">
             <div className="flex justify-center mb-4">
               {googleUser?.photoURL ? (
                 <img src={googleUser.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-cyan-500/30" />
               ) : (
                 <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-slate-400"><User size={32}/></div>
               )}
             </div>
             
             <div className="relative group">
               <User className="absolute left-4 top-3.5 text-slate-500" size={20} />
               <input
                 name="username"
                 type="text"
                 placeholder="Choose a Username"
                 required
                 value={formData.username}
                 onChange={handleChange}
                 className={`w-full pl-12 pr-10 py-3.5 rounded-xl border-2 outline-none font-medium transition text-white bg-slate-800/50 placeholder:text-slate-600
                   ${usernameError ? "border-red-500/50 focus:border-red-500" : usernameAvailable === true ? "border-green-500/50 focus:border-green-500" : usernameAvailable === false ? "border-amber-500/50 focus:border-amber-500" : "border-slate-700/50 focus:border-cyan-500"}`}
               />
               <div className="absolute right-4 top-3.5">
                 {isCheckingUser ? <Loader2 className="animate-spin text-slate-400" size={20} /> : usernameError ? <XCircle className="text-red-500" size={20} /> : usernameAvailable === true ? <CheckCircle className="text-green-500" size={20} /> : usernameAvailable === false ? <XCircle className="text-amber-500" size={20} /> : null}
               </div>
               {usernameError && <p className="text-[10px] text-red-400 font-bold mt-1 ml-1">{usernameError}</p>}
               {usernameAvailable === false && <p className="text-[10px] text-amber-400 font-bold mt-1 ml-1">Username taken.</p>}
             </div>

             {/* TEACHER SUBJECT SELECT */}
             {role === 'teacher' && (
               <select
                 name="schoolSubject"
                 required
                 value={formData.schoolSubject}
                 onChange={handleChange}
                 className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800 text-white focus:border-cyan-500 outline-none font-medium transition"
               >
                 <option value="">Select Subject</option>
                 <option value="matematika">Matematika</option>
                 <option value="fizika">Fizika</option>
                 <option value="kimyo">Kimyo</option>
                 <option value="biologiya">Biologiya</option>
                 <option value="informatika">Informatika</option>
                 <option value="ona_tili">Ona tili va Adabiyot</option>
                 <option value="tarix">Tarix</option>
                 <option value="ingliz_tili">Ingliz tili</option>
                 <option value="rus_tili">Rus tili</option>
                 <option value="geografiya">Geografiya</option>
                 <option value="other">Boshqa</option>
               </select>
             )}

             <button
               onClick={handleGoogleFinalize}
               disabled={loading || !usernameAvailable}
               className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {loading ? <Loader2 className="animate-spin" /> : "Complete & Enter"}
             </button>
          </div>
        )}

        {/* MANUAL FORM STEPS */}
        {step > 0 && step < 10 && (
          <form onSubmit={(e) => e.preventDefault()}>
            {/* STEP 1: LOGIN DETAILS */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right">
                
                {/* 1. GOOGLE BUTTON (NEW) */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white text-slate-800 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-md mb-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin text-slate-400" size={20}/>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* 2. DIVIDER */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-700"></div>
                  <span className="text-xs text-slate-500 font-bold uppercase">Or manually</span>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                {/* 3. EXISTING INPUTS */}
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input name="email" type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none transition font-medium" />
                </div>

                <div className="relative group">
                  <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input name="username" type="text" placeholder="Username" required value={formData.username} onChange={handleChange} className={`w-full pl-12 pr-10 py-3.5 rounded-xl border-2 outline-none font-medium transition text-white bg-slate-800/50 placeholder:text-slate-600 ${usernameError ? "border-red-500/50 focus:border-red-500" : usernameAvailable === true ? "border-green-500/50 focus:border-green-500" : usernameAvailable === false ? "border-amber-500/50 focus:border-amber-500" : "border-slate-700/50 focus:border-cyan-500"}`} />
                  <div className="absolute right-4 top-3.5">{isCheckingUser ? <Loader2 className="animate-spin text-slate-400" size={20} /> : usernameError ? <XCircle className="text-red-500" size={20} /> : usernameAvailable === true ? <CheckCircle className="text-green-500" size={20} /> : usernameAvailable === false ? <XCircle className="text-amber-500" size={20} /> : null}</div>
                  {usernameError && <p className="text-[10px] text-red-400 font-bold mt-1 ml-1">{usernameError}</p>}
                  {usernameAvailable === false && <p className="text-[10px] text-amber-400 font-bold mt-1 ml-1">Username is already taken.</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                    <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-8 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none font-medium transition text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-3.5 text-slate-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  <div className="relative group">
                    <input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none font-medium transition text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right">
                <input name="fullName" type="text" placeholder="Full Name" required value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none font-medium transition" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Date of Birth</label>
                    <input name="birthDate" type="date" required max={new Date().toISOString().split("T")[0]} value={formData.birthDate} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white focus:border-cyan-500 focus:bg-slate-800 outline-none font-medium transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Phone</label>
                    <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="+998" className="w-full px-4 py-3 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white focus:border-cyan-500 focus:bg-slate-800 outline-none font-medium transition" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right">
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-slate-500" size={20} />
                  <input name="country" type="text" value="Uzbekistan" disabled className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800 text-slate-400 font-bold cursor-not-allowed" />
                </div>
                <select name="region" value={formData.region} required onChange={(e) => setFormData({ ...formData, region: e.target.value, district: "" })} className={`w-full px-4 py-3.5 rounded-xl border-2 ${formData.region ? "border-slate-700/50" : "border-red-500"} bg-slate-800 text-white focus:border-cyan-500 outline-none font-medium`}>
                  <option value="">Select Region</option>
                  {Object.keys(UZB_LOCATIONS).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select name="district" value={formData.district} required onChange={handleChange} disabled={!formData.region} className={`w-full px-4 py-3.5 rounded-xl border-2 ${formData.district ? "border-slate-700/50" : "border-red-500"} bg-slate-800 text-white focus:border-cyan-500 outline-none disabled:opacity-50 font-medium`}>
                  <option value="">Select District</option>
                  {formData.region && UZB_LOCATIONS[formData.region]?.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* STEP 4: WORK/EDU */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right">
                <div className="relative group">
                  <Building2 className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input name="institutionName" type="text" placeholder={role === "student" ? "School / University Name" : "School / Organization Name"} required value={formData.institutionName} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none font-medium transition" />
                </div>
                {role === "student" ? (
                  <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800 text-white focus:border-cyan-500 outline-none font-medium">
                    <option value="">Select Grade / Year</option>
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
                ) : (
                  <select name="schoolSubject" required value={formData.schoolSubject} onChange={handleChange} className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800 text-white focus:border-cyan-500 outline-none font-medium transition">
                    <option value="">Select Subject</option>
                    <option value="matematika">Matematika</option>
                    <option value="fizika">Fizika</option>
                    <option value="kimyo">Kimyo</option>
                    <option value="biologiya">Biologiya</option>
                    <option value="informatika">Informatika</option>
                    <option value="ona_tili">Ona tili va Adabiyot</option>
                    <option value="tarix">Tarix</option>
                    <option value="ingliz_tili">Ingliz tili</option>
                    <option value="rus_tili">Rus tili</option>
                    <option value="geografiya">Geografiya</option>
                    <option value="other">Boshqa</option>
                  </select>
                )}
                <div className="flex items-start gap-3 mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded cursor-pointer accent-cyan-500" />
                  <p className="text-xs font-medium">I agree to the <Link href="#" className="underline hover:text-cyan-400">Terms of Service</Link> and <Link href="#" className="underline hover:text-cyan-400">Privacy Policy</Link>.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep((s) => s - 1)} className="px-6 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
              {step < 4 ? (
                <button onClick={handleNext} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">Next Step <ArrowRight size={18} /></button>
              ) : (
                <button onClick={handleManualSignup} disabled={loading} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" /> : "Complete Registration"}</button>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}