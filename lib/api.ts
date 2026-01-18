import syllabusData from '@/data/syllabus.json';

// --- Types ---
export interface PathIds {
  subjectId: string;
  topicId: string;
  chapterId: string;
  subtopicId: string;
  found: boolean;
}

// --- Helpers ---
const pad2 = (num: number) => num.toString().padStart(2, '0'); // 4 -> "04"
const noPad = (num: number) => num.toString();                 // 1 -> "1"

// 🛠️ SMART NORMALIZER
// Removes spaces, lowercases everything, and fixes apostrophes
const normalize = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')       // Remove all spaces
    .replace(/['`’‘]/g, "'");  // Turn ` ’ ‘ into normal '
};

export function getIdsFromSubtopicName(subtopicName: string): PathIds {
  // 1. Clean the incoming URL name
  const decodedName = decodeURIComponent(subtopicName);
  const searchKey = normalize(decodedName);

  console.log(`🔍 Searching for: "${decodedName}"`);
  console.log(`🔑 Normalized Key: "${searchKey}"`);

  // 2. Loop through your 3 Categories (Algebra, Geom, 5_sinf)
  for (const category of syllabusData) {
    for (const chapter of category.chapters) {
      for (const subtopic of chapter.subtopics) {
        
        // Compare Normalized Versions
        const currentSubtopicKey = normalize(subtopic.name);

        if (currentSubtopicKey === searchKey) {
          console.log(`✅ MATCH FOUND!`);
          console.log(`👉 Category: ${category.category} (ID: ${category.index})`);
          console.log(`👉 Chapter: ${chapter.chapter} (ID: ${chapter.index})`);
          console.log(`👉 Subtopic: ${subtopic.name} (ID: ${subtopic.index})`);
          
          return {
            subjectId: "01",                   // Hardcoded "01" (Matematika) based on your Python script
            topicId: noPad(category.index),    // "1", "2", or "3" (5_sinf)
            chapterId: pad2(chapter.index),    // "01", "10"...
            subtopicId: pad2(subtopic.index),  // "01", "05"...
            found: true
          };
        }
      }
    }
  }

  console.error("❌ NO MATCH FOUND. Check console for Normalized Key comparison.");
  return { subjectId: "01", topicId: "0", chapterId: "00", subtopicId: "00", found: false };
}