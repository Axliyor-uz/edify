'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Printer, Columns, Type, Layout, 
  Minus, Plus, Smartphone, Grid, ZoomIn, ZoomOut, 
  CheckSquare, User, FileText, Download,
  ScanLine, List, Grid3X3, Shuffle, Settings, Edit3, AlignLeft
} from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';
import { useTeacherLanguage } from '@/app/teacher/layout'; // 🟢 Import Hook

// --- 1. TRANSLATION DICTIONARY ---
const PRINT_TRANSLATIONS = {
  uz: {
    title: "Chop Etish Studiyasi",
    shuffle: "Savollarni Aralashtirish",
    layout: "Ko'rinish",
    cols: "{n} Ustun",
    lines: "Ajratuvchi chiziqlar",
    header: "Sarlavha Ma'lumotlari",
    schoolPlace: "Maktab / O'quv markaz nomi",
    teacherPlace: "O'qituvchi",
    studentInfo: "O'quvchi Ma'lumotlari (Ism, Sana...)",
    typography: "Matn Sozlamalari",
    size: "O'lcham",
    answers: "Javoblar Varaqasi",
    ansStyles: {
      none: "Yo'q",
      standard: "Standart (A,B,C)",
      writein: "Yozma (Katak)",
      grid: "Katakli"
    },
    keys: "Javoblar Kaliti",
    keyStyles: {
      none: "Yashirin",
      inline: "Savol yonida",
      end: "Sahifa oxirida"
    },
    download: "HTML Yuklab Olish",
    preview: "Ko'rib Chiqish",
    total: "Jami Savollar",
    name: "Ism",
    date: "Sana",
    group: "Guruh",
    score: "Ball"
  },
  en: {
    title: "Print Studio",
    shuffle: "Shuffle Questions",
    layout: "Layout",
    cols: "{n} Col",
    lines: "Divider Lines",
    header: "Header Details",
    schoolPlace: "School / Center Name",
    teacherPlace: "Teacher Name",
    studentInfo: "Student Info Header (Name, Date...)",
    typography: "Typography",
    size: "Size",
    answers: "Bubble Sheet",
    ansStyles: {
      none: "None",
      standard: "Standard (A,B,C)",
      writein: "Write-in (Box)",
      grid: "Grid"
    },
    keys: "Answer Key",
    keyStyles: {
      none: "Hidden",
      inline: "Inline",
      end: "End of Page"
    },
    download: "Download HTML",
    preview: "Preview",
    total: "Total Questions",
    name: "Name",
    date: "Date",
    group: "Group",
    score: "Score"
  },
  ru: {
    title: "Студия Печати",
    shuffle: "Перемешать Вопросы",
    layout: "Макет",
    cols: "{n} Кол",
    lines: "Разделительные линии",
    header: "Заголовок",
    schoolPlace: "Название Школы / Центра",
    teacherPlace: "Имя Учителя",
    studentInfo: "Шапка Ученика (Имя, Дата...)",
    typography: "Типография",
    size: "Размер",
    answers: "Бланк Ответов",
    ansStyles: {
      none: "Нет",
      standard: "Стандарт (A,B,C)",
      writein: "Вписать (Клетка)",
      grid: "Сетка"
    },
    keys: "Ключи Ответов",
    keyStyles: {
      none: "Скрыто",
      inline: "Рядом",
      end: "В конце"
    },
    download: "Скачать HTML",
    preview: "Предпросмотр",
    total: "Всего вопросов",
    name: "Имя",
    date: "Дата",
    group: "Группа",
    score: "Балл"
  }
};

// --- HELPER: Safe Data Reading ---
const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

