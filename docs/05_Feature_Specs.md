# SkillVerse — Feature Specifications

> **Version**: 1.0 — MVP  
> **Last Updated**: 2026-07-17  
> Detailed component-level specs for each of the 8 MVP features.

---

## Feature 1: Smart Goal Onboarding

### Component: `GoalOnboardingWizard`

A multi-step wizard with 3 stages:

**Step 1: Goal Input**

| Property | Detail |
|----------|--------|
| Component | `GoalInput` (`components/onboarding/GoalInput.tsx`) |
| Input type | `<textarea>` with auto-resize |
| Validation | min 10 chars, max 500 chars; validated on blur and on submit |
| Character counter | Live counter shown bottom-right `(123/500)` |
| CTA | "Continue →" button (disabled if invalid) |
| Placeholder | `"I want to learn Python for data science in 2 months"` |

**Step 2: Context Form**

| Property | Detail |
|----------|--------|
| Component | `GoalContextForm` (`components/onboarding/GoalContextForm.tsx`) |
| Skill level | Radio group: Beginner / Intermediate / Advanced (pre-selected based on goal text inference) |
| Hours/week | Number input (1–40), default: 7 |
| Deadline (weeks) | Number input (1–52), optional |
| Skip option | "I'll let AI decide →" link skips this step with defaults |
| CTA | "Analyze My Goal →" |

**Step 3: AI Processing / Results**

| State | UI |
|-------|-----|
| Loading | Spinner + animated text cycle: "Analyzing...", "Understanding your goal...", "Preparing your plan..." |
| High confidence (≥0.7) | Green "Goal Understood" card with: domain, sub_topics pills, estimated timeline, difficulty badge |
| Low confidence (<0.7) | Yellow "Help me understand" card with 3 clarification questions as text inputs |
| Error | Red "Something went wrong" with retry button |

**State Machine**:
```
IDLE → GOAL_SUBMITTED → ANALYZING → 
  → CONFIRMED (confidence ≥ 0.7) → [proceed to Team Formation]
  → NEEDS_CLARIFICATION (confidence < 0.7) → CLARIFICATION_SUBMITTED → ANALYZING → CONFIRMED
  → ERROR → IDLE (retry)
```

---

## Feature 2: Dynamic AI Team Formation

### Component: `AgentTeamScreen`

Displayed as a full-screen animated screen between Goal Onboarding and Roadmap View.

**Agent Card Specification**:

| Property | Detail |
|----------|--------|
| Width | 140px (desktop), full-width on mobile |
| Height | 160px |
| Animation | Slide in from bottom with fade, 500ms apart per agent |
| Content | Agent emoji icon, Agent name, 1-line role description |
| Status badge | "🟢 Active" after appearing |
| Glass card | Uses `glass-card` component |

**7 Agents in Display Order**:
1. 🎯 Goal Analyzer — "Understands your learning intent"
2. 📚 Curriculum Designer — "Builds your milestone roadmap"
3. 📅 Daily Planner — "Schedules your learning sessions"
4. 🔍 Resource Finder — "Curates the best learning materials"
5. 🔨 Project Mentor — "Guides your hands-on projects"
6. ❓ Quiz Master — "Tests and reinforces your knowledge"
7. 📊 Progress Tracker — "Monitors your learning journey"

**Pipeline Progress Bar**:
- Below the agent cards
- 7 steps, fills sequentially as each agent invocation completes
- Labels: "Analyzing goal → Building roadmap → Planning schedule → Finding resources → Creating projects → Generating quizzes → Setting up tracking"

---

## Feature 3: Personalized Learning Roadmap

### Component: `RoadmapTimeline`

**Desktop Layout** (≥1024px):
- Horizontally scrollable container
- Milestone cards connected by a dashed horizontal line with progress indicator arrows
- Cards: 260px wide, fixed height based on content

**Mobile Layout** (<1024px):
- Vertical list of milestone cards
- Connected by a vertical dashed line
- Cards: full-width

**`MilestoneCard` Specification**:

| Element | Detail |
|---------|--------|
| Top | Milestone number badge + status icon |
| Title | `var(--text-xl)`, Outfit font |
| Description | 2 lines truncated, expand on click |
| Duration | e.g., "≈ 14 days" in muted text |
| Topic pills | Small scrollable pill row, max 6 shown + "+N more" |
| Progress ring | SVG circle, fills based on tasks completed in milestone |
| Status border | Color-coded glass border (grey/blue/green) |
| Click | Opens `MilestoneDetailPanel` (right slide-in panel on desktop, bottom sheet on mobile) |

**`MilestoneDetailPanel` Specification**:

| Section | Content |
|---------|---------|
| Header | Milestone title + status badge + close button |
| Description | Full description text |
| Learning Objectives | Bullet list with ✓ checkmark icons |
| Topics | List of topics, each with a resource count badge |
| Project | Linked project card (mini view) |
| Action | "Mark In Progress" / "Mark Complete" button |

---

## Feature 4: Daily Learning Planner

### Component: `DailyPlanner`

**Layout**:
```
┌──────────────────────────────────┬─────────────────┐
│  ← Jul 16   📅 Jul 17 Today →   │   This Week     │
│                                  │  M T W T F S S  │
│  Streak: 🔥 5 days               │  ✓ ✓ ✓ ✓ □ □ □  │
│  2 of 3 tasks done               │                 │
├──────────────────────────────────┤  Streak: 5 days │
│                                  │                 │
│  📖 Read: JS Promises [45 min] ✓ │                 │
│  💻 Practice: Async exercises... │                 │
│  🏗️ Build: Simple promise chain  │                 │
│                                  │                 │
└──────────────────────────────────┴─────────────────┘
```

**`TaskCard` Specification**:

