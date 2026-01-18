# MathMaster - Intelligent Educational Platform (Documentation)

## 📌 1. Project Overview
MathMaster is a trilingual (Uzbek, Russian, English) adaptive learning platform for Algebra and Geometry. It combines a **structured syllabus map** with **gamified testing**.

**Key Features:**
* **Trilingual Support:** Instant toggle between languages for all math questions.
* **Hybrid Architecture:** * *Navigation (Syllabus):* Local JSON (Instant load, SEO friendly).
    * *Data (Questions/Users):* Firebase Firestore (Real-time, scalable).
* **Adaptive Learning:** Questions get harder as the user improves (Easy -> Medium -> Hard).
* **Gamification:** XP system, Daily Streaks, Leaderboards, and "Locked" levels.
* **Cross-Platform Ready:** The Firebase backend is designed to support both this Web App (Next.js) and the future Mobile App (Jetpack Compose).

---

## 🏗️ 2. Technical Architecture

### Tech Stack
* **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS.
* **Math Rendering:** `react-latex-next` or `katex` (for rendering $\frac{a}{b}$).
* **Backend / Database:** Firebase Auth (Google/Email) & Firestore (NoSQL).
* **State Management:** React Context API (for global User Session).

### Database Schema (Firestore)
We use a NoSQL structure optimized for speed and "write-once, read-many" operations.

**A. `users` Collection** (User Profiles & Stats)
{
  "uid": "user_xyz123",
  "displayName": "Otabek",
  "email": "otabek@example.com",
  "photoURL": "https://...",
  "totalXP": 1500,
  "currentStreak": 3,           // Days in a row
  "lastStudyDate": "2026-01-16", // Used to calculate streak
  "progress": {
    "completedTopicIndex": 1,     // e.g., Finished Algebra (Index 1)
    "completedChapterIndex": 3,   // e.g., Finished Chapter 3
    "completedSubtopicIndex": 12  // Current position in the map
  },
  "dailyHistory": {               // For the Activity Heatmap
    "2026-01-14": 50,
    "2026-01-15": 100
  }
}



B. questions Collection (The Content)


{
  "id": "q_99",
  "subtopic": "Ifodalarni soddalashtirish", // The link to syllabus.json
  "difficulty": "medium",                 // easy | medium | hard
  "question": {
    "uz": "Soddalashtiring: $x^2 + x^2$",
    "ru": "Упростить: $x^2 + x^2$",
    "en": "Simplify: $x^2 + x^2$"
  },
  "options": { "A": "2x^2", "B": "x^4", "C": "2x", "D": "0" },
  "answer": "A"
}


C. attempts Collection (Detailed Analytics)


{
  "id": "att_001",
  "userId": "user_xyz123",
  "subtopicId": "sub_12",
  "score": 8,
  "maxScore": 10,
  "timestamp": 1705432000,
  "incorrectQuestions": ["q_99", "q_105"] // Quick reference for "Mistake Review"
}


