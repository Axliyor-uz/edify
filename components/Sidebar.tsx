'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile, UserProfile } from '@/services/userService';
import { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, Trophy, User, LogOut, Flame, Star } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Syllabus', href: '/syllabus', icon: BookOpen },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch Full Profile on load
  useEffect(() => {
    async function loadData() {
      if (user) {
        const data = await getUserProfile(user.uid, user.email || '', user.displayName || 'Student');
        setProfile(data);
      }
    }
    loadData();
  }, [user]);

  // Calculate Level (Simple logic: 1 level per 100 XP)
  const level = profile ? Math.floor(profile.totalXP / 100) + 1 : 1;

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col fixed left-0 top-0 z-20 shadow-sm">
      {/* HEADER: App Name & Stats */}
      <div className="p-6 border-b bg-gray-50/50">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight mb-4">MathMaster</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* XP Badge */}
          <div className="bg-white border px-3 py-2 rounded-lg flex flex-col items-center justify-center shadow-sm">
            <span className="text-xs text-gray-400 font-bold uppercase">XP</span>
            <div className="flex items-center gap-1 text-yellow-600 font-bold">
              <Trophy size={14} />
              <span>{profile?.totalXP || 0}</span>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="bg-white border px-3 py-2 rounded-lg flex flex-col items-center justify-center shadow-sm">
             <span className="text-xs text-gray-400 font-bold uppercase">Streak</span>
             <div className="flex items-center gap-1 text-orange-500 font-bold">
              <Flame size={14} fill="currentColor" />
              <span>{profile?.currentStreak || 0}</span>
            </div>
          </div>
        </div>

        {/* Level Badge (Full Width) */}
        <div className="mt-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold w-full">
          <Star size={14} fill="currentColor" />
          Level {level} Student
        </div>
      </div>
      
      {/* MENU */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 translate-x-1' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t bg-gray-50/50">
        <button 
          onClick={() => signOut(auth)}
          className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center gap-2 font-medium transition"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}