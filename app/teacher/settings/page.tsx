'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext';
import { 
  User, MapPin, Briefcase, Phone, Calendar, Save, 
  Lock, Loader2, Trash2, CheckCircle, XCircle, Layout, BookOpen,
  Eye, EyeOff, AlertTriangle, AtSign 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
    deleteUser 
  } from 'firebase/auth'; // Ensure these are imported
   // Ensure these are imported
// --- CONSTANTS ---
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

// Telegram-style Regex: Starts with letter, 5-32 chars, a-z, 0-9, _
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export default function SettingsPage() {

    // Inside SettingsPage component state
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deletePassword, setDeletePassword] = useState('');
const [isDeleting, setIsDeleting] = useState(false);
const router = useRouter(); // Ensure useRouter is imported from 'next/navigation'
  const { user } = useAuth();
  
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classList, setClassList] = useState<any[]>([]);

  // Profile Form
  const [formData, setFormData] = useState({
    displayName: '',
    username: '', 
    originalUsername: '',
    email: '',
    phone: '',
    birthDate: '',
    institution: '',
    bio: '', 
    location: {
      country: 'Uzbekistan',
      region: '',
      district: ''
    }
  });

  // Username Logic
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');

  // Password Form
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  // Delete Modal
  const [classToDelete, setClassToDelete] = useState<{ id: string, title: string } | null>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            displayName: data.displayName || '',
            username: data.username || '',
            originalUsername: data.username || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            birthDate: data.birthDate || '',
            institution: data.institution || '',
            bio: data.bio || '',
            location: {
              country: data.location?.country || 'Uzbekistan',
              region: data.location?.region || '',
              district: data.location?.district || ''
            }
          });
        }

        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const classSnap = await getDocs(q);
        setClassList(classSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e) {
        console.error(e);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) return;
    setIsDeleting(true);
    const toastId = toast.loading("Processing deletion...");

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email!, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // --- 2. DELETION LOGIC ---
      // We will batch as much as possible, but delete collections in chunks
      
      // A. Find & Delete Classes
      const classesQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const classesSnap = await getDocs(classesQ);
      // Delete each class (students will lose access immediately)
      const deleteClasses = classesSnap.docs.map(d => deleteDoc(d.ref));

      // B. Find & Delete Custom Tests
      const testsQ = query(collection(db, 'custom_tests'), where('teacherId', '==', user.uid));
      const testsSnap = await getDocs(testsQ);
      const deleteTests = testsSnap.docs.map(d => deleteDoc(d.ref));

      // C. Find & Delete Notifications (Optional but good)
      const notifQ = query(collection(db, 'notifications'), where('senderId', '==', user.uid)); 
      // Note: Assuming teacher sends notifs. If not, skip or adjust query.
      
      // Execute Collection Deletes
      await Promise.all([...deleteClasses, ...deleteTests]);

      // --- 3. BATCH DELETE (Profile & Username) ---
      const batch = writeBatch(db);
      
      // Delete User Profile
      batch.delete(doc(db, 'users', user.uid));
      
      // Delete Username
      if (formData.originalUsername) {
        batch.delete(doc(db, 'usernames', formData.originalUsername));
      }

      await batch.commit();

      // --- 4. DELETE AUTH ---
      await deleteUser(user);

      toast.success("Account deleted.", { id: toastId });
      router.push('/auth/login');

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        toast.error("Incorrect password.", { id: toastId });
      } else {
        toast.error("Deletion failed.", { id: toastId });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // --- 2. USERNAME CHECKER (UPDATED) ---
  useEffect(() => {
    const input = formData.username.trim().toLowerCase();
    const original = formData.originalUsername?.toLowerCase();

    // Reset if empty
    if (!input) {
      setUsernameStatus('idle');
      return;
    }

    // A. Validate Format (Telegram Style)
    if (input.length < 5) {
      setUsernameStatus('invalid');
      setUsernameError('Minimum 5 characters');
      return;
    }
    if (!USERNAME_REGEX.test(input)) {
      setUsernameStatus('invalid');
      setUsernameError('Must start with a letter, use a-z, 0-9, _');
      return;
    }

    // B. Check Self-Match
    if (input === original) {
      setUsernameStatus('valid');
      setUsernameError('');
      return;
    }

    // C. Check Database
    const checkDb = async () => {
      setUsernameStatus('checking');
      try {
        const ref = doc(db, 'usernames', input);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUsernameStatus('taken');
          setUsernameError('Username is taken');
        } else {
          setUsernameStatus('valid');
          setUsernameError('');
        }
      } catch (e) {
        setUsernameStatus('idle');
      }
    };

    const timer = setTimeout(checkDb, 500); 
    return () => clearTimeout(timer);
  }, [formData.username, formData.originalUsername]);

  // --- 3. SAVE PROFILE ---
  const handleSaveProfile = async () => {
    if (!user) return;

    // Validation
    if (!formData.displayName.trim()) return toast.error("Full Name is required.");
    if (usernameStatus !== 'valid') return toast.error("Please enter a valid username.");
    if (!formData.institution.trim()) return toast.error("Institution is required.");
    if (!formData.location.region) return toast.error("Please select a Region.");

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);

      batch.update(userRef, {
        displayName: formData.displayName,
        username: formData.username.toLowerCase(),
        phone: formData.phone,
        birthDate: formData.birthDate,
        institution: formData.institution,
        bio: formData.bio,
        location: formData.location
      });

      // Handle Username Change
      if (formData.username.toLowerCase() !== formData.originalUsername.toLowerCase()) {
        if (formData.originalUsername) {
            batch.delete(doc(db, 'usernames', formData.originalUsername.toLowerCase()));
        }
        batch.set(doc(db, 'usernames', formData.username.toLowerCase()), { uid: user.uid });
      }

      await batch.commit();
      await updateProfile(user, { displayName: formData.displayName });

      setFormData(prev => ({ ...prev, originalUsername: prev.username }));
      toast.success("Profile saved successfully!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // --- 4. CHANGE PASSWORD ---
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (!passwords.current) return toast.error("Enter current password");
    if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match");
    if (passwords.new.length < 6) return toast.error("Password too short");

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);
      
      toast.success("Password changed!");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.code === 'auth/invalid-credential' ? "Incorrect current password" : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // --- 5. DELETE CLASS ---
  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      await deleteDoc(doc(db, 'classes', classToDelete.id));
      setClassList(prev => prev.filter(c => c.id !== classToDelete.id));
      toast.success("Class deleted");
      setClassToDelete(null);
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-indigo-500"><Loader2 className="animate-spin" size={32}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <h1 className="text-3xl font-black text-slate-900">Account Settings</h1>

      {/* --- CARD 1: PERSONAL INFORMATION --- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User size={20} className="text-indigo-600"/> Personal Information
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage your identity and contact details.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Display Name */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"/>
            </div>

            {/* Username (UPDATED UI) */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
              <div className="relative group">
                <AtSign className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().trim()})} 
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl font-bold text-sm outline-none transition-all ${
                    usernameStatus === 'valid' ? 'border-green-500 bg-green-50 text-green-700' : 
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 bg-red-50 text-red-700' : 
                    'border-slate-200 focus:border-indigo-500'
                  }`}
                />
                <div className="absolute right-3 top-3.5">
                  {usernameStatus === 'checking' && <Loader2 className="animate-spin text-slate-400" size={16}/>}
                  {usernameStatus === 'valid' && <CheckCircle className="text-green-500" size={16}/>}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="text-red-500" size={16}/>}
                </div>
              </div>
              {/* Username Error Messages */}
              {usernameStatus === 'invalid' && <p className="text-[10px] text-red-500 mt-1 font-bold ml-1">{usernameError}</p>}
              {usernameStatus === 'taken' && <p className="text-[10px] text-red-500 mt-1 font-bold ml-1">Username is already taken.</p>}
              {usernameStatus === 'valid' && formData.username !== formData.originalUsername && <p className="text-[10px] text-green-600 mt-1 font-bold ml-1">Username is available!</p>}
            </div>

            {/* Bio */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio / About Me</label>
              <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} placeholder="Tell your students a bit about yourself..." className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none resize-none"/>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-500 font-mono text-sm border border-slate-200 cursor-not-allowed">{formData.email}</div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"/>
              </div>
            </div>

            {/* Institution */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Institution</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input type="text" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"/>
              </div>
            </div>

             {/* Birth Date */}
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"/>
              </div>
            </div>

            {/* Location (UPDATED: DYNAMIC SELECTS) */}
            <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-2"><MapPin size={14}/> Location</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Region Select */}
                <div className="relative">
                  <select 
                    value={formData.location.region} 
                    onChange={(e) => setFormData({...formData, location: { ...formData.location, region: e.target.value, district: '' }})} 
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none appearance-none bg-white font-medium"
                  >
                    <option value="">Select Region</option>
                    {Object.keys(UZB_LOCATIONS).map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>

                {/* District Select */}
                <div className="relative">
                  <select 
                    value={formData.location.district} 
                    onChange={(e) => setFormData({...formData, location: { ...formData.location, district: e.target.value }})} 
                    disabled={!formData.location.region}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none appearance-none bg-white font-medium disabled:opacity-50 disabled:bg-slate-50"
                  >
                    <option value="">Select District</option>
                    {formData.location.region && UZB_LOCATIONS[formData.location.region]?.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
             <button 
               onClick={handleSaveProfile} 
               disabled={saving || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'} 
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Changes
             </button>
          </div>
        </div>
      </div>

      {/* --- CARD 2: CLASS MANAGEMENT --- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layout size={20} className="text-blue-600"/> Manage Classes
          </h2>
          <p className="text-sm text-slate-500 mt-1">Review active classes or delete them individually.</p>
        </div>

        <div className="p-6">
            {classList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">You haven't created any classes yet.</div>
            ) : (
                <div className="space-y-3">
                    {classList.map((cls) => (
                        <div key={cls.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                    <BookOpen size={18}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">{cls.title}</h3>
                                    <p className="text-xs text-slate-500">{cls.studentIds?.length || 0} Students</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setClassToDelete({ id: cls.id, title: cls.title })} 
                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Class"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- CARD 3: SECURITY --- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock size={20} className="text-orange-500"/> Security
          </h2>
          <p className="text-sm text-slate-500 mt-1">Update your login credentials.</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
               <div className="relative">
                 <input 
                   type={showPass.current ? "text" : "password"} 
                   value={passwords.current}
                   onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                   className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                   placeholder="Enter current password to verify"
                 />
                 <button 
                   onClick={() => setShowPass({...showPass, current: !showPass.current})}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                 >
                   {showPass.current ? <EyeOff size={18}/> : <Eye size={18}/>}
                 </button>
               </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
               <div className="relative">
                 <input 
                   type={showPass.new ? "text" : "password"} 
                   value={passwords.new}
                   onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                   className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                   placeholder="Min 6 characters"
                 />
                 <button 
                   onClick={() => setShowPass({...showPass, new: !showPass.new})}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                 >
                   {showPass.new ? <EyeOff size={18}/> : <Eye size={18}/>}
                 </button>
               </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
               <div className="relative">
                 <input 
                   type={showPass.confirm ? "text" : "password"} 
                   value={passwords.confirm}
                   onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                   className={`w-full p-3 pr-10 border rounded-xl text-sm outline-none ${
                     passwords.confirm && passwords.new !== passwords.confirm 
                       ? 'border-red-300 bg-red-50 focus:border-red-500' 
                       : 'border-slate-200 focus:border-orange-500'
                   }`}
                   placeholder="Retype new password"
                 />
                 <button 
                   onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                 >
                   {showPass.confirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                 </button>
               </div>
             </div>

             <div className="md:col-span-2 pt-2">
               <button 
                 onClick={handleChangePassword}
                 disabled={saving || !passwords.current || !passwords.new || (passwords.new !== passwords.confirm)}
                 className="w-full p-3 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {saving ? 'Updating...' : 'Update Password'}
               </button>
             </div>
          </div>
        </div>
      </div>
      {/* --- DANGER ZONE (TEACHER) --- */}
      <div className="bg-red-50/50 border border-red-100 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="p-6 border-b border-red-100 bg-red-50">
          <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600"/> Danger Zone
          </h2>
          <p className="text-sm text-red-500 mt-1">Irreversible actions.</p>
        </div>

        <div className="p-8">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-700">Delete Teacher Account</h3>
                <p className="text-sm text-slate-500">
                  This will delete all your <strong>Classes</strong>, <strong>Tests</strong>, and profile data. 
                  <br/>Your students will no longer be able to access your content.
                </p>
              </div>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border-2 border-red-100 animate-in zoom-in-95">
              <h3 className="text-lg font-black text-slate-800 mb-2">Final Confirmation</h3>
              <p className="text-sm text-slate-500 mb-4">
                Please type your password to confirm deletion. This cannot be undone.
              </p>
              <input 
                type="password" 
                placeholder="Enter password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 mb-4"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>} 
                  Yes, Delete Everything
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔴 DELETE CLASS MODAL */}
      {classToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setClassToDelete(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
             <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
               <AlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-black text-slate-800 text-center mb-2">Delete Class?</h3>
             <p className="text-sm text-slate-500 text-center mb-6">
               Are you sure you want to delete <strong>"{classToDelete.title}"</strong>? <br/>
               This action cannot be undone.
             </p>
             <div className="flex gap-3">
               <button onClick={() => setClassToDelete(null)} className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
               <button onClick={confirmDeleteClass} className="flex-1 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all">Yes, Delete</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}