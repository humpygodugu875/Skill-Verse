# SkillVerse — Software Requirements Specification (SRS)

> **Version**: 1.0 — MVP  
> **Based on**: PRD v1.0  
> **Last Updated**: 2026-07-17  

---

## 1. System Overview

SkillVerse is a three-tier web application:

```
[Browser Client]  ←→  [Next.js Frontend]  ←→  [Express.js API]  ←→  [Supabase DB]
                                                       ↕
                                             [AI Orchestrator]
                                                       ↕
                                          [7 Specialized AI Agents]
                                                       ↕
                                          [Gemini 1.5 Pro / OpenAI]
```

---

## 2. Functional Requirements

### 2.1 Authentication Module

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | System SHALL support email/password registration and login via Supabase Auth |
| FR-AUTH-02 | System SHALL support Google OAuth sign-in via Supabase Auth providers |
| FR-AUTH-03 | System SHALL issue JWT tokens on successful authentication |
| FR-AUTH-04 | All API endpoints (except `/auth/*`) SHALL require a valid Bearer token |
| FR-AUTH-05 | System SHALL auto-refresh tokens before expiry |
| FR-AUTH-06 | System SHALL support password reset via email link |

---

### 2.2 Goal Onboarding Module

| ID | Requirement |
|----|-------------|
| FR-GOAL-01 | System SHALL accept a goal string of 10–500 characters |
| FR-GOAL-02 | System SHALL optionally accept: skill_level (enum: beginner/intermediate/advanced), hours_per_week (integer 1–40), deadline_weeks (integer 1–52) |
| FR-GOAL-03 | System SHALL call the Goal Analyzer Agent upon submission |
| FR-GOAL-04 | System SHALL return a structured `GoalAnalysis` object within 10 seconds |
| FR-GOAL-05 | System SHALL persist the goal and analysis to the `LearnerProfile` table |
| FR-GOAL-06 | System SHALL return clarification questions if goal confidence score < 0.7 |

**GoalAnalysis Object Schema:**
```json
{
  "domain": "string",
  "sub_topics": ["string"],
  "estimated_weeks": "integer",
  "difficulty": "beginner | intermediate | advanced",
  "confidence_score": "float (0.0-1.0)",
  "clarification_questions": ["string"] // only if confidence < 0.7
}
```

---

### 2.3 Roadmap Module

| ID | Requirement |
|----|-------------|
| FR-ROAD-01 | System SHALL generate 3–8 milestones for any valid goal |
| FR-ROAD-02 | Each milestone SHALL contain: title, description, estimated_days, topics[] |
| FR-ROAD-03 | System SHALL persist the roadmap to the `Roadmap` table |
| FR-ROAD-04 | System SHALL allow users to view the roadmap at any time |
| FR-ROAD-05 | System SHALL update milestone status when user marks it complete |
| FR-ROAD-06 | System SHALL trigger Daily Planner generation after roadmap creation |

**Milestone Object Schema:**
```json
{
  "id": "uuid",
  "roadmap_id": "uuid",
  "sequence_number": "integer",
  "title": "string",
  "description": "string",
  "estimated_days": "integer",
  "topics": ["string"],
  "status": "not_started | in_progress | completed"
}
```

---

### 2.4 Daily Planner Module

| ID | Requirement |
|----|-------------|
| FR-PLAN-01 | System SHALL generate daily tasks for all days in the roadmap timeline |
| FR-PLAN-02 | Each day SHALL have 1–5 tasks totaling ≤ hours_per_week / 7 hours |
| FR-PLAN-03 | Task types SHALL be: Read, Watch, Practice, Build, Quiz |
| FR-PLAN-04 | System SHALL allow users to mark tasks as complete |
| FR-PLAN-05 | System SHALL calculate and update streaks on task completion |
| FR-PLAN-06 | System SHALL allow viewing tasks for any date in the plan |
| FR-PLAN-07 | Tasks SHALL be linked to their source milestone |

**DailyTask Object Schema:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "milestone_id": "uuid",
  "day_number": "integer",
  "date": "ISO 8601 date",
  "title": "string",
  "type": "Read | Watch | Practice | Build | Quiz",
  "estimated_minutes": "integer",
  "resource_id": "uuid | null",
  "is_completed": "boolean",
  "completed_at": "timestamp | null"
}
```

---

### 2.5 Resource Finder Module

| ID | Requirement |
|----|-------------|
| FR-RES-01 | System SHALL generate 3–5 resources per topic in the roadmap |
| FR-RES-02 | Each resource SHALL contain: title, url, type, estimated_time_minutes, difficulty |
| FR-RES-03 | Resource types SHALL be: Article, Video, Course, Documentation, Tool |
| FR-RES-04 | System SHALL allow users to bookmark resources |
| FR-RES-05 | Bookmarked resources SHALL persist in the `Resources` table |
| FR-RES-06 | Resources SHALL be accessible from both the Roadmap view and Daily Planner |

**Resource Object Schema:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "milestone_id": "uuid",
  "topic": "string",
  "title": "string",
  "url": "string",
  "type": "Article | Video | Course | Documentation | Tool",
  "estimated_minutes": "integer",
  "difficulty": "beginner | intermediate | advanced",
  "is_bookmarked": "boolean",
  "relevance_score": "float (0.0-1.0)"
}
```

