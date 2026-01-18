'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, PlayCircle, BookOpen, Layers } from 'lucide-react';
import syllabusData from '@/data/syllabus.json';

export default function SyllabusPage() {
  // Default: Algebra (Index 1) is open
  const [openCategories, setOpenCategories] = useState<number[]>([1]); 
  const [openChapters, setOpenChapters] = useState<string[]>([]); 

  // Toggle Category (Algebra, Geometry, etc.)
  const toggleCategory = (index: number) => {
    setOpenCategories(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Toggle Chapter (Natural sonlar, etc.)
  const toggleChapter = (uniqueId: string) => {
    setOpenChapters(prev => 
      prev.includes(uniqueId) ? prev.filter(i => i !== uniqueId) : [...prev, uniqueId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BookOpen className="text-blue-600" /> Syllabus
        </h1>
        <p className="text-gray-500 mt-2">Select a topic to start practicing immediately.</p>
      </div>

      <div className="space-y-6">
        {syllabusData.map((topic) => (
          <div key={topic.index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* 1. CATEGORY HEADER */}
            <button 
              onClick={() => toggleCategory(topic.index)}
              className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-4">
                {/* Colorful Icon Box */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                  topic.category === 'Algebra' ? 'bg-blue-600' : 
                  topic.category === 'Geometriya' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                  {topic.category.substring(0, 1)}
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-800">{topic.category}</h2>
                  <p className="text-sm text-gray-400">{topic.chapters.length} Chapters</p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                {openCategories.includes(topic.index) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            </button>

            {/* 2. CHAPTERS LIST */}
            {openCategories.includes(topic.index) && (
              <div className="bg-gray-50/50">
                {topic.chapters.map((chapter) => {
                  const uniqueChapterId = `${topic.index}-${chapter.index}`;
                  const isOpen = openChapters.includes(uniqueChapterId);

                  return (
                    <div key={chapter.index} className="border-b border-gray-100 last:border-0">
                      {/* Chapter Header */}
                      <button 
                        onClick={() => toggleChapter(uniqueChapterId)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white transition text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <Layers size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="font-semibold text-gray-700 group-hover:text-gray-900">
                            {chapter.chapter}
                          </span>
                        </div>
                        {isOpen ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                      </button>

                      {/* 3. SUBTOPICS (THE LINKS) */}
                      {isOpen && (
                        <div className="px-6 pb-6 pt-2 grid gap-2">
                          {chapter.subtopics.map((subtopic) => (
                            <Link 
                              key={subtopic.index} 
                              href={`/practice/${subtopic.name}`}
                              className="group flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md hover:translate-x-1 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                  {chapter.index}.{subtopic.index}
                                </span>
                                <span className="font-medium text-gray-700 group-hover:text-blue-700">
                                  {subtopic.name}
                                </span>
                              </div>
                              <PlayCircle size={20} className="text-gray-300 group-hover:text-blue-500" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}