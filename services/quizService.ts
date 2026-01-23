import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, startAfter, doc, getDoc, DocumentSnapshot } from 'firebase/firestore';

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
}

/**
 * Fetches questions with strict pagination.
 * @param lastDoc - Can be a full DocumentSnapshot (from fresh fetch) OR a string ID (from cache recovery)
 */
export async function fetchQuestions(
  ids: PathIds, 
  difficulty: 'Easy' | 'Medium' | 'Hard',
  lastDoc: DocumentSnapshot | string | null = null
) {
  let diffIndex = "1";
  if (difficulty === 'Medium') diffIndex = "2";
  if (difficulty === 'Hard') diffIndex = "3";

  const pad = (num: number | string) => num.toString().padStart(2, '0');
  const noPad = (num: number | string) => num.toString();

  // Construct Path: /questions/01/t/1/c/10/s/04/d/1/q
  const collectionPath = [
    "questions", "01",
    "t", noPad(ids.topicId),
    "c", pad(ids.chapterId),
    "s", pad(ids.subtopicId),
    "d", diffIndex,
    "q"
  ];

  try {
    const questionsRef = collection(db, collectionPath[0], ...collectionPath.slice(1));
    let q;

    // A. Handle Pagination Cursor
    let cursorObj: DocumentSnapshot | null = null;

    if (typeof lastDoc === 'string') {
      // If we only have an ID (from cache), we pay 1 Read to fetch the live snapshot 
      // so we can resume pagination correctly.
      const docRef = doc(db, collectionPath[0], ...collectionPath.slice(1), lastDoc);
      cursorObj = await getDoc(docRef);
    } else {
      cursorObj = lastDoc;
    }

    // B. Build Query
    if (cursorObj) {
      // Load MORE: Start after the cursor
      q = query(questionsRef, startAfter(cursorObj), limit(5));
    } else {
      // Load FIRST: Just take the first 5
      q = query(questionsRef, limit(5));
    }

    const snapshot = await getDocs(q);

    const questions = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Question[];

    return {
      questions,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null // Return snapshot for next cursor
    };

  } catch (error) {
    console.error("🔥 Firebase Error:", error);
    return { questions: [], lastDoc: null };
  }
}