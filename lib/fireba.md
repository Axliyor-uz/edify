/* ================================================================================
  WASPAI EDUCATION PLATFORM - DATABASE SCHEMA DOCUMENTATION (UPDATED)
================================================================================
  CORE STRATEGIES:
  1. SNAPSHOTS: Tests save a full copy of questions to prevent history changes.
  2. ECONOMIST ROSTER: Classes store a denormalized 'roster' map for 0-read loading,
     plus a 'studentIds' array for background querying.
  3. SUB-COLLECTIONS: Assignments & Requests live inside Classes to keep data organized.
  4. UNIFIED USERS: Students and Teachers share the 'users' collection but have
     different role-specific fields.
================================================================================
*/

/* -------------------------------------------------------------------------- */
/* 1. IDENTITY & USERS                                                        */
/* -------------------------------------------------------------------------- */

// COLLECTION: /users
// DOC ID: <auth_uid>
// PURPOSE: Stores profile data. Private to the user (but readable by class teachers).
{
  "uid": "user_123",
  "email": "teacher@example.com",
  "username": "elyor_math",
  "displayName": "Professor Elyor",
  "phone": "+998 (90) 123-45-67",
  "birthDate": "1990-01-01",
  "role": "teacher",          // "teacher" | "student"
  "createdAt": "timestamp",
  
  // 🏫 Institution (Root Level)
  "institution": "New Uzbekistan University", 
  
  // 📍 Location (Nested Map)
  "location": {
    "country": "Uzbekistan",
    "region": "Tashkent City",
    "district": "Yunusabad"
  },

  // 🎓 STUDENT SPECIFIC FIELDS (If role == 'student')
  "grade": "school_9",        // e.g., "school_9", "uni_2"
  "level": 5,                 // Gamification Level
  "totalXP": 1250,            // Gamification XP
  "currentStreak": 3,         // Daily streak count
  "dailyHistory": {           // Heatmap data
    "2026-01-20": 50 
  },
  "progress": {               // Learning path tracking
     "completedTopicIndex": 2,
     "completedChapterIndex": 1
  },

  // 👨‍🏫 TEACHER SPECIFIC FIELDS (If role == 'teacher')
  "subject": "Mathematics",
  "verifiedTeacher": true,
  "createdTests": [           // List of Test IDs authored
    "test_abc_123",
    "test_xyz_987"
  ]
}

// COLLECTION: /usernames
// DOC ID: <username_string> (e.g. "elyor_math")
// PURPOSE: Global lookup table to guarantee unique usernames.
{
  "uid": "user_123"
}

/* -------------------------------------------------------------------------- */
/* 2. CONTENT LIBRARY                                                         */
/* -------------------------------------------------------------------------- */

// COLLECTION: /questions
// DOC ID: <auto-id>
// PURPOSE: The central bank of all questions. Read-only for app users.
{
  "text": "Solve for x: 2x + 4 = 10",
  "difficulty": "Easy",
  "tags": ["algebra", "linear_eq"],
  "options": {
    "A": "3",
    "B": "4",
    "C": "5"
  },
  "answer": "A",
  "solutions": [
    { "steps": ["2x = 6", "x = 3"] }
  ]
}

// COLLECTION: /custom_tests
// DOC ID: <auto-id>
// PURPOSE: Teacher-created exams. Uses SNAPSHOT strategy (copies questions).
{
  "teacherId": "user_123",
  "teacherName": "Professor Elyor",
  "title": "Midterm Algebra",
  "status": "active",         // "active" | "archived"
  "createdAt": "timestamp",
  
  // Settings
  "accessCode": "MATH-99",    // 6-char code
  "duration": 45,             // Minutes (0 = unlimited)
  "shuffle": true,            // Randomize order
  "showResults": false,       // Reveal answers at end?
  "questionCount": 15,

  // 📸 THE SNAPSHOT ARRAY
  // Full question objects are copied here. 
  "questions": [
    {
      "id": "q_999",
      "text": "Solve for x...",
      "options": {...},
      "answer": "A",
      "uiDifficulty": "Easy",
      "solutions": [...]
    },
    // ... more questions
  ]
}

