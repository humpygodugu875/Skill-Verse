# SkillVerse — System Architecture

> **Version**: 1.0 — MVP  
> **Last Updated**: 2026-07-17  

---

## 1. Architecture Overview

SkillVerse uses a **three-tier, microservice-inspired architecture** with a clear separation between the presentation layer, API layer, and data/AI layer.

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                        │
│                    Next.js 14 (App Router)                    │
│           React Components ← TanStack Query ← Axios          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (REST)
┌──────────────────────────▼──────────────────────────────────┐
│                   NODE.JS + EXPRESS.JS API                   │
│                        (Port 3001)                           │
│   Auth Middleware → Route Handlers → AI Orchestrator         │
│           ↓                              ↓                   │
│   Supabase SDK                    Agent Pipeline             │
└──────┬─────────────────────────────────┬────────────────────┘
       │                                 │
┌──────▼────────┐              ┌─────────▼──────────────┐
│  SUPABASE DB  │              │    AI AGENT LAYER      │
│  PostgreSQL   │              │  Goal Analyzer Agent   │
│  + Auth       │              │  Planner Agent         │
│  + Storage    │              │  Curriculum Agent      │
│  + RLS        │              │  Resource Agent        │
└───────────────┘              │  Project Mentor Agent  │
                               │  Quiz Agent            │
                               │  Progress Agent        │
                               └─────────┬──────────────┘
                                         │
                               ┌─────────▼──────────────┐
                               │  LLM PROVIDERS         │
                               │  Gemini 1.5 Pro        │
                               │  (OpenAI GPT-4o as     │
                               │   fallback)            │
                               └────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | Next.js (App Router) | 14+ | SSR + RSC for performance, file-based routing |
| **Frontend Styling** | Tailwind CSS | 3.x | Rapid dark UI development, utility-first |
| **Frontend State** | TanStack Query | v5 | Server state management, caching, mutations |
| **Backend** | Node.js + Express.js | Node 20+ | Lightweight, fast, easy LLM integration |
| **Database** | Supabase (PostgreSQL) | Latest | Managed Postgres + Auth + RLS + realtime |
| **AI/LLM** | Google Gemini 1.5 Pro | Latest | Primary LLM for all agent tasks |
| **AI/LLM Fallback** | OpenAI GPT-4o | Latest | Fallback if Gemini quota exceeded |
| **Auth** | Supabase Auth | Built-in | JWT, OAuth, password reset |
| **Deployment (FE)** | Vercel | - | Seamless Next.js deployment |
| **Deployment (BE)** | Railway / Render | - | Free-tier Node.js hosting |

---

## 3. Frontend Architecture

### 3.1 Directory Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Shared dashboard layout + sidebar
│   │   ├── onboarding/page.tsx
│   │   ├── roadmap/page.tsx
│   │   ├── planner/page.tsx
│   │   ├── resources/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── quiz/page.tsx
│   │   └── progress/page.tsx
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Base components (Button, Card, Modal, Input)
│   ├── agents/                 # AgentTeamDisplay, AgentCard
│   ├── roadmap/                # RoadmapTimeline, MilestoneCard
│   ├── planner/                # DayPicker, TaskCard, TaskList
│   ├── resources/              # ResourceCard, ResourceFilter
│   ├── projects/               # ProjectCard, HintReveal, MentorChat
│   ├── quiz/                   # QuizQuestion, QuizFeedback, QuizScore
│   └── progress/               # ProgressBar, Heatmap, StatCard
├── lib/
│   ├── api.ts                  # Axios instance + API call functions
│   ├── supabase.ts             # Supabase client initialization
│   └── utils.ts                # Helper functions
├── hooks/
│   ├── useGoal.ts              # Goal onboarding hook
│   ├── useRoadmap.ts           # Roadmap fetch/update hook
│   └── useProgress.ts          # Progress data hook
└── types/
    └── index.ts                # TypeScript interfaces for all entities
```

### 3.2 Key Design Decisions

- **App Router**: Uses Next.js 14 App Router (not Pages Router) for better layout nesting and RSC support
- **No Redux**: TanStack Query handles all server state; `useReducer` used for local UI state
- **Dark Glass UI**: Global dark background (`#0a0a0f`) with glassmorphism cards (`bg-white/5 backdrop-blur`)
- **Fonts**: `Inter` for body, `Outfit` for headings (Google Fonts)

