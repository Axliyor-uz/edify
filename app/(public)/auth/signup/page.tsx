'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore'; // 👈 Import writeBatch for atomic saves
import { auth, db } from '@/lib/firebase';
import { checkUsernameUnique, UserProfile } from '@/services/userService';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- DATA: Uzbekistan Regions & Districts ---
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

// --- HELPER: Manual Phone Formatter (Fixes crash) ---
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, ''); // Strip non-digits
  
  // If user clears input, reset to prefix
  if (numbers.length === 0) return '+998 ';

  let formatted = '+998 ';
  // If input starts with 998, strip it to avoid duplication
  const inputNumbers = numbers.startsWith('998') ? numbers.slice(3) : numbers;

  if (inputNumbers.length > 0) formatted += `(${inputNumbers.slice(0, 2)}`;
  if (inputNumbers.length >= 2) formatted += `) ${inputNumbers.slice(2, 5)}`;
  if (inputNumbers.length >= 5) formatted += `-${inputNumbers.slice(5, 7)}`;
  if (inputNumbers.length >= 7) formatted += `-${inputNumbers.slice(7, 9)}`;

  return formatted;
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Username Check State
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    birthDate: '',
    phone: '+998 ',
    country: 'Uzbekistan', 
    region: '',
    district: '',
    institutionName: '',
    gradeLevel: '',
  });

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Apply Phone Mask Logic
    if (name === 'phone') {
        // Prevent deleting the prefix
        if (value.length < 5) value = '+998 ';
        else value = formatPhoneNumber(value);
    }

    setFormData({ ...formData, [name]: value });
  };

  // --- 1. USERNAME DEBOUNCE LOGIC ---
  useEffect(() => {
    const check = async () => {
      if (formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setIsCheckingUser(true);
      try {
        const isUnique = await checkUsernameUnique(formData.username);
        setUsernameAvailable(isUnique);
      } catch (error: any) {
        console.error("Check failed", error);
        // Fallback if permission denied (though rules should be fixed)
        if(error.code === 'permission-denied') setUsernameAvailable(true);
      } finally {
        setIsCheckingUser(false);
      }
    };

    const timeoutId = setTimeout(check, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);


  // --- 2. STEP VALIDATION ---
  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.username || !formData.password) return toast.error('Please fill all fields');
      if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
      if (formData.password.length < 6) return toast.error('Password must be 6+ chars');
      if (usernameAvailable === false) return toast.error('Username is taken');
    }
    if (step === 2) {
      if (!formData.fullName || !formData.birthDate || !formData.phone) return toast.error('Please fill personal details');
      if (formData.phone.length < 19) return toast.error('Please enter a complete phone number');
    }
    if (step === 3) {
      if (!formData.region || !formData.district) return toast.error('Please select location');
    }
    setStep((prev) => prev + 1);
  };

  // --- 3. SUBMISSION (Using "Phonebook" Batch Write) ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // A. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // B. Update Auth Profile
      await updateProfile(user, { displayName: formData.fullName });

      // C. PREPARE BATCH WRITE (Atomic Operation)
      const batch = writeBatch(db);

      // 1. User Profile Reference (Private Data)
      const userRef = doc(db, 'users', user.uid);
      const newProfile: UserProfile = {
        uid: user.uid,
        email: formData.email,
        username: formData.username.toLowerCase(), // Store lowercase
        displayName: formData.fullName,
        phone: formData.phone,
        birthDate: formData.birthDate,
        location: {
          country: formData.country,
          region: formData.region,
          district: formData.district,
        },
        education: {
          institution: formData.institutionName,
          grade: formData.gradeLevel,
        },
        // Gamification Defaults
        totalXP: 0,
        currentStreak: 0,
        level: 1,
        lastStudyDate: '',
        dailyHistory: {},
        progress: {
          completedTopicIndex: 0,
          completedChapterIndex: 0,
          completedSubtopicIndex: 0
        },
        createdAt: new Date().toISOString(),
        role: 'student'
      };
      batch.set(userRef, newProfile);

      // 2. Username Reservation Reference (Public Lookup)
      const usernameRef = doc(db, 'usernames', formData.username.toLowerCase());
      batch.set(usernameRef, { uid: user.uid });

      // D. Commit Batch
      await batch.commit();

      toast.success('Account created! Redirecting...');
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already registered.');
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-1 text-sm">Step {step} of 4</p>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-500 ease-out" style={{ width: `${step * 25}%` }}></div>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          
          {/* STEP 1: ACCOUNT */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right">
              <h3 className="font-bold text-slate-800">Login Details</h3>
              
              <input name="email" type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition" />
              
              <div className="relative">
                <input 
                  name="username" type="text" placeholder="Unique Username" required value={formData.username} onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition pr-10
                    ${usernameAvailable === true ? 'border-green-500 focus:border-green-500' : 
                      usernameAvailable === false ? 'border-red-300 focus:border-red-500' : 
                      'border-slate-100 focus:border-blue-500'}`}
                />
                <div className="absolute right-3 top-3.5">
                  {isCheckingUser ? <Loader2 className="animate-spin text-slate-400" size={20} /> :
                   usernameAvailable === true ? <CheckCircle className="text-green-500" size={20} /> :
                   usernameAvailable === false ? <XCircle className="text-red-500" size={20} /> : null}
                </div>
              </div>
              {usernameAvailable === false && <p className="text-xs text-red-500 font-bold ml-1">Username is taken.</p>}

              <div className="grid grid-cols-2 gap-4">
                <input name="password" type="password" placeholder="Password" required value={formData.password} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition" />
                <input name="confirmPassword" type="password" placeholder="Confirm" required value={formData.confirmPassword} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition" />
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right">
              <h3 className="font-bold text-slate-800">Personal Info</h3>
              <input name="fullName" type="text" placeholder="Full Name" required value={formData.fullName} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">Date of Birth</label>
                  <input name="birthDate" type="date" required value={formData.birthDate} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition text-slate-600" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">Phone Number</label>
                  <input 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+998 (__) ___-__-__" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION (DROPDOWNS) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right">
              <h3 className="font-bold text-slate-800">Location</h3>
              <input name="country" type="text" value="Uzbekistan" disabled
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-500 font-bold" />
              
              <div className="grid grid-cols-2 gap-4">
                <select name="region" value={formData.region} onChange={(e) => {
                    setFormData({...formData, region: e.target.value, district: ''});
                }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Select Region</option>
                  {Object.keys(UZB_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.region}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white disabled:bg-slate-50"
                >
                  <option value="">Select District</option>
                  {formData.region && UZB_LOCATIONS[formData.region].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: EDUCATION */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right">
              <h3 className="font-bold text-slate-800">Education</h3>
              <input name="institutionName" type="text" placeholder="School / University Name" required value={formData.institutionName} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition" />
              
              <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white text-slate-600"
              >
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

              <div className="flex items-start gap-3 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input type="checkbox" required className="mt-1 w-4 h-4 text-blue-600 rounded" />
                <p className="text-xs text-slate-500">I agree to the <Link href="#" className="text-blue-600 underline">Terms</Link> and <Link href="#" className="text-blue-600 underline">Privacy Policy</Link>.</p>
              </div>
            </div>
          )}

          {/* CONTROLS */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-6 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
            )}
            
            {step < 4 ? (
              <button onClick={handleNext} disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-black flex items-center justify-center gap-2">
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button onClick={handleSignup} disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
              </button>
            )}
          </div>

        </form>
        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account? <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}