📂 3. Complete File Structure & Explanations
my-math-app/
├── data/
│   ├── questions.json           # SOURCE: Raw dataset. Uploaded to Firebase via script.
│   └── syllabus.json            # SOURCE: The "Map". Used locally for navigation menus.
│
├── types/
│   └── index.ts                 # TypeScript Interfaces (User, Question, SyllabusItem).
│
├── lib/                         # CONFIG & UTILS
│   ├── firebase.ts              # Initializes Firebase App, Auth, and Firestore.
│   ├── AuthContext.tsx          # CLIENT: Global Provider. Checks if user is logged in.
│   ├── api.ts                   # SERVER: Reads 'syllabus.json' to generate menus.
│   └── uploadScript.js          # NODE: Run this once to push 'questions.json' to DB.
│
├── services/                    # BUSINESS LOGIC
│   ├── quizService.ts           # Logic: fetchQuestions(), calculateXP(), saveAttempt().
│   └── progressionService.ts    # Logic: unlockNextLevel(), updateStreak().
│
├── components/                  # UI COMPONENTS
│   ├── ui/                      # Atoms: Button, Card, Spinner.
│   ├── LatexRenderer.tsx        # Renders math equations safely.
│   ├── Sidebar.tsx              # Dashboard navigation (Dashboard, Syllabus, History).
│   ├── Navbar.tsx               # Top bar (User Avatar, Dark Mode toggle).
│   ├── QuizInterface.tsx        # The main testing UI (Question + A/B/C/D grid).
│   └── AuthGuard.tsx            # Wrapper that redirects unauthenticated users.
│
├── app/                         # NEXT.JS APP ROUTER
│   ├── layout.tsx               # Root Layout: Wraps entire app in <AuthProvider>.
│   ├── globals.css              # Global styles (Tailwind).
│   │
│   ├── (public)/                # GROUP: Marketing Pages (No Sidebar)
│   │   ├── layout.tsx           # Layout with Marketing Navbar.
│   │   ├── page.tsx             # Landing Page ("Join 1000+ Students").
│   │   └── auth/
│   │       ├── login/page.tsx   # Login Form.
│   │       └── signup/page.tsx  # Signup Form.
│   │
│   └── (student)/               # GROUP: Dashboard Pages (Protected)
│       ├── layout.tsx           # Layout with Sidebar. Checks Auth -> Redirects if null.
│       │
│       ├── dashboard/
│       │   └── page.tsx         # HOME: "Welcome [Name]", Daily Streak, "Resume" button.
│       │
│       ├── syllabus/
│       │   ├── page.tsx         # TOPIC LIST: Displays Algebra/Geometry.
│       │   └── [topicId]/       # DYNAMIC: Displays Chapters.
│       │       └── page.tsx     # LOGIC: Checks user progress. Locks future chapters (🔒).
│       │
│       ├── practice/
│       │   └── [subtopicId]/    # THE ARENA
│       │       └── page.tsx     # LOGIC: Fetches Qs. Adapts difficulty (Easy->Hard).
│       │
│       ├── history/
│       │   ├── page.tsx         # LIST: Past attempts (Date | Score).
│       │   └── [attemptId]/     # REVIEW: Shows exact mistakes for that attempt.
│       │       └── page.tsx
│       │
│       ├── leaderboard/
│       │   └── page.tsx         # RANKING: Fetches top 50 users by XP.
│       │
│       └── profile/
│           └── page.tsx         # SETTINGS: Change Name, Photo, Password.
│
└── public/
    └── images/                  # Static assets (Logo, illustrations).






## 🧠 4. Detailed Feature Logic

### A. The "Locking" System (Syllabus)
**Goal:** Prevent students from jumping to complex topics before finishing basics.

**Implementation:**
1.  **Frontend (`syllabus/page.tsx`):** Reads the `index` of each chapter from `syllabus.json`.
2.  **Comparison:** It compares the chapter's `index` with `user.progress.completedChapterIndex` (fetched from Firestore).
3.  **Visual Logic:**
    * `if (chapter.index <= user.progress)`: Show **Green Check** ✅ (Done).
    * `if (chapter.index == user.progress + 1)`: Show **Open/Blue** 🔵 (Current Level).
    * `if (chapter.index > user.progress + 1)`: Show **Gray Padlock** 🔒 (Locked).

### B. Adaptive Difficulty (Practice Mode)
**Goal:** Keep students in the "Flow State" (not too easy, not too hard).

**Implementation (`practice/[id]/page.tsx`):**
1.  **Initial Load:** Fetch all questions for the specific subtopic.
2.  **Phase 1:** Present 3 `easy` questions.
3.  **Transition:** If 3/3 correct $\rightarrow$ User sees "Level Up!" modal $\rightarrow$ Switch to `medium`.
4.  **Phase 2:** Present `medium` questions. If correct $\rightarrow$ Switch to `hard`.
5.  **XP Calculation:** * Easy = 10 XP
    * Medium = 20 XP
    * Hard = 30 XP

### C. Streak & XP Logic
**Goal:** Habit formation and daily engagement.

**Implementation (`services/progressionService.ts`):**
1.  **Trigger:** Called immediately when a quiz is submitted.
2.  **Streak Check:**
    * Retrieve `user.lastStudyDate` from DB.
    * **Is it Yesterday?** $\rightarrow$ `currentStreak + 1` (Streak continues).
    * **Is it Today?** $\rightarrow$ No change (Already tracked).
    * **Is it Older?** $\rightarrow$ Reset `currentStreak = 1` (Streak broken).
3.  **XP Update:**
    * Atomic increment: `totalXP: increment(50)`.
    * Daily History update: `dailyHistory["2026-01-16"]: increment(50)` (Used for Heatmap).