---

### 2.6 Project Mentor Module

| ID | Requirement |
|----|-------------|
| FR-PROJ-01 | System SHALL generate 1 capstone project per milestone |
| FR-PROJ-02 | Each project SHALL contain: title, description, objective, tech_stack[], steps[], deliverable |
| FR-PROJ-03 | Project steps SHALL include hints that are hidden by default |
| FR-PROJ-04 | System SHALL support a simple Q&A interface for follow-up questions |
| FR-PROJ-05 | System SHALL track project status (not_started, in_progress, completed) |
| FR-PROJ-06 | System SHALL respond to Q&A questions using the Project Mentor Agent |

**Project Object Schema:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "milestone_id": "uuid",
  "title": "string",
  "description": "string",
  "objective": "string",
  "tech_stack": ["string"],
  "steps": [
    {
      "step_number": "integer",
      "title": "string",
      "description": "string",
      "hint": "string"
    }
  ],
  "deliverable": "string",
  "status": "not_started | in_progress | completed"
}
```

---

### 2.7 Quiz Generator Module

| ID | Requirement |
|----|-------------|
| FR-QUIZ-01 | System SHALL generate 5–10 questions per topic |
| FR-QUIZ-02 | Question types in MVP: Multiple Choice (4 options), True/False |
| FR-QUIZ-03 | Each question SHALL include: question text, options[], correct_answer, explanation |
| FR-QUIZ-04 | System SHALL provide immediate feedback after each answer |
| FR-QUIZ-05 | System SHALL store quiz attempts and scores in `Quizzes` table |
| FR-QUIZ-06 | System SHALL flag incorrectly answered questions for review |
| FR-QUIZ-07 | System SHALL compute and display a score (X/Y correct) at end of quiz |

**Quiz Object Schema:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "milestone_id": "uuid",
  "topic": "string",
  "questions": [
    {
      "id": "uuid",
      "type": "mcq | true_false",
      "question": "string",
      "options": ["string"],
      "correct_answer": "string",
      "explanation": "string",
      "user_answer": "string | null",
      "is_correct": "boolean | null"
    }
  ],
  "score": "integer",
  "max_score": "integer",
  "completed_at": "timestamp | null"
}
```

---

### 2.8 Progress Dashboard Module

| ID | Requirement |
|----|-------------|
| FR-PROG-01 | System SHALL display overall completion percentage across all milestones |
| FR-PROG-02 | System SHALL display current streak (consecutive days with ≥ 1 completed task) |
| FR-PROG-03 | System SHALL display a 52-week activity heatmap |
| FR-PROG-04 | System SHALL display milestone completion status |
| FR-PROG-05 | System SHALL display quiz score history per topic |
| FR-PROG-06 | System SHALL display tasks completed today vs. planned |
| FR-PROG-07 | Progress data SHALL be sourced from the `Progress` table |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | Goal → Roadmap pipeline SHALL complete within 10 seconds |
| NFR-PERF-02 | API responses for read operations SHALL return within 500ms |
| NFR-PERF-03 | Frontend pages SHALL achieve Lighthouse Performance score ≥ 80 |
| NFR-PERF-04 | LLM API calls SHALL implement a 30-second timeout with graceful error handling |

### 3.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All API communication SHALL use HTTPS |
| NFR-SEC-02 | API keys (Gemini/OpenAI, Supabase) SHALL be stored as environment variables only |
| NFR-SEC-03 | Row Level Security (RLS) SHALL be enabled on all Supabase tables |
| NFR-SEC-04 | Users SHALL only access their own data |
| NFR-SEC-05 | Input SHALL be validated and sanitized on both client and server |

### 3.3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | LLM agent failures SHALL return a user-friendly error message, not a raw stack trace |
| NFR-REL-02 | System SHALL implement retry logic (max 2 retries) for LLM API calls |
| NFR-REL-03 | Database operations SHALL use transactions for multi-table writes |

### 3.4 Usability

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | UI SHALL be responsive and function on viewports ≥ 375px wide |
| NFR-USE-02 | All interactive elements SHALL have visible hover/active states |
| NFR-USE-03 | Loading states SHALL be shown for all async operations |
| NFR-USE-04 | Error messages SHALL be human-readable and actionable |

### 3.5 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-COMP-01 | SHALL support latest Chrome, Firefox, Safari, and Edge |
| NFR-COMP-02 | SHALL support Node.js v20+ |
| NFR-COMP-03 | SHALL support Next.js 14+ (App Router) |
