'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Printer, Columns, Type, Layout, 
  Minus, Plus, Smartphone, Grid, Maximize, Minimize, 
  ZoomIn, ZoomOut, CheckSquare, User, FileText, Download,
  ScanLine, List, Grid3X3
} from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';

// --- HELPER: Safe Data Reading ---
const getContentText = (content: any) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  return content.uz || content.en || content.ru || content.text || JSON.stringify(content);
};

export default function PrintStudioPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState<{ title: string; questions: any[] } | null>(null);

  // --- CONFIGURATION ---
  const [columns, setColumns] = useState<1 | 2 | 3>(2);
  const [fontSize, setFontSize] = useState<number>(14);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('compact');
  const [showAnswers, setShowAnswers] = useState<'none' | 'inline' | 'end'>('none');
  const [showLines, setShowLines] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [answerSheet, setAnswerSheet] = useState<'none' | 'standard' | 'grid' | 'omr'>('none');
  
  const printRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('print_payload');
      if (stored) setData(JSON.parse(stored));
    } catch (e) { console.error("Load error"); } 
    finally { setIsLoaded(true); }
  }, []);

  if (!isLoaded) return null;
  if (!data) return <div className="p-10 text-center">No data found.</div>;

  // 🟢 DOWNLOAD HTML FUNCTION
  const handleDownloadHtml = () => {
    if (!printRootRef.current) return;
    const contentHtml = printRootRef.current.innerHTML;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.title}</title>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
          <style>
            @media print { 
              body { -webkit-print-color-adjust: exact; } 
              @page { size: A4 ${orientation}; margin: 10mm; }
              /* Ensure the answer sheet doesn't get cut in half */
              .avoid-break { break-inside: avoid; page-break-inside: avoid; }
            }
            .columns-2 { column-count: 2; }
            .columns-3 { column-count: 3; }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-8">
          <div style="max-width: ${orientation === 'landscape' ? '297mm' : '210mm'}; margin: 0 auto;">
            ${contentHtml}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/\s+/g, '_')}_Exam.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* 2. SIDEBAR */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 h-auto md:h-screen overflow-y-auto shrink-0 no-print shadow-xl z-20 flex flex-col relative">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <Printer size={20} className="text-indigo-600"/> Print Studio
          </h2>
        </div>

        <div className="p-5 space-y-8 flex-1">
          {/* Layout Controls */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Layout size={14}/> Layout</label>
            <div className="grid grid-cols-3 gap-2">
               {[1, 2, 3].map(col => (
                 <button key={col} onClick={() => setColumns(col as any)} className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${columns === col ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                   {col === 1 ? <Smartphone size={16}/> : col === 2 ? <Columns size={16}/> : <Grid size={16}/>} {col} Col
                 </button>
               ))}
            </div>
            {columns > 1 && (
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <input type="checkbox" checked={showLines} onChange={() => setShowLines(!showLines)} className="rounded text-indigo-600 focus:ring-0"/> Show Divider Lines
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Orientation</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                   <button onClick={() => setOrientation('portrait')} className={`flex-1 py-1.5 rounded text-xs font-bold ${orientation === 'portrait' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>A4</button>
                   <button onClick={() => setOrientation('landscape')} className={`flex-1 py-1.5 rounded text-xs font-bold ${orientation === 'landscape' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Hrz</button>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Padding</label>
                <button onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')} className={`w-full py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${density === 'compact' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                  {density === 'compact' ? <Minimize size={14}/> : <Maximize size={14}/>} {density === 'compact' ? 'Compact' : 'Wide'}
                </button>
             </div>
          </div>

          {/* FONT SIZE */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Type size={14}/> Font Size</label>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{fontSize}px</span>
             </div>
             <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setFontSize(Math.max(6, fontSize - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-md"><Minus size={14}/></button>
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: `${((fontSize - 6) / 24) * 100}%` }}></div>
                </div>
                <button onClick={() => setFontSize(Math.min(30, fontSize + 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-md"><Plus size={14}/></button>
             </div>
          </div>

          {/* ANSWER SHEET TOGGLE */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
             <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
               <ScanLine size={14}/> Bubble Sheet
             </label>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAnswerSheet('none')} className={`p-2 rounded-lg border text-xs font-bold transition-all ${answerSheet === 'none' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>None</button>
                <button onClick={() => setAnswerSheet('standard')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${answerSheet === 'standard' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><List size={14}/> Standard</button>
                <button onClick={() => setAnswerSheet('grid')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${answerSheet === 'grid' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Grid3X3 size={14}/> Grid</button>
                <button onClick={() => setAnswerSheet('omr')} className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${answerSheet === 'omr' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><ScanLine size={14}/> Scanner</button>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><User size={14}/> Student Info Header</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${showHeader ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <input type="checkbox" checked={showHeader} onChange={() => setShowHeader(!showHeader)} className="sr-only"/>
                <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${showHeader ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </label>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><CheckSquare size={14}/> Answer Key</label>
               <select value={showAnswers} onChange={(e) => setShowAnswers(e.target.value as any)} className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none">
                 <option value="none">Hidden (Student Copy)</option>
                 <option value="inline">Inline (Study Guide)</option>
                 <option value="end">End of Page (Teacher)</option>
               </select>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 sticky bottom-0">
          <button onClick={handleDownloadHtml} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
            <Download size={20} /> Download HTML
          </button>
        </div>
      </div>

      {/* 3. PREVIEW AREA */}
      <div className="flex-1 bg-slate-500/10 relative overflow-hidden flex flex-col no-print">
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white p-1 rounded-lg shadow-md no-print">
          <button onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))} className="p-2 hover:bg-slate-100 rounded"><ZoomOut size={16}/></button>
          <span className="text-xs font-bold self-center w-12 text-center">{Math.round(previewZoom * 100)}%</span>
          <button onClick={() => setPreviewZoom(Math.min(1.5, previewZoom + 0.1))} className="p-2 hover:bg-slate-100 rounded"><ZoomIn size={16}/></button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
          
          <div 
            id="print-root" 
            ref={printRootRef}
            className="bg-white shadow-2xl transition-all duration-300 origin-top"
            style={{
              transform: `scale(${previewZoom})`,
              width: orientation === 'landscape' ? '297mm' : '210mm',
              minHeight: orientation === 'landscape' ? '210mm' : '297mm',
              padding: density === 'compact' ? '10mm' : '20mm',
              fontSize: `${fontSize}px`
            }}
          >
            {/* HEADER */}
            <div className="mb-6 pb-2 border-b-2 border-slate-900">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900 uppercase leading-none">{data.title}</h1>
                <div className="font-bold text-slate-500 text-xs uppercase tracking-wide">
                   Total Questions: <span className="text-slate-900 text-sm ml-1">{data.questions.length}</span>
                </div>
              </div>
              
              {showHeader && (
                <div className="flex gap-6 mt-6 pt-1">
                    <div className="flex-1 flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Name:</span>
                      <div className="flex-1 border-b border-slate-300"></div>
                    </div>
                    <div className="w-32 flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Date:</span>
                      <div className="flex-1 border-b border-slate-300"></div>
                    </div>
                    <div className="w-24 flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Score:</span>
                      <div className="flex-1 border-b border-slate-300"></div>
                    </div>
                </div>
              )}
            </div>

            {/* QUESTIONS */}
            <div style={{
                columnCount: columns,
                columnGap: '2rem',
                columnRule: (columns > 1 && showLines) ? '1px solid #94a3b8' : 'none'
            }}>
              {data.questions.map((q: any, idx: number) => {
                const sortedOptions = Object.entries(q.options || {}).sort(([keyA], [keyB]) => 
                  String(keyA).localeCompare(String(keyB))
                );

                return (
                  <div key={idx} className="break-inside-avoid-column mb-5" style={{ pageBreakInside: 'avoid' }}>
                    <div className="flex gap-2 mb-1.5">
                      <span className="font-bold text-slate-900 shrink-0">{idx + 1}.</span>
                      <div className="font-medium text-slate-900 leading-snug">
                        <LatexRenderer latex={getContentText(q.question)} />
                      </div>
                    </div>
                    <div className={`ml-5 grid ${columns === 3 ? 'grid-cols-1' : 'grid-cols-2'} gap-x-4 gap-y-1`}>
                      {sortedOptions.map(([key, val]: any) => {
                        const isCorrect = key === q.answer;
                        const showCorrect = (showAnswers === 'inline' && isCorrect);
                        return (
                          <div key={key} className={`flex items-baseline gap-1.5 ${showCorrect ? 'font-bold text-black' : 'text-slate-600'}`}>
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 self-center ${showCorrect ? 'border-black bg-slate-200 text-black' : 'border-slate-300 text-slate-400'}`}>
                              {key}
                            </span>
                            <span className="text-[0.9em] leading-tight"><LatexRenderer latex={getContentText(val)} /></span>
                          </div>
                        );
                      })}
                    </div>
                    {density === 'comfortable' && <div className="h-4"></div>}
                  </div>
                );
              })}
            </div>

            {/* TEACHER KEY (Separate Page if selected) */}
            {showAnswers === 'end' && (
              <div className="break-before-page mt-8 pt-4 border-t-2 border-dashed border-slate-300">
                <h3 className="font-black text-sm text-slate-900 mb-3 uppercase flex items-center gap-2"><FileText size={14}/> Answer Key</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono">
                  {data.questions.map((q: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-400">{idx + 1}.</span>
                      <span className="font-black text-slate-900 bg-slate-100 px-1 rounded">{q.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🟢 SMART ANSWER SHEET (CONTINUOUS FLOW) */}
            {answerSheet !== 'none' && (
               // Added 'break-inside-avoid' to prevent the sheet itself from splitting
               // Removed 'break-before-page' to allow continuous flow
               <div className="break-inside-avoid mt-8 pt-6 border-t-4 border-slate-900">
                  
                  {/* Compact Header: Title Left, Score Right */}
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        {answerSheet === 'omr' && <ScanLine size={24} className="text-slate-900"/>}
                        <h2 className="text-xl font-black uppercase tracking-tight">Answer Sheet</h2>
                     </div>
                     
                     {/* Compact Score Box */}
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Score:</span>
                        <div className="w-24 h-10 border-2 border-slate-300 rounded-lg"></div>
                     </div>
                  </div>

                  {/* 1. STANDARD STYLE */}
                  {answerSheet === 'standard' && (
                     <div className="columns-2 md:columns-4 gap-8">
                       {data.questions.map((q, idx) => (
                         <div key={idx} className="flex items-center gap-3 mb-3 break-inside-avoid">
                            <span className="font-bold text-slate-700 w-6 text-right">{idx + 1}.</span>
                            <div className="flex gap-2">
                               {['A','B','C','D'].map(opt => (
                                 <div key={opt} className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                   {opt}
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                     </div>
                  )}

                  {/* 2. GRID STYLE */}
                  {answerSheet === 'grid' && (
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                       {data.questions.map((q, idx) => (
                         <div key={idx} className="border border-slate-200 p-2 rounded flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-500 mr-2">{idx + 1}</span>
                            <div className="flex gap-1">
                               {['A','B','C','D'].map(opt => (
                                 <div key={opt} className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-300">
                                   {opt}
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                     </div>
                  )}

                  {/* 3. OMR STYLE */}
                  {answerSheet === 'omr' && (
                     <div className="border-2 border-slate-900 p-1 relative">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-1 px-4 py-2">
                           {data.questions.map((q, idx) => (
                             <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-1">
                                <span className="font-mono font-bold text-slate-800">{idx + 1}</span>
                                <div className="flex gap-4">
                                   {['A','B','C','D'].map(opt => (
                                     <div key={opt} className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                       {opt}
                                     </div>
                                   ))}
                                </div>
                             </div>
                           ))}
                        </div>
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