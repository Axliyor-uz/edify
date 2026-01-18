// services/quizService.ts
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PathIds } from '@/lib/api';

export async function fetchQuestions(ids: PathIds, difficulty: 'easy' | 'medium' | 'hard') {
  // Map difficulty word to ID: 1, 2, 3
  let diffIndex = "1";
  if (difficulty === 'medium') diffIndex = "2";
  if (difficulty === 'hard') diffIndex = "3";

  try {
    // ⚠️ THIS MUST MATCH YOUR PYTHON SCRIPT PATHS EXACTLY
    // Path: /questions/01/t/1/c/10/s/04/d/1/q
    
    const questionsRef = collection(
      db,
      "questions",    // Root
      ids.subjectId,  // "01"
      "t",            // Shortcut folder
      ids.topicId,    // "1"
      "c",            // Shortcut folder
      ids.chapterId,  // "10"
      "s",            // Shortcut folder
      ids.subtopicId, // "04"
      "d",            // Shortcut folder
      diffIndex,      // "1"
      "q"             // Actual questions collection
    );

    const snapshot = await getDocs(questionsRef);
    
    // Return data with ID attached
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error("🔥 Error fetching from deep path:", error);
    return [];
  }
}