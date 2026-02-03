'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { 
  BarChart3, TrendingUp, Users, AlertTriangle, 
  Filter, ChevronDown, FileText, Calendar, Loader2, 
  PieChart, Activity, Clock
} from 'lucide-react';
import { useTeacherLanguage } from '@/app/teacher/layout'; 
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';

// --- 1. TRANSLATION DICTIONARY ---
const ANALYTICS_TRANSLATIONS = {
  uz: {
    title: "Tahlillar Paneli",
    subtitle: "Sinf ko'rsatkichlari va o'quvchilar natijalari.",
    selectClass: "Sinfni Tanlang",
    kpi: {
      avg: "O'rtacha Ball",
      sub: "Topshirish",
      active: "Faol O'quvchilar",
      missing: "Ishlanmagan testlar"
    },
    charts: {
      dist: "Baholar Taqsimoti",
      trend: "O'zlashtirish Dinamikasi",
      status: "Natijalar Statusi",
      pass: "O'tdi",
      fail: "Yiqildi"
    },
    tables: {
      riskTitle: "Xavf Ostidagi O'quvchilar",
      riskSub: "Past ball yoki ko'p qarzdorlik.",
      hardestTitle: "Qiyin Topshiriqlar",
      hardestSub: "Eng past o'rtacha natijalar.",
      name: "Ism",
      avg: "O'rtacha",
      miss: "Jarayonda",
      action: "Xabar",
      assign: "Topshiriq",
      diff: "Qiyinlik"
    },
    loading: "Hisoblanmoqda...",
    noData: "Ma'lumotlar yetarli emas"
  },
  en: {
    title: "Analytics Pro",
    subtitle: "Deep insights into class performance and engagement.",
    selectClass: "Select Class",
    kpi: {
      avg: "Average Score",
      sub: "Submission Rate",
      active: "Active Students",
      missing: "Missing Work"
    },
    charts: {
      dist: "Grade Distribution",
      trend: "Performance Trend",
      status: "Result Status",
      pass: "Pass (>60%)",
      fail: "Fail (<60%)"
    },
    tables: {
      riskTitle: "At-Risk Students",
      riskSub: "Students needing immediate intervention.",
      hardestTitle: "Assignment Difficulty",
      hardestSub: "Tests with lowest average scores.",
      name: "Name",
      avg: "Average",
      miss: "Missing",
      action: "Message",
      assign: "Assignment",
      diff: "Difficulty"
    },
    loading: "Analyzing Data...",
    noData: "Not enough data to display analytics."
  },
  ru: {
    title: "Аналитика Pro",
    subtitle: "Глубокий анализ успеваемости и вовлеченности.",
    selectClass: "Выберите Класс",
    kpi: {
      avg: "Средний Балл",
      sub: "Сдача",
      active: "Активные",
      missing: "Долги"
    },
    charts: {
      dist: "Распределение Оценок",
      trend: "Динамика Успеваемости",
      status: "Статус Результатов",
      pass: "Сдал",
      fail: "Не сдал"
    },
    tables: {
      riskTitle: "В Зоне Риска",
      riskSub: "Ученики, требующие внимания.",
      hardestTitle: "Сложность Заданий",
      hardestSub: "Тесты с самым низким баллом.",
      name: "Имя",
      avg: "Среднее",
      miss: "Долги",
      action: "Написать",
      assign: "Задание",
      diff: "Сложность"
    },
    loading: "Анализ данных...",
    noData: "Недостаточно данных для аналитики."
  }
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { lang } = useTeacherLanguage();
  const t = ANALYTICS_TRANSLATIONS[lang];

  // --- STATE ---
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // --- ANALYTICS DATA ---
  const [metrics, setMetrics] = useState<any>({
    avgScore: 0,
    submissionRate: 0,
    activeStudents: 0,
    totalStudents: 0,
    missingCount: 0
  });
  
  const [chartData, setChartData] = useState<any>({
    distribution: [],
    trend: [],
    pie: []
  });

  const [atRiskList, setAtRiskList] = useState<any[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<any[]>([]);

  // 1. FETCH CLASSES
  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchClasses();
  }, [user]);

  // 2. CALCULATE ANALYTICS
  useEffect(() => {
    if (!selectedClassId) return;
    
    const runAnalysis = async () => {
      setAnalyzing(true);
      try {
        // Fetch raw data
        const [assignSnap, attemptsSnap, classSnap] = await Promise.all([
          getDocs(query(collection(db, 'classes', selectedClassId, 'assignments'))),
          getDocs(query(collection(db, 'attempts'), where('classId', '==', selectedClassId))),
          getDoc(doc(db, 'classes', selectedClassId))
        ]);

        const assignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const attempts = attemptsSnap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate() })); // Fix Date
        const studentIds = classSnap.data()?.studentIds || [];

        // --- CALCULATION ENGINE ---

        // A. Student Performance Map
        const studentsMap: any = {};
        studentIds.forEach((uid: string) => studentsMap[uid] = { totalPct: 0, attempts: 0, missing: 0 });

        // B. Assignment Performance
        let totalAssigned = 0;
        let totalCompleted = 0;
        
        const assignStats = assignments.map((a: any) => {
           const aAttempts = attempts.filter((att: any) => att.assignmentId === a.id);
           const avg = aAttempts.length > 0 
             ? aAttempts.reduce((acc: number, curr: any) => acc + (curr.score / curr.totalQuestions * 100), 0) / aAttempts.length 
             : 0;
           
           const targetCount = Array.isArray(a.assignedTo) ? a.assignedTo.length : studentIds.length;
           totalAssigned += targetCount;
           totalCompleted += aAttempts.length;

           return { id: a.id, title: a.testTitle, avg: Math.round(avg), date: a.createdAt?.toDate() };
        });

        // C. Populate Student Map
        attempts.forEach((att: any) => {
           if (studentsMap[att.userId]) {
             const pct = (att.score / att.totalQuestions) * 100;
             studentsMap[att.userId].totalPct += pct;
             studentsMap[att.userId].attempts += 1;
           }
        });

        // D. Calculate Missing
        studentIds.forEach((uid: string) => {
           const diff = assignments.length - (studentsMap[uid]?.attempts || 0);
           if (diff > 0) studentsMap[uid].missing = diff;
        });

        // E. Chart Data: Distribution
        const distBuckets = [0, 0, 0, 0, 0];
        let passCount = 0;
        let failCount = 0;

        Object.values(studentsMap).forEach((s: any) => {
           if (s.attempts > 0) {
             const avg = s.totalPct / s.attempts;
             const bucket = Math.min(Math.floor(avg / 20), 4);
             distBuckets[bucket]++;
             if (avg >= 60) passCount++; else failCount++;
           }
        });

        const distChart = [
          { name: '0-20%', count: distBuckets[0] },
          { name: '21-40%', count: distBuckets[1] },
          { name: '41-60%', count: distBuckets[2] },
          { name: '61-80%', count: distBuckets[3] },
          { name: '81-100%', count: distBuckets[4] }
        ];

        // F. Chart Data: Trend (Avg Score by Assignment Date)
        const sortedAssigns = assignStats.sort((a: any, b: any) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        const trendChart = sortedAssigns.map((a: any) => ({
           name: a.title.substring(0, 10) + '...', // Truncate name
           score: a.avg
        }));

        // G. At Risk List
        const riskIds = Object.entries(studentsMap)
          .filter(([_, s]: any) => (s.attempts > 0 && (s.totalPct/s.attempts) < 60) || s.missing > 2)
          .map(([uid]) => uid)
          .slice(0, 5); // Top 5

        // Fetch Names for Risk List
        const riskPromises = riskIds.map(uid => getDoc(doc(db, 'users', uid)));
        const riskSnaps = await Promise.all(riskPromises);
        const hydratedRisks = riskSnaps.map((snap, i) => {
           const sData = studentsMap[snap.id];
           return {
             id: snap.id,
             name: snap.exists() ? snap.data().displayName : 'Unknown',
             avg: sData.attempts > 0 ? Math.round(sData.totalPct / sData.attempts) : 0,
             missing: sData.missing
           };
        });

        // UPDATE STATES
        setMetrics({
          avgScore: assignStats.length > 0 ? Math.round(assignStats.reduce((a:any,b:any) => a + b.avg, 0) / assignStats.length) : 0,
          submissionRate: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
          activeStudents: Object.values(studentsMap).filter((s:any) => s.attempts > 0).length,
          totalStudents: studentIds.length,
          missingCount: totalAssigned - totalCompleted
        });

        setChartData({
          distribution: distChart,
          trend: trendChart,
          pie: [
            { name: t.charts.pass, value: passCount, color: '#10b981' }, // Emerald
            { name: t.charts.fail, value: failCount, color: '#ef4444' }  // Red
          ]
        });

        setAssignmentStats(assignStats.sort((a: any, b: any) => a.avg - b.avg).slice(0, 5));
        setAtRiskList(hydratedRisks);

      } catch (e) { console.error(e); } 
      finally { setAnalyzing(false); }
    };

    runAnalysis();
  }, [selectedClassId]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-800 pb-20">
      
      {/* HEADER & FILTER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.title}</h1>
          <p className="text-slate-500 font-medium">{t.subtitle}</p>
        </div>
        <div className="w-full md:w-64 relative">
           <select 
             value={selectedClassId}
             onChange={(e) => setSelectedClassId(e.target.value)}
             className="w-full pl-4 pr-10 py-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer"
           >
             {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
           </select>
           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
        </div>
      </div>

      {analyzing ? (
         <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-sm font-bold animate-pulse">{t.loading}</p>
         </div>
      ) : classes.length === 0 ? (
         <div className="text-center py-20 text-slate-400 font-bold">{t.noData}</div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* 1. KPI CARDS (Colorful & Modern) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <KPICard title={t.kpi.avg} value={`${metrics.avgScore}%`} icon={Activity} color="indigo" />
             <KPICard title={t.kpi.sub} value={`${metrics.submissionRate}%`} icon={FileText} color="blue" />
             <KPICard title={t.kpi.active} value={`${metrics.activeStudents}/${metrics.totalStudents}`} icon={Users} color="emerald" />
             <KPICard title={t.kpi.missing} value={metrics.missingCount} icon={AlertTriangle} color="orange" />
          </div>

          {/* 2. CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Main Chart: Trend */}
             <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <TrendingUp size={20} className="text-indigo-500"/> {t.charts.trend}
                </h3>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.trend}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                         <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                         <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Side Chart: Pass/Fail Pie */}
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t.charts.status}</h3>
                <div className="flex-1 min-h-[200px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                         <Pie 
                           data={chartData.pie} 
                           cx="50%" cy="50%" 
                           innerRadius={60} 
                           outerRadius={80} 
                           paddingAngle={5} 
                           dataKey="value"
                         >
                           {chartData.pie.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip />
                         <Legend verticalAlign="bottom" height={36}/>
                      </RePieChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* 3. LOWER SECTION: LISTS & DISTRIBUTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             
             {/* Grade Distribution Bar Chart */}
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <BarChart3 size={20} className="text-blue-500"/> {t.charts.dist}
                </h3>
                <div className="h-56">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.distribution}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={5}/>
                         <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                         <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* At Risk Table */}
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                   <AlertTriangle size={20} className="text-red-500"/> {t.tables.riskTitle}
                </h3>
                <p className="text-xs text-slate-400 mb-4">{t.tables.riskSub}</p>
                
                <div className="flex-1 overflow-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                            <th className="py-2 pl-2">{t.tables.name}</th>
                            <th className="py-2 text-center">{t.tables.avg}</th>
                            <th className="py-2 text-center">{t.tables.miss}</th>
                         </tr>
                      </thead>
                      <tbody className="text-sm">
                         {atRiskList.length === 0 ? (
                            <tr><td colSpan={3} className="text-center py-8 text-slate-400 italic">No students at risk 🎉</td></tr>
                         ) : (
                            atRiskList.map((s) => (
                               <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="py-3 pl-2 font-bold text-slate-700">{s.name}</td>
                                  <td className="py-3 text-center font-bold text-red-500">{s.avg}%</td>
                                  <td className="py-3 text-center font-bold text-orange-500">{s.missing}</td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          {/* 4. HARDEST ASSIGNMENTS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">{t.tables.hardestTitle}</h3>
                <p className="text-xs text-slate-400">{t.tables.hardestSub}</p>
             </div>
             <div className="grid gap-3">
                {assignmentStats.map((a, i) => (
                   <div key={a.id} className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-4 ${i===0 ? 'bg-red-100 text-red-600' : 'bg-white text-slate-500 border'}`}>
                         #{i+1}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-800 text-sm">{a.title}</h4>
                         <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 max-w-[200px]">
                            <div className={`h-full rounded-full ${a.avg < 50 ? 'bg-red-500' : 'bg-orange-400'}`} style={{width: `${a.avg}%`}}></div>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="block text-lg font-black text-slate-700">{a.avg}%</span>
                         <span className="text-[10px] text-slate-400 font-bold uppercase">{t.tables.avg}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: KPI Card ---
function KPICard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-50',
    blue: 'from-blue-500 to-blue-600 text-blue-50',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-50',
    orange: 'from-orange-500 to-orange-600 text-orange-50'
  };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-lg shadow-${color}-200/50 flex flex-col justify-between h-32 relative overflow-hidden group`}>
       <div className="absolute right-[-10px] top-[-10px] opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
          <Icon size={80} />
       </div>
       <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 relative z-10">
          <Icon size={16}/> {title}
       </div>
       <div className="text-4xl font-black tracking-tight relative z-10">
          {value}
       </div>
    </div>
  );
}