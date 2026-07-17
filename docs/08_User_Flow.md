# SkillVerse — User Flow & Screen Breakdown

> **Version**: 1.0 — MVP  
> **Last Updated**: 2026-07-17  

---

## 1. High-Level User Flow

```
┌──────────────────┐
│   Landing Page   │ ← Not authenticated
└────────┬─────────┘
         │ Click "Get Started" or "Sign In"
         ▼
┌──────────────────┐
│  Auth (Login /   │
│    Register)     │
└────────┬─────────┘
         │ Authenticated
         ▼
┌──────────────────┐    First time?    ┌──────────────────────┐
│  Check Profile   │──────────────────▶│  Goal Onboarding     │
└────────┬─────────┘                   └──────────┬───────────┘
         │ Profile exists                         │ Submit goal
         │                                        ▼
         │                             ┌──────────────────────┐
         │                             │  AI Team Formation   │
         │                             │  (Processing Screen) │
         │                             └──────────┬───────────┘
         │                                        │ Pipeline complete
         │                                        ▼
         ▼                             ┌──────────────────────┐
┌──────────────────┐                   │  Roadmap View        │
│  Main Dashboard  │◀──────────────────│  (First-time intro)  │
└──────┬───────────┘                   └──────────────────────┘
       │
       ├──▶ Daily Planner
       ├──▶ Resources
       ├──▶ Projects
       ├──▶ Quizzes
       └──▶ Progress Dashboard
```

---

## 2. Screen-by-Screen Breakdown

---

### Screen 1: Landing Page (`/`)

**Purpose**: Convert visitors to sign-ups.

**Sections**:
1. **Hero Section**
   - Headline: "Skill Your Way"
   - Subheading: "Tell us your goal. Our AI team builds your entire learning journey."
   - CTA Button: "Start Learning Free →"
   - Background: Dark with animated particle/gradient effect

2. **How It Works Section**
   - 4-step visual flow: Input Goal → AI Builds Plan → Follow Daily Tasks → Achieve Goal

3. **Features Section**
   - 6 feature cards (icons + descriptions): Goal Analyzer, Roadmap, Daily Planner, Resources, Projects, Quizzes

4. **Social Proof Section** *(mock data for MVP)*
   - 3 user testimonial cards

5. **Final CTA Section**
   - "Ready to skill up?" + "Get Started" button

**Edge Cases**:
- Authenticated user visiting `/` → redirect to `/dashboard`

---

### Screen 2: Authentication (`/login`, `/register`)

**Purpose**: Secure user auth with minimal friction.

**Components**:
- Email + Password form
- Google OAuth button ("Continue with Google")
- Toggle between Login and Register
- "Forgot Password" link (triggers Supabase password reset email)
- Form validation (inline, on blur)

**States**:
- Default form
- Loading (spinner on submit button)
- Error (inline error messages per field)
- Success → redirect to `/onboarding` (first time) or `/dashboard` (returning)

**Edge Cases**:
- Already logged-in user → redirect away from auth pages
- Network error → show toast: "Connection failed. Please try again."
- Invalid credentials → "Incorrect email or password"
- Email not confirmed → show confirmation email re-send option

---

### Screen 3: Goal Onboarding (`/onboarding`)

**Purpose**: Capture the user's learning intent.

**Flow**:

**Step 1 — Goal Input**:
- Large textarea: "What do you want to learn?"
- Placeholder: "e.g., I want to become a backend developer using Node.js in 3 months"
- Character counter (10–500)
- Continue button

**Step 2 — Context (Optional)**:
- Radio group: "My current skill level" (Beginner / Intermediate / Advanced)
- Number input: "Hours per week available"
- Number input: "Target deadline (weeks)"
- "Skip" link (uses defaults)
- "Analyze My Goal →" button

**Step 3 — AI Analysis / Clarification**:
- If `confidence score ≥ 0.7`:
  - Show goal summary card with detected domain, sub-topics, estimated timeline
  - CTA: "Looks good! Build My Roadmap →"
- If `confidence score < 0.7`:
  - Show 3 clarification questions as text inputs or dropdowns
  - "Submit Clarifications →" button

