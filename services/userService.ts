import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';

// --- 1. Define the Full User Structure ---
export interface UserProgress {
  completedTopicIndex: number;
  completedChapterIndex: number;
  completedSubtopicIndex: number;
}

export interface UserLocation {
  country: string;
  region: string;
  district: string;
}

export interface UserEducation {
  institution: string;
  grade: string; // "school_9", "uni_1", etc.
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string; 
  displayName: string;
  phone?: string;   
  birthDate?: string; 
  location?: UserLocation; 
  education?: UserEducation; 
  
  // Gamification (Student Only)
  totalXP: number;
  currentStreak: number;
  lastStudyDate: string | null; 
  dailyHistory: Record<string, number>; 
  progress: UserProgress;
  dailyGoal?: number; // Added for Dashboard

  // Metadata
  createdAt?: string;
  role?: 'student' | 'teacher' | 'admin'; // 👈 UPDATED: Added 'teacher'
  
  // Teacher Specific (Optional)
  createdTests?: string[];
  verifiedTeacher?: boolean;
}

// --- 2. Helper: Get Today's Date ---
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// --- 3. Check Username Availability ---
export async function checkUsernameUnique(username: string): Promise<boolean> {
  const normalizedUsername = username.toLowerCase();
  const ref = doc(db, 'usernames', normalizedUsername);
  const snap = await getDoc(ref);
  return !snap.exists(); 
}

// --- 4. Get User Profile ---
export async function getUserProfile(uid: string, email?: string, displayName?: string) {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }
  return null;
}

// --- 5. The Smart Save Function (XP + Streak + History) ---
// *Note: This is mostly for Students. Teachers don't usually earn XP.*
export async function updateUserStats(uid: string, xpEarned: number, currentIds: { topicId: string, chapterId: string, subtopicId: string }) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  const userData = userSnap.data() as UserProfile;

  // Safety check: Don't run streak logic for teachers if they somehow play a game
  if (userData.role === 'teacher') return;

  const today = getTodayString();
  const lastDate = userData.lastStudyDate;

  // A. CALCULATE STREAK
  let newStreak = userData.currentStreak;
  
  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // If played yesterday, streak continues. If not, reset to 1 (today).
    if (lastDate === yesterdayString) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  // B. UPDATE PROGRESS
  // Ensure we don't crash if progress is undefined
  let newProgress = userData.progress || { completedTopicIndex: 0, completedChapterIndex: 0, completedSubtopicIndex: 0 };
  
  const currentTopicIdx = parseInt(currentIds.topicId);
  const currentChapterIdx = parseInt(currentIds.chapterId);
  const currentSubtopicIdx = parseInt(currentIds.subtopicId);

  // Simple "Is this further than before?" check
  if (currentTopicIdx > newProgress.completedTopicIndex || 
     (currentTopicIdx === newProgress.completedTopicIndex && currentChapterIdx > newProgress.completedChapterIndex) ||
     (currentTopicIdx === newProgress.completedTopicIndex && currentChapterIdx === newProgress.completedChapterIndex && currentSubtopicIdx > newProgress.completedSubtopicIndex)) {
       newProgress = {
         completedTopicIndex: currentTopicIdx,
         completedChapterIndex: currentChapterIdx,
         completedSubtopicIndex: currentSubtopicIdx
       };
  }

  // C. PERFORM UPDATE
  await updateDoc(userRef, {
    totalXP: increment(xpEarned),
    currentStreak: newStreak,
    lastStudyDate: today,
    [`dailyHistory.${today}`]: increment(xpEarned),
    progress: newProgress
  });
}