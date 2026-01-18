my-math-app/
├── data/
│   ├── questions.json           # Raw dataset (source for Firebase upload)
│   └── syllabus.json            # Navigation structure (Topic -> Chapter -> Subtopic)
│
├── types/
│   └── index.ts                 # TypeScript Definitions (User, Question, QuizResult)
│
├── lib/                         # Core Configuration
│   ├── firebase.ts              # Firebase initialization (Auth & Firestore export)
│   ├── AuthContext.tsx          # React Context to detect if User is Logged In
│   ├── utils.ts                 # Small helpers (e.g., formatDate, calculatePercentage)
│   └── uploadScript.js          # (Run once) Node script to upload 'questions.json' to DB
│
├── services/                    # BUSINESS LOGIC (The Brains 🧠)
│   ├── quizService.ts           # Functions: fetchQuestions(), submitQuizResult()
│   │                            # (Handles saving attempt, updating streak, & aggregate stats)
│   └── userService.ts           # Functions: getUserProfile(), updateUserAvatar()
│
├── components/                  # REUSABLE UI
│   ├── ui/                      # Atoms: Button.tsx, Card.tsx, ProgressBar.tsx
│   ├── LatexRenderer.tsx        # Component to display math equations (KaTeX)
│   ├── Sidebar.tsx              # Left navigation menu (Dashboard, History links)
│   ├── Navbar.tsx               # Top bar (Mobile menu trigger, User Avatar)
│   ├── QuizInterface.tsx        # The active test UI (Question + A/B/C/D buttons)
│   ├── ResultCard.tsx           # Shows "You got 8/10!" summary after quiz
│   └── Heatmap.tsx              # Grid showing activity over the last year
│
├── app/
│   ├── layout.tsx               # Root Layout (Wraps app in AuthProvider)
│   ├── globals.css              # Global styles (Tailwind imports)
│   │
│   ├── (public)/                # GROUP 1: Public Pages (Marketing)
│   │   ├── layout.tsx           # Public Layout (Simple Navbar)
│   │   ├── page.tsx             # Landing Page ("Join 1000+ Students")
│   │   └── auth/
│   │       ├── login/page.tsx   # Sign In Page
│   │       └── signup/page.tsx  # Registration Page
│   │
│   └── (student)/               # GROUP 2: Student Dashboard (Protected)
│       ├── layout.tsx           # The Guard: Redirects to Login if no User. Renders Sidebar.
│       │
│       ├── dashboard/
│       │   └── page.tsx         # Main View: Shows "Current Streak", "Weakest Topic", "Resume"
│       │
│       ├── syllabus/
│       │   ├── page.tsx         # Topic List (Algebra, Geometry)
│       │   └── [topicId]/          #Checks 'user.progress' to show 🔒 or 🔓
│       │       └── page.tsx     # Chapter List (Clicking starts a quiz)
│       │
│       ├── practice/
│       │   └── [subtopicId]/    # The Exam Room
│       │       └── page.tsx     # 1. Fetches Questions
│       │                        # 2. Renders <QuizInterface />
│       │                        # 3. On Finish -> Calls quizService.submitQuizResult()
│       │                        # 4. Handles the "Easy -> Hard" progression logic
│       ├── history/
│       │   ├── page.tsx         # List of all past attempts (Date | Score | Topic)
│       │   └── [attemptId]/     # Detailed Review
│       │       └── page.tsx     # Shows exactly which questions were wrong in that specific attempt
│       │
│       ├── leaderboard/
│       │   └── page.tsx         # Ranking Table (fetches 'users' collection sorted by XP)
│       │
│       └── profile/
│           └── page.tsx         # User Settings (Name, Photo, Reset Password)
│
│
└── services/
|    └── progressionService.ts  # [NEW] Handles XP math and unlocking logic
|
|
└── public/
    ├── icons/                   # Custom topic icons (algebra.svg, geometry.svg)
    └── images/                  # Avatars, Logo









# 🗺️ MathMaster Developer Roadmap

Follow this step-by-step guide to build the platform from scratch to launch in 5 weeks.

---

## 📅 Phase 1: Foundation & Authentication (Week 1)
> **Goal:** A working Next.js app where users can Sign Up and Log In.