**Loading State**:
- Full-screen animated skeleton with text: "Analyzing your goal..."
- Agents shown as pulsing dots (one by one as they're invoked)

**Edge Cases**:
- User has already completed onboarding → redirect to `/roadmap`
- LLM timeout → show retry button: "AI took too long. Try again?"
- Unclear goal → loop back to clarification step

---

### Screen 4: AI Team Formation (Modal/Overlay after Onboarding)

**Purpose**: Visualize the AI building the user's plan — creates engagement + trust.

**UI**:
- Full-screen dark overlay
- Title: "Assembling your AI team..."
- 7 agent cards slide in sequentially (500ms apart):
  - Agent name + icon + one-line description + "Active" badge
- Progress bar at bottom: "Building your roadmap..."
- After all agents appear: "Your roadmap is ready! 🚀" → auto-navigate to `/roadmap`

**On Error**:
- Replace progress bar with error state: "Something went wrong. Retry?"

---

### Screen 5: Roadmap View (`/roadmap`)

**Purpose**: Show the full learning journey at a glance.

**Layout (Desktop)**:
- Horizontal scrollable timeline with milestone cards
- Each card: Milestone number, title, duration, topic pills, status badge, progress ring
- Click milestone card → expand panel (right side) showing:
  - Full description + learning objectives
  - Topic list with linked resources
  - Project card (mini)
  - "Start Milestone" button → marks in_progress

**Layout (Mobile)**:
- Vertical linear list of milestone cards
- Tap to expand inline

**Milestone Status Colors**:
- `not_started`: Grey
- `in_progress`: Blue glow
- `completed`: Green with checkmark

**Edge Cases**:
- Roadmap not yet generated → show skeleton loader
- User marks milestone complete out of order → warn: "Complete previous milestones first?" (warning, not block)

---

### Screen 6: Daily Planner (`/planner`)

**Purpose**: Show today's learning tasks.

**Layout**:
- Top: Date picker (prev/next day navigation), streak badge, "X of Y tasks done today"
- Middle: Task card list (sorted by task_type priority)
  - Each task: Title, type icon (📖 Read / 🎬 Watch / 💻 Practice / 🔨 Build / ❓ Quiz), estimated time, checkbox
  - Checkbox: mark complete (optimistic UI update)
- Right sidebar (desktop): Weekly task completion heatmap
- Bottom: "View all tasks" toggle to see full roadmap task list

**Task Card States**:
- Default: white border
- Completed: green border + strikethrough text
- Overdue: (not in MVP, tracked for future)

**Edge Cases**:
- No tasks today (weekend gap or plan complete) → motivational empty state with the next task date
- Planner not yet generated → skeleton + "Generating your plan..." message
- Streak reset → gentle notification: "You lost your streak, but you're back! 🔥 Start a new one."

---

### Screen 7: Resources (`/resources`)

**Purpose**: Curated study materials per topic.

**Layout**:
- Filter sidebar: by Milestone, by Topic, by Type (Video/Article/Course/Documentation)
- Resource card grid:
  - Title, type badge, estimated time, difficulty pill, bookmark button
  - Click → opens URL in new tab

**Edge Cases**:
- No resources for selected filter → "No resources found. Try a different filter."
- Resource URL broken (discovered by user) → in MVP, no validation; future feature

---

### Screen 8: Projects (`/projects`)

**Purpose**: Guide hands-on learning through capstone projects.

**Layout**:
- Project card per milestone (6 cards max in MVP)
  - Title, objective, tech stack pills, status badge, progress steps
- Expand card → full project detail:
  - Description, objective, deliverable
  - Numbered step list (click step to expand description + "Reveal Hint" button)
  - Mini chat panel at the bottom: "Ask your Project Mentor"

**Chat Panel**:
- Input box + Send button
- Shows conversation history (scrollable)
- AI responses streamed (typed-out effect)

**Edge Cases**:
- Project already completed → gray out but keep accessible for reference
- Chat API timeout → "Mentor is thinking... Try again?"

---

### Screen 9: Quizzes (`/quiz`)

**Purpose**: Test and reinforce knowledge per topic.

**Layout**:
- Topic selector (tabs or dropdown, one per milestone topic)
- Start Quiz button → opens Quiz Modal

**Quiz Modal**:
- Progress indicator: Question 3 of 7
- Question text (large font)
- Answer options (clickable tiles)
- After click → immediate feedback:
  - Correct: green highlight + explanation
  - Wrong: red highlight on selected + green on correct + explanation
- "Next Question →" button
- Final screen: Score card (X/Y), pass/fail badge, list of flagged questions for review

**Edge Cases**:
- Quiz already completed → show last score with option to retake
- Quiz generation failed → "Quiz unavailable for this topic. Try again."

---

### Screen 10: Progress Dashboard (`/progress`)

**Purpose**: Motivate and show the learner their overall journey.

**Layout**:
- Top row: Stat cards (Completion %, Current Streak, Milestones Done, Tasks Today)
- Middle: Weekly Activity Heatmap (GitHub-style, 52 weeks)
- Bottom left: Milestone completion list with completion dates
- Bottom right: Quiz score history per topic

**Edge Cases**:
- No activity yet → show encouraging empty state: "Your journey starts today!"
- Zero streak after first login → streak = 0 (not shown as broken)

---

## 3. Navigation Structure

```
Sidebar Navigation (authenticated):
  ├── 🗺️ Roadmap
  ├── 📅 Daily Planner        (badge: pending tasks today)
  ├── 📚 Resources
  ├── 🔨 Projects
  ├── ❓ Quizzes
  └── 📊 Progress
  
  Bottom:
  └── 👤 Profile / Logout
```

---

## 4. Global States & Error Handling

| State | Component | Behavior |
|-------|-----------|----------|
| Loading | Any async page | Skeleton screens, not spinners |
| Error | API failure | Toast notification + retry button |
| Empty | No data yet | Illustrated empty state with CTA |
| Success | Task complete etc. | Brief green toast |
| Streak milestone | 7-day streak | Celebration animation overlay |