export default function PrintStudioPage() {
  const { lang } = useTeacherLanguage();
  const t = PRINT_TRANSLATIONS[lang];

  const [isLoaded, setIsLoaded] = useState(false);
  const [originalData, setOriginalData] = useState<{ title: string; questions: any[] } | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]);

  // --- CONFIGURATION ---
  const [columns, setColumns] = useState<1 | 2 | 3>(2);
  const [showLines, setShowLines] = useState(true);
  
  const [headerInfo, setHeaderInfo] = useState({ school: '', teacher: '' });
  const [showStudentHeader, setShowStudentHeader] = useState(true);
  
  const [fontSize, setFontSize] = useState<number>(11); // Default compact size
  const [showAnswers, setShowAnswers] = useState<'none' | 'inline' | 'end'>('none');
  const [answerSheet, setAnswerSheet] = useState<'none' | 'standard' | 'writein' | 'grid'>('none');
  
  const [previewZoom, setPreviewZoom] = useState(1);
  const printRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('print_payload');
      if (stored) {
        const parsed = JSON.parse(stored);
        setOriginalData(parsed);
        setActiveQuestions(parsed.questions || []);
      }
    } catch (e) { console.error("Load error"); } 
    finally { setIsLoaded(true); }
  }, []);

  const handleShuffle = () => {
    // Randomize questions but keep options intact
    const shuffled = [...activeQuestions].sort(() => 0.5 - Math.random());
    setActiveQuestions(shuffled);
  };

  const handleDownloadHtml = () => {
    if (!printRootRef.current || !originalData) return;
    const contentHtml = printRootRef.current.innerHTML;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${originalData.title}</title>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
          <style>
            @media print { 
              body { -webkit-print-color-adjust: exact; } 
              @page { size: A4; margin: 10mm; }
              .avoid-break { break-inside: avoid; page-break-inside: avoid; display: inline-block; width: 100%; }
              .break-before { page-break-before: always; }
            }
            .print-cols-2 { column-count: 2; column-gap: 1.5rem; column-rule: ${showLines ? '1px solid #cbd5e1' : 'none'}; }
            .print-cols-3 { column-count: 3; column-gap: 1rem; column-rule: ${showLines ? '1px solid #cbd5e1' : 'none'}; }
          </style>
        </head>
        <body class="bg-white text-slate-900">
          <div style="max-width: 210mm; margin: 0 auto;">
            ${contentHtml}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${originalData.title.replace(/\s+/g, '_')}_Exam.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoaded) return null;
  if (!originalData) return <div className="p-10 text-center">No data found.</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900 print:bg-white print:block">
      
      {/* --- SIDEBAR CONTROLS --- */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 h-auto md:h-screen overflow-y-auto shrink-0 shadow-xl z-20 flex flex-col print:hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <Printer size={20} className="text-indigo-600"/> {t.title}
          </h2>
        </div>

        <div className="p-5 space-y-6 flex-1">
          
          {/* 1. SHUFFLE */}
          <button 
            onClick={handleShuffle} 
            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-200"
          >
            <Shuffle size={18} /> {t.shuffle}
          </button>

          {/* 2. LAYOUT */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Layout size={14}/> {t.layout}
            </label>
            <div className="grid grid-cols-3 gap-2">
               {[1, 2, 3].map(col => (
                 <button key={col} onClick={() => setColumns(col as any)} className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${columns === col ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                   {col === 1 ? <Smartphone size={16}/> : col === 2 ? <Columns size={16}/> : <Grid size={16}/>} {t.cols.replace("{n}", col.toString())}
                 </button>
               ))}
            </div>
            {columns > 1 && (
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-bold text-slate-600">
                <input type="checkbox" checked={showLines} onChange={() => setShowLines(!showLines)} className="rounded text-indigo-600 focus:ring-0"/> {t.lines}
              </label>
            )}
          </div>

          {/* 3. HEADER INFO */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
             <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
               <Settings size={14}/> {t.header}
             </label>
             <input 
               type="text" 
               placeholder={t.schoolPlace}
               value={headerInfo.school}
               onChange={e => setHeaderInfo({...headerInfo, school: e.target.value})}
               className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium"
             />
             <input 
               type="text" 
               placeholder={t.teacherPlace}
               value={headerInfo.teacher}
               onChange={e => setHeaderInfo({...headerInfo, teacher: e.target.value})}
               className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium"
             />
             <label className="flex items-center gap-2 cursor-pointer mt-1 text-xs font-bold text-slate-600">
                <input type="checkbox" checked={showStudentHeader} onChange={() => setShowStudentHeader(!showStudentHeader)} className="rounded text-indigo-600 focus:ring-0"/> {t.studentInfo}
             </label>
          </div>

          {/* 4. TYPOGRAPHY */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Type size={14}/> {t.typography}</label>
                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{fontSize}pt</span>
             </div>
             <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-md"><Minus size={14}/></button>
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                   <div className="h-full bg-slate-400" style={{ width: `${((fontSize - 8) / 16) * 100}%` }}></div>
                </div>
                <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-md"><Plus size={14}/></button>
             </div>
          </div>

          {/* 5. ANSWER SHEET */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
             <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
               <ScanLine size={14}/> {t.answers}
             </label>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAnswerSheet('none')} className={`p-2 rounded-lg border text-xs font-bold ${answerSheet === 'none' ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-500'}`}>{t.ansStyles.none}</button>
                <button onClick={() => setAnswerSheet('standard')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${answerSheet === 'standard' ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-600'}`}><List size={14}/> {t.ansStyles.standard}</button>
                <button onClick={() => setAnswerSheet('writein')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${answerSheet === 'writein' ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-600'}`}><Edit3 size={14}/> {t.ansStyles.writein}</button>
                <button onClick={() => setAnswerSheet('grid')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${answerSheet === 'grid' ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-600'}`}><Grid3X3 size={14}/> {t.ansStyles.grid}</button>
             </div>
          </div>

          {/* 6. ANSWER KEY */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
             <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><CheckSquare size={14}/> {t.keys}</label>
             <select value={showAnswers} onChange={(e) => setShowAnswers(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none">
               <option value="none">{t.keyStyles.none}</option>
               <option value="inline">{t.keyStyles.inline}</option>
               <option value="end">{t.keyStyles.end}</option>
             </select>
          </div>

        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 sticky bottom-0">
          <button onClick={handleDownloadHtml} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
            <Download size={20} /> {t.download}
          </button>
        </div>
      </div>

      {/* --- PREVIEW AREA --- */}
      <div className="flex-1 bg-slate-200/50 relative overflow-hidden flex flex-col print:bg-white print:p-0 print:overflow-visible">
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white p-1 rounded-lg shadow-md print:hidden">
          <button onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))} className="p-2 hover:bg-slate-100 rounded"><ZoomOut size={16}/></button>
          <span className="text-xs font-bold self-center w-12 text-center">{Math.round(previewZoom * 100)}%</span>
          <button onClick={() => setPreviewZoom(Math.min(1.5, previewZoom + 0.1))} className="p-2 hover:bg-slate-100 rounded"><ZoomIn size={16}/></button>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:block">
          
          {/* --- A4 PAPER --- */}
          <div 
            id="print-root" 
            ref={printRootRef}
            className="bg-white shadow-2xl transition-all duration-300 origin-top print:shadow-none print:w-full print:scale-100 print:transform-none"
            style={{
              transform: `scale(${previewZoom})`,
              width: '210mm',
              minHeight: '297mm', // A4 Height
              padding: '10mm',    // Compact padding
              fontSize: `${fontSize}pt`
            }}
          >
            {/* HEADER */}
            <div className="mb-4 pb-2 border-b-2 border-black">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {headerInfo.school && <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">{headerInfo.school}</h3>}
                  <h1 className="text-2xl font-black text-black uppercase leading-none">{originalData.title}</h1>
                  {headerInfo.teacher && <div className="text-xs font-bold text-slate-600 mt-1">{t.teacherPlace}: {headerInfo.teacher}</div>}
                </div>
                <div className="text-right">
                   <div className="font-bold text-slate-500 text-[10px] uppercase tracking-wide">
                      {t.total}: <span className="text-black text-sm">{activeQuestions.length}</span>
                   </div>
                </div>
              </div>
              
              {showStudentHeader && (
                <div className="flex gap-4 mt-4 pt-1 text-xs">
                    <div className="flex-1 flex items-baseline gap-1">
                      <span className="font-bold uppercase shrink-0">{t.name}:</span>
                      <div className="flex-1 border-b border-slate-300 h-4"></div>
                    </div>
                    <div className="w-24 flex items-baseline gap-1">
                      <span className="font-bold uppercase shrink-0">{t.date}:</span>
                      <div className="flex-1 border-b border-slate-300 h-4"></div>
                    </div>
                    <div className="w-20 flex items-baseline gap-1">
                      <span className="font-bold uppercase shrink-0">{t.group}:</span>
                      <div className="flex-1 border-b border-slate-300 h-4"></div>
                    </div>
                    <div className="w-16 flex items-baseline gap-1">
                      <span className="font-bold uppercase shrink-0">{t.score}:</span>
                      <div className="flex-1 border-b border-slate-300 h-4"></div>
                    </div>
                </div>
              )}
            </div>

            {/* QUESTIONS LAYOUT */}
            <div className={`print-cols-${columns}`} style={{
                columnCount: columns,
                columnGap: columns > 1 ? '1.5rem' : '0',
                columnRule: (columns > 1 && showLines) ? '1px solid #cbd5e1' : 'none'
            }}>
              {activeQuestions.map((q: any, idx: number) => {
                const sortedOptions = Object.entries(q.options || {}).sort(([keyA], [keyB]) => 
                  String(keyA).localeCompare(String(keyB))
                );

                return (
                  <div 
                    key={q.id || idx} 
                    className="mb-3 avoid-break" 
                    style={{ breakInside: 'avoid', display: 'inline-block', width: '100%' }}
                  >
                    <div className="flex gap-1.5 mb-1">
                      <span className="font-bold text-black shrink-0">{idx + 1}.</span>
                      <div className="font-medium text-black leading-snug">
                        <LatexRenderer latex={getContentText(q.question)} />
                      </div>
                    </div>
                    
                    <div className={`ml-4 grid ${columns === 3 ? 'grid-cols-1' : 'grid-cols-2'} gap-x-2 gap-y-0.5`}>
                      {sortedOptions.map(([key, val]: any) => {
                        const isCorrect = key === q.answer;
                        const showCorrect = (showAnswers === 'inline' && isCorrect);
                        return (
                          <div key={key} className={`flex items-baseline gap-1.5 ${showCorrect ? 'font-bold text-black' : 'text-slate-700'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 self-center ${showCorrect ? 'border-black bg-slate-200' : 'border-slate-400'}`}>
                              {key}
                            </span>
                            <span className="text-[0.9em] leading-tight"><LatexRenderer latex={getContentText(val)} /></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TEACHER KEY */}
            {showAnswers === 'end' && (
              <div className="break-before mt-6 pt-4 border-t-2 border-dashed border-black">
                <h3 className="font-black text-sm text-black mb-2 uppercase flex items-center gap-2"><FileText size={14}/> {t.keys}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono">
                  {activeQuestions.map((q: any, idx: number) => (
                    <span key={idx} className="inline-block">
                      <strong className="text-slate-500">{idx + 1}.</strong> {q.answer}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ANSWER SHEETS */}
            {answerSheet !== 'none' && (
               <div className="break-inside-avoid mt-6 pt-4 border-t-2 border-black">
                  
                  <div className="flex justify-between items-center mb-4">
                     <h2 className="text-sm font-black uppercase">{t.answers}</h2>
                     <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase">{t.score}:</span>
                        <div className="w-12 h-6 border border-black"></div>
                     </div>
                  </div>

                  {/* 1. STANDARD BUBBLES */}
                  {answerSheet === 'standard' && (
                     <div className={`columns-${columns === 1 ? 2 : columns === 2 ? 3 : 4} gap-6 text-[10px]`}>
                       {activeQuestions.map((q, idx) => (
                         <div key={idx} className="flex items-center gap-2 mb-1 break-inside-avoid">
                            <span className="font-bold w-4 text-right">{idx + 1}.</span>
                            <div className="flex gap-1">
                               {['A','B','C','D'].map(opt => (
                                 <div key={opt} className="w-4 h-4 rounded-full border border-black flex items-center justify-center font-bold text-[8px] text-slate-500">
                                   {opt}
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                     </div>
                  )}

                  {/* 2. WRITE-IN STYLE */}
                  {answerSheet === 'writein' && (
                     <div className={`columns-${columns === 1 ? 2 : columns === 2 ? 4 : 5} gap-4 text-[10px]`}>
                       {activeQuestions.map((q, idx) => (
                         <div key={idx} className="flex items-center gap-1 mb-2 break-inside-avoid">
                            <span className="font-bold w-5 text-right">{idx + 1}.</span>
                            <div className="w-8 h-6 border-b border-black bg-slate-50"></div>
                         </div>
                       ))}
                     </div>
                  )}

                  {/* 3. GRID STYLE */}
                  {answerSheet === 'grid' && (
                     <div className={`grid grid-cols-${columns === 1 ? 2 : columns === 2 ? 4 : 5} gap-2 text-[10px]`}>
                       {activeQuestions.map((q, idx) => (
                         <div key={idx} className="border border-black p-1 flex justify-between items-center">
                            <span className="font-bold mr-1">{idx + 1}</span>
                            <div className="flex gap-0.5">
                               {['A','B','C','D'].map(opt => (
                                 <div key={opt} className="w-3 h-3 rounded-full border border-slate-400 flex items-center justify-center text-[6px]">
                                   {opt}
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                     </div>
                  )}
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}