---

## 4. Backend Architecture

### 4.1 Directory Structure

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── goal.routes.ts
│   │   ├── roadmap.routes.ts
│   │   ├── planner.routes.ts
│   │   ├── resources.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── quiz.routes.ts
│   │   └── progress.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification via Supabase
│   │   ├── validate.middleware.ts # Zod schema validation
│   │   └── error.middleware.ts  # Global error handler
│   ├── agents/
│   │   ├── orchestrator.ts     # Pipeline coordinator
│   │   ├── goalAnalyzer.ts
│   │   ├── planner.ts
│   │   ├── curriculum.ts
│   │   ├── resourceFinder.ts
│   │   ├── projectMentor.ts
│   │   ├── quizGenerator.ts
│   │   └── progressAgent.ts
│   ├── services/
│   │   ├── gemini.service.ts   # Gemini API wrapper
│   │   ├── openai.service.ts   # OpenAI fallback wrapper
│   │   └── supabase.service.ts # DB access layer
│   ├── prompts/
│   │   └── index.ts            # All prompt templates (see 10_Prompts.md)
│   └── app.ts                  # Express app initialization
├── .env.example
└── package.json
```

### 4.2 Request Lifecycle

```
HTTP Request
    → Auth Middleware (verify JWT)
    → Validate Middleware (Zod schema)
    → Route Handler
        → Service Layer (DB operations)
        → Agent Orchestrator (AI pipeline)
            → Agent 1 (LLM call)
            → Agent 2 (LLM call, uses Agent 1 output)
            → ...
        → Supabase (persist result)
    → JSON Response
```

### 4.3 Error Handling Strategy

- All agent calls wrapped in `try/catch` with 2 retries
- LLM timeout: 30 seconds per agent call
- Structured error response: `{ error: string, code: string, details?: any }`
- HTTP status codes: 400 (validation), 401 (unauth), 403 (forbidden), 500 (server/LLM error)

---

## 5. Database Architecture

*(See `06_Database.md` for full schema)*

### 5.1 Key Design Principles

- All tables have `user_id UUID REFERENCES auth.users(id)` for Row Level Security
- Soft deletes with `deleted_at TIMESTAMP` where needed
- `created_at` / `updated_at` on all tables (set via Supabase triggers)
- JSONB used for flexible agent output fields (e.g., `topics`, `steps`, `options`)

### 5.2 RLS Policy Strategy

```sql
-- Example: Users can only read/write their own data
CREATE POLICY "User owns their data" ON roadmap
  FOR ALL USING (auth.uid() = user_id);
```

All tables share this pattern. No admin bypass in MVP.

---

## 6. AI Agent Architecture

*(See `04_AI_Agents.md` for detailed agent specs)*

### 6.1 Pipeline Design

```
POST /goal
  → GoalAnalyzerAgent(goalInput) → GoalAnalysis
      → POST /roadmap
          → CurriculumAgent(GoalAnalysis) → Milestones[]
              → PlannerAgent(Milestones[], hoursPerWeek) → DailyTasks[]
                  → ResourceFinderAgent(topics[]) → Resources[]
                      → ProjectMentorAgent(Milestones[]) → Projects[]
                          → QuizGeneratorAgent(topics[]) → Quizzes[]
```

### 6.2 LLM Communication Pattern

All agents use **structured JSON output** via Gemini's `responseMimeType: "application/json"` parameter. This ensures parseable, type-safe responses.

```typescript
const result = await gemini.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
  }
});
const parsed = JSON.parse(result.response.text());
```

---

## 7. Deployment Architecture

```
[GitHub Repo]
     │
     ├──── Vercel (Frontend)
     │         └── Auto-deploy on push to main
     │         └── Env vars: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL
     │
     └──── Railway (Backend)
               └── Auto-deploy on push to main
               └── Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
                              GEMINI_API_KEY, OPENAI_API_KEY, PORT
```

### 7.1 Environment Variables

**Frontend (`.env.local`)**:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (`.env`)**:
```
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=   # Optional fallback
NODE_ENV=development
```