* [ ] **1. Project Setup**
    * Initialize Next.js: `npx create-next-app@latest my-math-app --typescript --tailwind --eslint`
    * Clean up default files (`page.tsx`, `globals.css`).
    * Install core libraries: `firebase`, `react-latex-next`, `lucide-react`.
* [ ] **2. Firebase Config**
    * Create a project in [Firebase Console](https://console.firebase.google.com/).
    * Enable **Authentication** (Google & Email/Password providers).
    * Enable **Firestore Database** (Start in Test Mode).
    * Create `.env.local` and add API keys.
* [ ] **3. Authentication System**
    * Create `lib/firebase.ts`.
    * Build `lib/AuthContext.tsx` to handle user state.
    * Create UI: `app/(public)/auth/login/page.tsx`.
* [ ] **4. App Layouts**
    * Create `app/(student)/layout.tsx` with the **Auth Guard** (redirect if not logged in).
    * Build the `Sidebar.tsx` component.

---

## 📅 Phase 2: Data Pipeline & Syllabus (Week 2)
> **Goal:** Display the "Map" (Syllabus) and get content into the database.

* [ ] **1. Data Preparation**
    * Place `syllabus.json` and `questions.json` in the `data/` folder.
    * Define TypeScript interfaces in `types/index.ts` (`Topic`, `Question`).
* [ ] **2. Database Seeding**
    * Write `lib/uploadScript.js`.
    * Run the script to push all questions from JSON → Firestore.
    * Verify data exists in Firebase Console.
* [ ] **3. Syllabus UI (The Map)**
    * Create `app/(student)/syllabus/page.tsx`.
    * Render the list of Chapters/Subtopics from `syllabus.json`.
    * *Note:* Don't worry about "locking" yet; just make the links work.

---

## 📅 Phase 3: The Quiz Engine (Week 3)
> **Goal:** Users can take a test, see math equations, and get a score.

* [ ] **1. Math Rendering**
    * Create `components/LatexRenderer.tsx`.
    * Test it with a complex equation: `\frac{-b \pm \sqrt{b^2-4ac}}{2a}`.
* [ ] **2. Quiz Logic (The Hard Part)**
    * Create `app/(student)/practice/[subtopicId]/page.tsx`.
    * Write `fetchQuestions()` in `services/quizService.ts`.
    * Build the **Adaptive State Machine**:
        1.  Start with filtered **"Easy"** questions.
        2.  If 3 correct → Switch state to **"Medium"**.
* [ ] **3. Result Screen**
    * Build a summary component showing: *"You got 8/10 Correct! +50 XP"*.

---

## 📅 Phase 4: Gamification & Save System (Week 4)
> **Goal:** Make it addictive. Save progress, handle streaks, and lock chapters.

* [ ] **1. User Profile in DB**
    * Update `AuthContext` to fetch extra user data (XP, Level) from Firestore `users` collection.
* [ ] **2. Progression Service**
    * Write `updateUserProgress()`: Increments XP and updates `completedSubtopicIndex`.
    * Write `checkStreak()`: Compares `lastStudyDate`.
* [ ] **3. Implement Locking**
    * Go back to `syllabus/page.tsx`.
    * Add the condition: `if (index > user.progress) return <LockedIcon />`.
* [ ] **4. History Page**
    * Create `app/(student)/history/page.tsx` to list past attempts from Firestore.

---

## 📅 Phase 5: Polish & Deployment (Week 5)
> **Goal:** Make it look professional and go live.

* [ ] **1. Dashboard UI**
    * Fill `dashboard/page.tsx` with real data (Current Streak, Total XP).
    * Add the **"Resume Learning"** button (links to the highest unlocked subtopic).
* [ ] **2. Leaderboard**
    * Create `leaderboard/page.tsx`.
    * Query Firestore: `collection('users').orderBy('totalXP', 'desc').limit(50)`.
* [ ] **3. Loading States**
    * Add **"Skeleton Screens"** (gray shimmering boxes) while fetching data so the screen isn't blank.
* [ ] **4. Deployment**
    * Push code to **GitHub**.
    * Connect repo to **Vercel**.
    * Add Environment Variables in Vercel settings.
    * **Launch! 🚀**





