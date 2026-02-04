# 🎮 Edify XP & Gamification System Documentation

## 1. Overview
The Edify XP System is designed to reward **mastery**, **consistency (streaks)**, and **learning**. It uses a "Write-Fan-Out" architecture to ensure leaderboards are updated instantly, while maintaining a robust "Source of Truth" in the user's profile for real-time sidebar updates.

---

## 2. XP Scoring Logic

### A. Base Question Scores
Every correct answer awards XP based on the question's difficulty level.

| Difficulty | XP Awarded (Per Correct Answer) |
| :--- | :--- |
| **Easy** | **10 XP** |
| **Medium** | **15 XP** |
| **Hard** | **20 XP** |

### B. Attempt Rules (The Anti-Farming System)
To prevent students from repeatedly grinding the same test for points:

| Attempt Type | Condition | XP Reward |
| :--- | :--- | :--- |
| **1st Attempt** | Any Score | **Full Value** (Sum of correct answers) |
| **Retake (2+)** | Score > 60% | **+10 XP** (Flat "Practice Reward") |
| **Retake (2+)** | Score ≤ 60% | **0 XP** |

### C. Mastery Bonuses
Bonuses awarded only on the **1st Attempt** to encourage effort.

| Bonus Name | Condition | Reward | Description |
| :--- | :--- | :--- | :--- |
| **Perfectionist** | Score > 80% | **+20 XP** | High accuracy on first try. |
| **Speed Demon** | Score > 80% & Fast | **+10 XP** | Fluency and speed (<50% time limit). |

### D. Streak Bonuses
Rewards for consistent daily activity (based on UTC days).

| Milestone | Condition | Reward |
| :--- | :--- | :--- |
| **7-Day Streak** | 7 consecutive days | **+100 XP** |
| **30-Day Streak** | 30 consecutive days | **+500 XP** |

---

## 3. Database Architecture (Write-Fan-Out)

We calculate scores **once** upon submission and write them to multiple locations to optimize read costs.

### A. The Source of Truth (User Profile)
The primary data source for the Sidebar and Profile page.
* **Path:** `users/{userId}`
* **Key Fields:**
    * `totalXP`: The user's lifetime score.
    * `currentStreak`: Consecutive days active.
    * `lastActiveDate`: UTC Date string (e.g., "2026-02-04") to prevent double-counting.
    * `dailyHistory`: A map of the last 20 days of activity.

### B. The Rolling Window (Daily History)
To allow for activity charts without storing infinite data, we store a **Rolling Window** inside the user profile.
* **Structure:** Map/Object `{ "2026-02-01": 150, "2026-02-02": 40, ... }`
* **Limit:** Max **20 entries**.
* **Logic:** When saving, if keys > 20, the oldest date is deleted.

### C. Leaderboard Buckets (Fan-Out)
Optimized collections for ranking users without reading the entire user database.
1.  **Daily:** `leaderboards/day_YYYY_MM_DD/users/{userId}`
2.  **Weekly:** `leaderboards/week_YYYY_WW/users/{userId}`
3.  **Monthly:** `leaderboards/month_YYYY_MM/users/{userId}`
4.  **All Time:** `leaderboards/all_time/users/{userId}`
5.  **Class:** `classes/{classId}/leaderboard/{userId}`

---

## 4. Technical Implementation Logic

The entire submission process is wrapped in a single **Firestore Transaction**. This guarantees that XP, Streaks, and History are always in sync and prevents "race conditions" (e.g., submitting in two tabs at once).

### Execution Flow:

1.  **Transaction Start:**
    * **Lock & Read:** Read `users/{userId}` (Profile) and `attempts/{attemptId}` (History) simultaneously.
2.  **Streak Calculation (Timezone Safe):**
    * Get Current Date (`todayStr`) and Yesterday (`yesterdayStr`) in **UTC**.
    * Compare with `userData.lastActiveDate`.
    * **Logic:**
        * If `lastActive == yesterday` → **Streak + 1**.
        * If `lastActive == today` → **Streak Unchanged**.
        * Else → **Streak Reset to 1**.
3.  **XP Calculation:**
    * Calculate Base Score + Mastery Bonuses + Streak Bonuses.
4.  **History Update:**
    * Add new XP to `dailyHistory[todayStr]`.
    * Sort dates and prune if length > 20.
5.  **Atomic Writes:**
    * **Update Profile:** Set `totalXP`, `currentStreak`, `dailyHistory`, and `lastActiveDate`.
    * **Save Attempt:** Record the detailed submission results.
6.  **Post-Transaction Fan-Out:**
    * Update all 5 Leaderboard Buckets using `increment()`.

---

## 5. Security & Cost Efficiency

### Security
* **Transaction Locking:** Prevents "Double XP" exploits.
* **Server Timestamps:** Uses `serverTimestamp()` for ordering to prevent device clock manipulation.
* **UTC Standardization:** Streaks are calculated using `toISOString().split('T')[0]` to ensure consistency regardless of the user's local timezone.

### Cost Efficiency
* **Sidebar:** Uses `onSnapshot` on the single User Profile document. 
    * *Cost:* 1 Read on load + 1 Read per update (Push).
* **Leaderboard:** Fetches only the top 50 documents from the specific timeframe bucket. 
    * *Cost:* Fixed at ~50 reads per page load, regardless of user base size (10k+ users).