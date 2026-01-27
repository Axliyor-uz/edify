'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/services/userService'; 
import { Loader2, Mail, Lock, LogIn, ChevronRight, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🟢 NEW: State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch Profile
      const profile = await getUserProfile(user.uid);

      // FIX 1: Dismiss previous toasts to avoid clutter & force a duration
      toast.dismiss(); 
      toast.success(`Welcome back, ${profile?.displayName || 'User'}!`, {
        duration: 4000, // Force it to close after 4 seconds
      });

      // 3. Redirect
      if (profile?.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/dashboard');
      }

      // NOTE: We do NOT set loading(false) here. 
      // Let the button stay "loading" until the page changes.

    } catch (error: any) {
      console.error(error);
      
      // Error Handling
      if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email.');
      } else {
        toast.error('Login failed. Please try again.');
      }
      
      // FIX 2: Only stop loading if the login FAILED
      setLoading(false);
    } 
    // Removed "finally" block so we don't reset loading on success
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2rem] shadow-2xl shadow-purple-900/20"
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <LogIn size={24} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 mt-2 font-medium">Enter your credentials to access your account.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
              
              <input 
                type={showPassword ? 'text' : 'password'} // 🟢 Dynamic Type
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-800 outline-none transition-all font-medium"
              />

              {/* 🟢 Show/Hide Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ChevronRight size={18}/></>}
            </span>
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>

        </form>

        <div className="mt-8 text-center text-sm text-slate-400 font-medium">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline transition-colors">
            Create one for free
          </Link>
        </div>
      </motion.div>
    </div>
  );
}