| State | Visual |
|-------|--------|
| Incomplete | White border, grey checkbox circle |
| Complete | Green border, green checkbox, text strikethrough |
| Hover | Card lifts (box-shadow deepens), checkbox pulses |
| Click checkbox | Optimistic update (immediate visual), then API call |

**Task Type Icons**:
- 📖 Read → blue
- 🎬 Watch → purple
- 💻 Practice → orange
- 🏗️ Build → yellow
- ❓ Quiz → green

**Date Navigation**:
- Left/right arrow buttons to navigate days
- Clicking "Today" snaps back to current date
- Future dates: accessible but not highlighted
- Past dates: accessible, show completed/missed state

---

## Feature 5: AI Resource Finder

### Component: `ResourcesPage`

**Filter Panel** (left sidebar, 220px):
- By Milestone: dropdown with all milestone titles
- By Topic: multi-select checkboxes (filtered based on milestone selection)
- By Type: icon toggles for Article / Video / Course / Documentation / Tool
- By Difficulty: pill toggles for Beginner / Intermediate / Advanced
- "Clear Filters" link at bottom

**`ResourceCard` Specification**:

| Element | Detail |
|---------|--------|
| Size | Full width, ~90px tall |
| Left icon | Resource type icon (colored) |
| Title | Medium weight, truncated to 1 line |
| URL | Domain shown in muted text (`youtube.com`) |
| Tags | Type badge + Difficulty badge + Time estimate |
| Bookmark icon | Right side, `♡` → `♥` on toggle |
| Click | Opens URL in new tab |

**Sort Options**: By Relevance (default), By Duration, Alphabetical

---

## Feature 6: AI Project Mentor

### Component: `ProjectsPage`

**Layout**: Grid of `ProjectCard` components (1 per milestone)

**`ProjectCard` Specification**:

| State | Visual |
|-------|--------|
| Collapsed | Title, objective, tech stack pills, status badge, "Expand" caret |
| Expanded | Full detail panel slides down |

**Expanded Project Detail**:
```
📌 Project Title
Objective: Single-sentence objective text
Tech Stack: [Node.js] [JavaScript] [fs module]
Estimated: ~4 hours

Steps:
  1. Set up the project          ▶ [Reveal Hint]
  2. Implement add-task          ▶ [Reveal Hint] 
  3. Implement list-tasks        ✓ [Hint shown: "Use Array.map()..."]
  ...
  
Deliverable:
  A CLI app that adds, lists, and deletes tasks from a JSON file.

Status: [Not Started] [In Progress] [Complete]

─────────────────────
💬 Ask Your Mentor
──
  [Your question here...                    ] [Send →]
  
  Alex: Great question! Think about what...
```

**Hint Reveal Animation**: Hint text slides in with a slight delay after button click (200ms fade-in).

**Mentor Chat**:
- Simple vertical chat thread
- User messages: right-aligned, purple bubble
- Mentor messages: left-aligned, glass card
- AI response: typing indicator (3 pulsing dots) then text appears

---

## Feature 7: AI Quiz Generator

### Component: `QuizPage` + `QuizModal`

**Topic Selection Screen** (`QuizPage`):
- One quiz card per topic (grouped by milestone)
- Card shows: topic name, difficulty, number of questions, score if completed, "Start Quiz" / "Retry" button

**`QuizModal` Flow**:

**Active Question View**:
```
┌────────────────────────────────────────────┐
│  Question 3 of 7            [███░░░░] 43%  │
├────────────────────────────────────────────┤
│                                            │
│  What does `async` before a function do?  │
│                                            │
│  [ A ] Makes it run in parallel           │
│  [ B ] Makes it return a Promise    ←     │
│  [ C ] Makes it execute synchronously     │
│  [ D ] Makes it only run on the server    │
│                                            │
└────────────────────────────────────────────┘
```

**After Answer (Correct)**:
- Option B: green background + ✓ icon
- Explanation card slides in below: "Correct! The async keyword automatically wraps the function's return value in a Promise, allowing you to use await inside it."
- "Next Question →" button appears

**After Answer (Wrong)**:
- Selected option: red background + ✗ icon
- Correct option: green background + ✓ icon
- Explanation card in amber: explanation text
- "Next Question →" button

**End Screen**:
```
┌────────────────────────────────────────────┐
│           Quiz Complete! 🎉                 │
│                                            │
│        Score: 6/7 Correct                 │
│              [██████████] 85%             │
│         ✅ PASSED (threshold: 70%)         │
│                                            │
│  Something to review:                     │
│  ⚠️ Question 4 — What does async do?       │
│                                            │
│     [Retry Quiz]    [Back to Topics]      │
└────────────────────────────────────────────┘
```

---

## Feature 8: Progress Dashboard

### Component: `ProgressDashboard`

**Stat Cards Row** (4 cards):

| Card | Icon | Value | Sub-label |
|------|------|-------|-----------|
| Overall Progress | 📊 | `27%` | `23 of 84 tasks complete` |
| Streak | 🔥 | `5 days` | `Best: 8 days` |
| Milestones | 🏁 | `1 of 6` | `Completed` |
| Today | ✅ | `2 of 3` | `Tasks done today` |

**52-Week Activity Heatmap**:
- GitHub contribution graph style
- 52 columns (weeks), 7 rows (Mon–Sun)
- Color scale: `#1a1a2e` (0 tasks) → `#7c3aff` (5+ tasks)
- Hover tooltip: "Jul 17: 3 tasks, 75 min"
- Scrolls horizontally on mobile

**Milestone Completion List**:
- List of all milestones with status icon and completion date (if done)
- Progress bar showing % of milestone tasks completed

**Quiz Score History**:
- Table: Topic | Score | Date | Pass/Fail
- Or small bar chart showing scores per topic
