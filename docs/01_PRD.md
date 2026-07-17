# SkillVerse — Product Requirements Document (PRD)

> **Version**: 1.0 — MVP  
> **Status**: Approved for Development  
> **Last Updated**: 2026-07-17  

---

## 1. Executive Summary

**SkillVerse** is an AI-powered personalized learning platform that transforms a learner's stated goal into a complete, adaptive learning journey — executed by a coordinated team of specialized AI agents. Users don't browse courses; they declare a goal, and SkillVerse builds the entire curriculum, daily plan, resource library, capstone projects, and quizzes around that goal automatically.

**Tagline**: *"Skill Your Way"*  
**Core Differentiator**: Multi-agent AI orchestration that delivers a holistic, personalized education experience — not just a course list.

---

## 2. Problem Statement

| Problem | Current Solutions | SkillVerse's Answer |
|---------|-------------------|---------------------|
| Learners don't know *where* to start | Googling, Reddit threads | Smart Goal Onboarding with AI analysis |
| Generic courses don't fit individual timelines | Udemy, Coursera | Adaptive daily planner tailored to your schedule |
| Resources are scattered and low-quality | YouTube, Medium | AI-curated, ranked resources per topic |
| No guided practice | MOOCs drop users after video content | AI Project Mentor drives hands-on work |
| No way to test retention | Passive consuming | AI Quiz Generator with spaced repetition |
| No single progress view | Juggling multiple tabs/apps | Unified Progress Dashboard |

---

## 3. User Personas

### Persona 1: "The Career Switcher" — Riya, 26
- **Background**: Marketing analyst wanting to become a backend developer
- **Goal**: Go from zero to hireable in 3 months
- **Pain Points**: No time for 40-hour courses; needs focused daily guidance
- **SkillVerse Value**: Gets a 90-day roadmap broken into 1-hour daily sessions with relevant projects

### Persona 2: "The Upskiller" — Arjun, 31
- **Background**: Junior frontend dev wanting to learn system design
- **Goal**: Pass Google/Meta system design interviews in 6 weeks
- **Pain Points**: Existing resources are scattered; interview prep is poorly structured
- **SkillVerse Value**: Gets a focused 6-week interview curriculum with mock questions and project milestones

### Persona 3: "The Self-Learner" — Priya, 19
- **Background**: First-year CS student wanting to learn ML
- **Goal**: Build a working ML project to show on resume
- **Pain Points**: Academic syllabi are too theory-heavy; tutorial hell is real
- **SkillVerse Value**: Gets a project-first curriculum with integrated quizzes to check theory understanding

---

## 4. MVP Feature Scope

### In Scope (8 Core Features — Frozen)

| # | Feature | Priority | Complexity |
|---|---------|----------|------------|
| 1 | Smart Goal Onboarding | P0 | Medium |
| 2 | Dynamic AI Team Formation | P0 | Low |
| 3 | Personalized Learning Roadmap | P0 | High |
| 4 | Daily Learning Planner | P1 | Medium |
| 5 | AI Resource Finder | P1 | Medium |
| 6 | AI Project Mentor | P1 | High |
| 7 | AI Quiz Generator | P1 | Medium |
| 8 | Progress Dashboard | P2 | Medium |

### Out of Scope (Post-MVP)

- Peer collaboration / study groups
- Instructor marketplace
- Mobile app (iOS/Android)
- Offline mode
- Third-party LMS integrations (Canvas, Moodle)
- Live mentorship booking
- Gamification badges / leaderboards
- Payment / subscription tier
- Social sharing

---

## 5. Feature Requirements

### Feature 1: Smart Goal Onboarding

**User Story**: As a learner, I want to describe my learning goal in natural language so that SkillVerse can understand my intent and context.

**Acceptance Criteria**:
- [ ] User can type a free-form goal (min 10 chars, max 500 chars)
- [ ] User can optionally input: current skill level (Beginner/Intermediate/Advanced), available hours/week, target deadline
- [ ] Goal Analyzer Agent processes the input and returns:
  - Parsed topic/domain
  - Sub-topic breakdown
  - Realistic timeline estimate
  - Difficulty classification
- [ ] If input is too vague, AI prompts for clarification with 3 specific follow-up questions
- [ ] Goal is saved to `LearnerProfile` table
- [ ] UI shows a "processing" animation while agents work

**Non-Goals**: Does not validate or filter goals beyond basic safety filters.

---

### Feature 2: Dynamic AI Team Formation

**User Story**: As a learner, I want to see which AI agents have been assembled for my journey so I understand the system working for me.

**Acceptance Criteria**:
- [ ] After goal processing, UI displays 3–7 AI agents relevant to the goal
- [ ] Each agent is shown with: name, icon, one-line description, status (active/standby)
- [ ] Animation shows agents being "assigned" sequentially
- [ ] Team composition is logged but not dynamically changed per goal in MVP (all 7 agents are always used)