/* -------------------------------------------------------------------------- */
/* 3. CLASSROOM MANAGEMENT                                                    */
/* -------------------------------------------------------------------------- */

// COLLECTION: /classes
// DOC ID: <auto-id>
// PURPOSE: The main classroom container.
{
  "title": "Grade 9 - Group A",
  "description": "Monday Morning Session",
  "teacherId": "user_123",
  "joinCode": "ABC-XYZ",      // Unique code for students to find this class
  "createdAt": "timestamp",

  // 1. QUERY ARRAY (The "Backend" List)
  // Used for: "Find all classes where studentId == X"
  "studentIds": [
    "student_A",
    "student_B"
  ],

  // 2. ECONOMIST MAP (The "Frontend" List)
  // Used for: Instant display of names/avatars without extra reads.
  // Updated via Cloud Function if a user changes their profile.
  "roster": {
    "student_A": {
       "displayName": "Umidjon",
       "username": "umidjon_dev",
       "photoURL": "https://..."
    },
    "student_B": {
       "displayName": "Aziz",
       "username": "aziz_pro",
       "photoURL": null
    }
  }
}

// SUB-COLLECTION: /classes/{classId}/requests
// DOC ID: <student_uid>
// PURPOSE: The "Waiting Room" for students who used the Join Code.
{
  "studentName": "Umidjon",
  "studentUsername": "umidjon_dev",
  "photoURL": null,
  "status": "pending",
  "requestedAt": "timestamp"
}

// SUB-COLLECTION: /classes/{classId}/assignments
// DOC ID: <auto-id>
// PURPOSE: Connects a Test to a Class with specific rules.
{
  "testId": "custom_test_555",
  "testTitle": "Midterm Algebra", // Copied for display speed
  "questionCount": 15,
  "description": "Read Chapter 4 first.",
  
  // 📅 Scheduling
  "openAt": "timestamp",      // Start time (Optional)
  "dueAt": "timestamp",       // Deadline (Optional)
  
  // 🎯 Targeting
  // Can be the string "all" OR an array of specific Student UIDs
  "assignedTo": "all",        // or ["student_A", "student_B"]
  
  "createdAt": "timestamp"
}

/* -------------------------------------------------------------------------- */
/* 4. ANALYTICS & RESULTS                                                     */
/* -------------------------------------------------------------------------- */

// COLLECTION: /attempts
// DOC ID: <auto-id>
// PURPOSE: Stores the result when a student finishes a test.
{
  "classId": "class_999",        // Links to the Class
  "assignmentId": "assign_888",  // Links to the specific Assignment
  "testId": "custom_test_555",   // Links to the Test Content
  "userId": "student_A",         // Links to the Student
  
  "score": 12,                   // Number correct
  "totalQuestions": 15,
  "percentage": 80,
  
  "completedAt": "timestamp",
  
  // Detailed Record
  "answers": {
    "q_1": "A",                  // Student chose A
    "q_2": "C"                   // Student chose C
  }
}

/* -------------------------------------------------------------------------- */
/* 5. SECURITY RULES SUMMARY                                                  */
/* -------------------------------------------------------------------------- */

/*
  /users        -> Read: Auth Users | Write: Owner Only
  /usernames    -> Read: Public     | Write: Auth Users
  /questions    -> Read: Public     | Write: Admin Only
  /custom_tests -> Read: Auth Users | Write: Teacher (Owner)
  /classes      -> Read: Auth Users | Write: Teacher (Owner)
  /classes/requests    -> Read: Class Members | Write: Student
  /classes/assignments -> Read: Class Members | Write: Teacher
  /attempts     -> Read: Teacher/Owner | Write: Student
*/