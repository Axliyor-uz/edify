import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  doc, 
  getDoc, 
  DocumentSnapshot 
} from 'firebase/firestore';

export interface PathIds {
  subjectId: string | number;
  topicId: number;
  chapterId: number;
  subtopicId: number;
}

export interface Question {
  id: string;
  question?: { uz: string; ru: string; en: string } | string;
  options?: any;
  answer?: string;
  difficulty?: string;
  text?: string;
  // Add other fields if needed for UI mapping
}

/**
 * Fetches questions from the FLAT 'questions1' collection using Filters.
 */
export async function fetchQuestions(
  ids: PathIds, 
  difficulty: 'Easy' | 'Medium' | 'Hard',
  lastDoc: DocumentSnapshot | string | null = null
) {
  // 1. Difficulty Mapping (Must match Python script logic: 1, 2, 3 as Integers)
  let diffVal = 1;
  if (difficulty === 'Medium') diffVal = 2;
  if (difficulty === 'Hard') diffVal = 3;

  // 2. ID Formatting (Must match Python logic exactly)
  // Python: topic="1" (no pad), chapter="01" (pad 2), subtopic="01" (pad 2)
  const topicStr = ids.topicId.toString(); 
  const chapterStr = ids.chapterId.toString().padStart(2, '0');
  const subtopicStr = ids.subtopicId.toString().padStart(2, '0');

  try {
    // 🟢 Target the new collection
    const questionsRef = collection(db, 'questions1');
    let q = query(questionsRef);

    // 3. Apply Filters
    // We filter by the specific subtopic and difficulty
    q = query(
      q,
      where('topicId', '==', topicStr),
      where('chapterId', '==', chapterStr),
      where('subtopicId', '==', subtopicStr),
      where('difficultyId', '==', diffVal)
    );

    // 4. Sorting & Pagination
    // We order by 'uploadedAt' so the cursor stays stable.
    q = query(q, orderBy('uploadedAt', 'desc'), limit(5));

    // 5. Handle Cursor (Pagination)
    if (lastDoc) {
      if (typeof lastDoc === 'string') {
        // If we only have an ID (from cache), fetch the live snapshot first
        // 🟢 Target 'questions1' here too
        const docRef = doc(db, 'questions1', lastDoc);
        const cursorSnapshot = await getDoc(docRef);
        
        if (cursorSnapshot.exists()) {
          q = query(q, startAfter(cursorSnapshot));
        }
      } else {
        // Standard case: We have the snapshot object
        q = query(q, startAfter(lastDoc));
      }
    }

    // 6. Execute Fetch
    const snapshot = await getDocs(q);

    const questionsList = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Question[];

    return {
      questions: questionsList, // ✅ Return as 'questions' to match your frontend destructuring
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };

  } catch (error) {
    console.error("🔥 Firebase Query Error:", error);
    return { questions: [], lastDoc: null };
  }
}