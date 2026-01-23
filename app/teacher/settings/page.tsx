'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext';
import { 
  User, MapPin, Briefcase, Phone, Calendar, Save, 
  Lock, Loader2, Trash2, CheckCircle, XCircle, Layout, BookOpen,
  Eye, EyeOff, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
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

  // Username Availability State
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Password Form
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  // 👁️ Visibility Toggles
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 🗑️ Delete Class Modal State
  const [classToDelete, setClassToDelete] = useState<{ id: string, title: string } | null>(null);

  // --- 1. FETCH DATA (Profile & Classes) ---
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // A. Fetch Profile
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

        // B. Fetch Teachers Classes
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

  // --- 2. USERNAME CHECKER ---
  useEffect(() => {
    const checkUser = async () => {
      if (!formData.username || formData.username === formData.originalUsername) {
        setUsernameAvailable(null);
        return;
      }
      
      if (formData.username.length < 3) return;

      setIsCheckingUser(true);
      try {
        const ref = doc(db, 'usernames', formData.username.toLowerCase());
        const snap = await getDoc(ref);
        setUsernameAvailable(!snap.exists());
      } catch (e) {
        console.error(e);
      } finally {
        setIsCheckingUser(false);
      }
    };

    const timer = setTimeout(checkUser, 500); 
    return () => clearTimeout(timer);
  }, [formData.username, formData.originalUsername]);

  // --- 3. SAVE PROFILE ---
  const handleSaveProfile = async () => {
    if (!user) return;

    if (!formData.displayName.trim()) return toast.error("Please enter your Full Name.");
    if (!formData.username.trim()) return toast.error("Username cannot be empty.");
    if (formData.username.length < 3) return toast.error("Username must be at least 3 characters long.");
    if (!formData.phone.trim() || formData.phone.length < 9) return toast.error("Please enter a valid Phone Number.");
    if (!formData.institution.trim()) return toast.error("Institution/School name is required.");
    if (!formData.location.region.trim()) return toast.error("Please enter your Region.");

    if (formData.username !== formData.originalUsername) {
       if (usernameAvailable === false) return toast.error("This username is already taken.");
       if (usernameAvailable === null) return toast.error("Checking username availability...");
    }

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

      if (formData.username !== formData.originalUsername) {
        if (formData.originalUsername) {
            const oldUserRef = doc(db, 'usernames', formData.originalUsername);
            batch.delete(oldUserRef);
        }
        const newUserRef = doc(db, 'usernames', formData.username.toLowerCase());
        batch.set(newUserRef, { uid: user.uid });
      }

      await batch.commit();
      await updateProfile(user, { displayName: formData.displayName });

      setFormData(prev => ({ ...prev, originalUsername: prev.username }));
      toast.success("Profile saved successfully!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  // --- 4. CHANGE PASSWORD (UPDATED) ---
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    
    // Validation
    if (!passwords.current) return toast.error("Please enter your current password");
    if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match");
    if (passwords.new.length < 6) return toast.error("Password must be at least 6 characters");

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);
      
      toast.success("Password changed successfully!");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.code === 'auth/invalid-credential' ? "Current password is incorrect" : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // --- 5. CONFIRM DELETE CLASS (NEW) ---
  const confirmDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      await deleteDoc(doc(db, 'classes', classToDelete.id));
      setClassList(prev => prev.filter(c => c.id !== classToDelete.id));
      toast.success("Class deleted successfully");
      setClassToDelete(null); // Close modal
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

            {/* Username */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
              <div className="relative">
                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={`w-full p-3 border rounded-xl font-mono text-sm outline-none focus:ring-2 ${usernameAvailable === true ? 'border-green-500 bg-green-50 focus:ring-green-200' : usernameAvailable === false ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-slate-200 focus:ring-indigo-100'}`}/>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUser ? <Loader2 className="animate-spin text-slate-400" size={16}/> : usernameAvailable === true ? <CheckCircle className="text-green-500" size={16}/> : usernameAvailable === false ? <XCircle className="text-red-500" size={16}/> : null}
                </div>
              </div>
              {usernameAvailable === false && <p className="text-[10px] text-red-500 mt-1 font-bold">Username is taken.</p>}
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

            {/* Location */}
            <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-2"><MapPin size={14}/> Location</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.location.region} onChange={(e) => setFormData({...formData, location: { ...formData.location, region: e.target.value }})} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="Region"/>
                <input type="text" value={formData.location.district} onChange={(e) => setFormData({...formData, location: { ...formData.location, district: e.target.value }})} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="District"/>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
             <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70">
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
                                onClick={() => setClassToDelete({ id: cls.id, title: cls.title })} // 🟢 OPEN MODAL
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

      {/* --- CARD 3: SECURITY (UPDATED) --- */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock size={20} className="text-orange-500"/> Security
          </h2>
          <p className="text-sm text-slate-500 mt-1">Update your login credentials.</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             {/* Current Password */}
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

             {/* New Password */}
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

             {/* Confirm Password */}
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

      {/* 🔴 CUSTOM DELETE MODAL */}
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
               This action cannot be undone and <strong>all student data</strong> for this class will be lost.
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