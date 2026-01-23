'use client';

import { Users, Hash, ArrowRight, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Props {
  cls: any;
}

export default function ClassCard({ cls }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-300 transition-all group relative">
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-xl group-hover:text-indigo-600 transition-colors">
            {cls.title}
          </h3>
          <p className="text-sm text-slate-400 font-medium">{cls.description || 'No description'}</p>
        </div>
        
        {/* Placeholder for Request Badge - Will implement real count later */}
        {/* <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <UserPlus size={12}/> 2 Requests
        </span> */}
      </div>

      <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-600">
           <Hash size={16} className="text-indigo-400"/>
           <span className="font-mono font-bold tracking-wider">{cls.joinCode}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
           <Users size={16} className="text-indigo-400"/>
           <span className="font-bold">{cls.studentIds?.length || 0} Students</span>
        </div>
      </div>

      <Link 
        href={`/teacher/classes/${cls.id}`}
        className="flex items-center justify-center w-full gap-2 py-2.5 rounded-lg font-bold text-sm bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"
      >
        Manage Class <ArrowRight size={16} />
      </Link>

    </div>
  );
}