---

### Feature 3: Personalized Learning Roadmap

**User Story**: As a learner, I want a structured curriculum with milestones so I can track my high-level progress.

**Acceptance Criteria**:
- [ ] Curriculum Agent generates 3–8 milestones based on the goal
- [ ] Each milestone contains: title, description, estimated duration, list of topics
- [ ] Roadmap is displayed as a horizontal timeline (desktop) / vertical scroll (mobile)
- [ ] Completed milestones shown in a distinct visual state
- [ ] User can click a milestone to expand topic details
- [ ] Roadmap is stored in `Roadmap` table and associated with user

---

### Feature 4: Daily Learning Planner

**User Story**: As a learner, I want a day-by-day task breakdown so I can fit learning into my daily routine.

**Acceptance Criteria**:
- [ ] Planner Agent generates tasks for Day 1–N based on roadmap and hours/week input
- [ ] Each task has: title, type (Read / Watch / Practice / Build / Quiz), estimated minutes, linked resource or project
- [ ] User can mark tasks as complete (✓)
- [ ] Completed tasks trigger streak tracking
- [ ] Day picker allows viewing future/past days
- [ ] Tasks stored in `DailyTasks` table

---

### Feature 5: AI Resource Finder

**User Story**: As a learner, I want curated, high-quality resources for each topic so I don't waste time finding them myself.

**Acceptance Criteria**:
- [ ] Resource Agent provides 3–5 resources per topic
- [ ] Each resource has: title, type (Article / Video / Course / Documentation), URL, estimated read/watch time, difficulty tag
- [ ] Resources are ranked by relevance score (LLM-assessed or search-ranked)
- [ ] User can bookmark resources (stored in `Resources` table)
- [ ] Resources are surfaced inside Daily Planner tasks and Roadmap topic expansions

---

### Feature 6: AI Project Mentor

**User Story**: As a learner, I want a guided capstone project per milestone so I can apply what I've learned.

**Acceptance Criteria**:
- [ ] Project Mentor Agent generates 1 capstone project per milestone
- [ ] Project contains: title, description, objective, tech stack, step-by-step hints (hidden by default), deliverable
- [ ] User can ask the Project Mentor follow-up questions (simple chat interface)
- [ ] Project status (Not Started / In Progress / Complete) tracked in `Projects` table
- [ ] Hints revealed progressively on user request

---

### Feature 7: AI Quiz Generator

**User Story**: As a learner, I want topic-specific quizzes so I can test and reinforce my understanding.

**Acceptance Criteria**:
- [ ] Quiz Agent generates 5–10 questions per topic
- [ ] Question types: Multiple Choice (MVP), True/False (MVP)
- [ ] Each question has: question text, 4 options, correct answer, explanation
- [ ] Immediate feedback shown after each answer
- [ ] Quiz score and answers stored in `Quizzes` table
- [ ] Failed questions flagged for review

---

### Feature 8: Progress Dashboard

**User Story**: As a learner, I want a visual overview of my progress so I feel motivated and on track.

**Acceptance Criteria**:
- [ ] Dashboard shows: overall completion %, current streak (days), milestones completed, tasks done today
- [ ] Weekly activity heatmap (GitHub-style)
- [ ] Milestone completion badges shown
- [ ] Quiz score history per topic
- [ ] Time spent estimate (based on tasks marked complete)
- [ ] All data sourced from `Progress` table

---

## 6. Success Metrics (MVP Definition of Done)

| Metric | Target |
|--------|--------|
| Goal → Roadmap generation time | < 10 seconds |
| Agent pipeline error rate | < 5% |
| All 8 features functional end-to-end | 100% |
| Core user flow completable without errors | Yes |
| Mobile-responsive UI | Yes |
| Database persisting all user data | Yes |

---

## 7. Technical Constraints

- **LLM**: Gemini 1.5 Pro (primary), with fallback option for OpenAI GPT-4o
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Hosting**: Vercel (frontend) + Railway or Render (backend)
- **No mobile app** in MVP — responsive web only
- **Agent Pipeline**: Sequential (each agent waits for prior output)
- **Resource Finder**: LLM-generated links (no live web search API in MVP)

---

## 8. Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Foundation | Hours 1–3 | Auth, DB schema, backend scaffold, basic UI shell |
| Phase 2: Core Agents | Hours 4–7 | Goal, Curriculum, Planner agents + API endpoints |
| Phase 3: Feature Completion | Hours 8–10 | Resource, Project, Quiz agents + all UI screens |
| Phase 4: Polish & Deploy | Hours 11–12 | Progress Dashboard, bug fixes, deployment |
