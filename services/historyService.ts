import { db } from '@/lib/firebase';
import { 
  collection, addDoc, query, where, getDocs, orderBy, limit, 
  doc, getDoc 
} from 'firebase/firestore';
import { Question } from '@/types';

export interface AttemptResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string; 
  correctAnswer: string;
  timeSpent: number;
  questionPath: string;
}

export interface QuizAttempt {
  id?: string;
  userId: string;
  subtopicName: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  difficulty: 'easy' | 'medium' | 'hard'; // 👈 NEW FIELD
  results: AttemptResult[]; 
}

export async function saveAttempt(attempt: Omit<QuizAttempt, 'id'>) {
  try {
    await addDoc(collection(db, 'attempts'), attempt);
  } catch (error) {
    console.error("Error saving history:", error);
  }
}

// ... (keep getUserHistory and fetchReviewQuestions the same)
export async function getUserHistory(userId: string) {
  try {
    const q = query(
      collection(db, 'attempts'), 
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as QuizAttempt[];
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

export async function fetchReviewQuestions(results: AttemptResult[]) {
  if (!results || results.length === 0) return [];
  
  try {
    const promises = results.map(async (result) => {
      // Use the saved path directly!
      const docRef = doc(db, result.questionPath); 
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Question;
      }
      return null;
    });

    const fetchedQuestions = await Promise.all(promises);
    return fetchedQuestions.filter(q => q !== null) as Question[]; 
    
  } catch (error) {
    console.error("Error fetching review details:", error);
    return [];
  }
}