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
  grade: string;
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
  totalXP: number;
  currentStreak: number;
  lastStudyDate: string; 
  dailyHistory: Record<string, number>; 
  progress: UserProgress;
  createdAt?: string;
  role?: 'student' | 'admin';
}

// --- 2. Helper: Get Today's Date ---
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// --- 3. Check Username Availability (UPDATED: PRO WAY) ---
export async function checkUsernameUnique(username: string): Promise<boolean> {
  // Normalize to lowercase to ensure "Umidjon" and "umidjon" are treated as the same
  const normalizedUsername = username.toLowerCase();
  
  // Direct Lookup in 'usernames' collection (Fast, Cheap, Secure)
  const ref = doc(db, 'usernames', normalizedUsername);
  const snap = await getDoc(ref);
  
  // If snapshot exists, the username is taken. If NOT exists, it's free.
  return !snap.exists(); 
}

// --- 4. Get User Profile ---
export async function getUserProfile(uid: string) {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }
  return null;
}

// --- 5. The Smart Save Function (XP + Streak + History) ---
export async function updateUserStats(uid: string, xpEarned: number, currentIds: { topicId: string, chapterId: string, subtopicId: string }) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  const userData = userSnap.data() as UserProfile;

  const today = getTodayString();
  const lastDate = userData.lastStudyDate;

  // A. CALCULATE STREAK
  let newStreak = userData.currentStreak;
  
  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayString) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  // B. UPDATE PROGRESS
  const currentTopicIdx = parseInt(currentIds.topicId);
  const currentChapterIdx = parseInt(currentIds.chapterId);
  const currentSubtopicIdx = parseInt(currentIds.subtopicId);

  let newProgress = { ...userData.progress };
  
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