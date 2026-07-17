# SkillVerse — 12-Hour MVP Development Plan

> **Version**: 1.0 — MVP Sprint  
> **Format**: Hackathon-style, single developer  
> **Stack**: Next.js 14 · Express.js · Supabase · Gemini 1.5 Pro  
> **Last Updated**: 2026-07-17  

---

## Pre-Sprint Checklist (Before the Clock Starts)

- [ ] Supabase project created, URL and keys noted
- [ ] Gemini API key obtained from Google AI Studio
- [ ] GitHub repo initialized
- [ ] Vercel account connected to repo
- [ ] Railway or Render account ready for backend deploy
- [ ] Node.js 20+, npm installed
- [ ] VS Code + relevant extensions installed

---

## Hour-by-Hour Schedule

---

### ⏰ Hours 1–3: Foundation

**Goal**: Working auth + database + project scaffolds running locally

#### Hour 1: Project Scaffold

**Frontend (Next.js)**:
```bash
npx create-next-app@latest skillverse-client \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-git
cd skillverse-client
npm install @supabase/supabase-js @tanstack/react-query axios
```

**Backend (Express)**:
```bash
mkdir skillverse-server && cd skillverse-server
npm init -y
npm install express cors dotenv @supabase/supabase-js @google/generative-ai zod
npm install -D typescript ts-node nodemon @types/express @types/cors @types/node
```

**Deliverables**:
- [ ] Both projects scaffolded and running (`npm run dev` / `nodemon`)
- [ ] `.env` files created with placeholder keys
- [ ] Basic Express `app.ts` with `GET /health` returning `{ status: "ok" }`
- [ ] Next.js landing page shell rendering at `localhost:3000`

---

#### Hour 2: Supabase Database

**Apply the schema from `06_Database.md`** in Supabase SQL Editor:

**Order of execution**:
1. Create `learner_profiles` table + RLS policy
2. Create `roadmaps` table + RLS policy
3. Create `milestones` table + RLS policy + indexes
4. Create `daily_tasks` table + RLS policy + indexes
5. Create `resources` table + RLS policy + indexes
6. Create `projects` table + RLS policy
7. Create `quizzes` table + RLS policy
8. Create `progress` table + RLS policy
9. Add `update_updated_at_column()` trigger function
10. Apply trigger to all tables with `updated_at`
11. Add `sync_progress_on_task_complete` trigger

**Deliverables**:
- [ ] All 8 tables created in Supabase with RLS enabled
- [ ] Supabase client initialized in `server/src/services/supabase.service.ts`
- [ ] Test query from server: `SELECT NOW()` → returns timestamp

---

#### Hour 3: Auth + Middleware

**Backend Auth Middleware** (`server/src/middleware/auth.middleware.ts`):
```typescript
// Verify Supabase JWT, extract user_id, attach to req.user
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
req.user = user;
```

**Auth Routes** (`server/src/routes/auth.routes.ts`):
- `POST /api/v1/auth/register` → calls `supabase.auth.signUp()`
- `POST /api/v1/auth/login` → calls `supabase.auth.signInWithPassword()`
- `POST /api/v1/auth/logout` → calls `supabase.auth.signOut()`

**Frontend Auth**:
- Supabase client in `src/lib/supabase.ts`
- `/login` page with email/password form + Google OAuth button
- `/register` page
- Auth context/provider to expose `user` session globally
- Route protection: middleware redirects unauthenticated users away from `/dashboard/*`

**Deliverables**:
- [ ] Register → Login flow works end-to-end
- [ ] JWT stored in Supabase session (handled automatically)
- [ ] Protected backend routes return 401 without valid token
- [ ] Protected frontend routes redirect to `/login`

---

### ⏰ Hours 4–7: Core AI Agents + API

**Goal**: Goal Analysis → Roadmap → Daily Plan pipeline working end-to-end

#### Hour 4: Gemini Service + Goal Analyzer Agent

**Gemini Service** (`server/src/services/gemini.service.ts`):
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
});

export async function callGemini(prompt: string): Promise<any> {
  // Retry logic: max 2 retries, 30s timeout per attempt
}
```

**Goal Analyzer Agent** (`server/src/agents/goalAnalyzer.ts`):
- Build prompt from `PROMPT_GOAL_ANALYZER` template
- Inject user inputs
- Call Gemini, parse JSON response
- Validate with Zod schema
- Return `GoalAnalysis` object

**Goal Route** (`server/src/routes/goal.routes.ts`):
- `POST /api/v1/goal` → validate input → call agent → save to `learner_profiles` → return response

**Frontend**:
- Onboarding page Step 1 + 2 (Goal input + Context form)
- API call to `POST /api/v1/goal`
- Show analysis results / clarification questions

**Deliverables**:
- [ ] `POST /api/v1/goal` returns valid GoalAnalysis
- [ ] Goal and analysis saved to `learner_profiles` table
- [ ] Frontend onboarding form submits and shows result

---

#### Hour 5: Curriculum Agent + Roadmap API

**Curriculum Agent** (`server/src/agents/curriculum.ts`):
- Build prompt from `PROMPT_CURRICULUM` template
- Call Gemini → parse → validate
- Return `CurriculumOutput` with milestones array

**Roadmap Route** (`server/src/routes/roadmap.routes.ts`):
- `POST /api/v1/roadmap` → read profile from DB → call curriculum agent → save roadmap + milestones to DB
- `GET /api/v1/roadmap/:roadmap_id` → join roadmap + milestones from DB
- `PATCH /api/v1/roadmap/:roadmap_id/milestones/:milestone_id` → update status

**Frontend Roadmap Page**:
- Fetch roadmap data
- Render milestone timeline (desktop: horizontal scroll, mobile: vertical)
- Milestone cards with status badges
- Click milestone → expand detail panel

**Deliverables**:
- [ ] `POST /api/v1/roadmap` generates and saves milestone data
- [ ] Roadmap page renders all milestones from API
- [ ] Milestone status updates on interaction

---

#### Hour 6: Planner Agent + Daily Plan API

**Planner Agent** (`server/src/agents/planner.ts`):
- Build prompt from `PROMPT_PLANNER` template
- Inject milestones, hours/week, start date
- Call Gemini → parse → validate
- Return `PlannerOutput` with `daily_tasks` array

**Daily Plan Route**:
- `POST /api/v1/daily-plan` → read milestones → call planner → bulk insert `daily_tasks` → link resource_id (null for now)
- `GET /api/v1/daily-plan/:roadmap_id` → filter by `?date=` or `?day_number=`  
- `PATCH /api/v1/daily-plan/tasks/:task_id` → mark complete → trigger streak update

**Frontend Daily Planner Page**:
- Date picker component (prev/next day)
- Today's tasks list with task cards
- Checkbox to mark complete (optimistic update with TanStack Query mutation)
- Streak display (current streak from progress table)

**Deliverables**:
- [ ] `POST /api/v1/daily-plan` generates and stores all daily tasks
- [ ] Planner page shows today's tasks
- [ ] Marking task complete updates UI and DB
- [ ] Streak tracked in progress table

---

#### Hour 7: Resource Finder + Orchestrator

**Resource Finder Agent** (`server/src/agents/resourceFinder.ts`):
- Collect all unique topics from all milestones
- Build prompt from `PROMPT_RESOURCE_FINDER` template
- Call Gemini → parse → validate
- Return `ResourceFinderOutput`

**Resource Route**:
- `POST /api/v1/resources` → call resource agent → bulk insert to `resources` table
- `GET /api/v1/resources` → filter by milestone or topic
- `PATCH /api/v1/resources/:id/bookmark` → toggle bookmark

**Agent Orchestrator** (`server/src/agents/orchestrator.ts`):
- Wire all agents: Goal → Curriculum → Planner → Resources as sequential pipeline
- Error handling: if any agent fails, save what's been done and return partial result with error flag

**Frontend Resources Page**:
- Filter sidebar by milestone/topic/type
- Resource cards grid
- Bookmark toggle button

**Deliverables**:
- [ ] Resource agent generates 3–5 resources per topic
- [ ] Resources page renders filtered resource cards
- [ ] Bookmarking works and persists
- [ ] Orchestrator can run full Goal→Resources pipeline

---

### ⏰ Hours 8–10: Remaining Features

#### Hour 8: Project Mentor Agent

**Project Mentor Agent** (`server/src/agents/projectMentor.ts`):
- Loop through each milestone
- Build prompt from `PROMPT_PROJECT_MENTOR` template
- Call Gemini → parse → validate → insert to `projects` table

**Project Route**:
- `POST /api/v1/projects` → generate projects for all milestones
- `GET /api/v1/projects/:roadmap_id` → fetch all projects
- `POST /api/v1/projects/:id/ask` → Q&A endpoint (uses `PROMPT_PROJECT_QA`)
- `PATCH /api/v1/projects/:id/steps/:n/reveal-hint` → update `hint_revealed` in JSONB

**Frontend Projects Page**:
- Project cards per milestone
- Expandable step list with "Reveal Hint" button
- Mini chat panel at bottom of expanded card
- Project status toggle (Not Started / In Progress / Done)

**Deliverables**:
- [ ] Projects generated for all milestones
- [ ] Hints reveal on demand
- [ ] Q&A mentor chat works

---

#### Hour 9: Quiz Generator Agent

**Quiz Generator Agent** (`server/src/agents/quizGenerator.ts`):
- Loop through all topics in all milestones
- Build prompt from `PROMPT_QUIZ_GENERATOR` template
- Call Gemini → parse → validate → insert to `quizzes` table

**Quiz Route**:
- `POST /api/v1/quiz` → generate quizzes for milestone
- `GET /api/v1/quiz/:milestone_id` → fetch quizzes for milestone
- `POST /api/v1/quiz/:id/answer` → submit answer, check correctness, update JSONB
- `POST /api/v1/quiz/:id/complete` → compute final score, mark completed

**Frontend Quiz Page**:
- Topic tabs / dropdown to select quiz
- Quiz modal: question → answer tiles → feedback → next
- End screen: score card + flagged questions

**Deliverables**:
- [ ] Quizzes generated per topic
- [ ] Full quiz flow (answer → feedback → score) works
- [ ] Quiz scores saved to DB

---

#### Hour 10: AI Team Formation Screen + Onboarding Polish

**AI Team Formation Screen**:
- Post-Goal-submission overlay/modal
- 7 agent cards animate in sequentially (500ms apart)
- Progress bar shows pipeline steps completing
- Auto-navigate to roadmap when done

**Onboarding Polish**:
- Smooth transitions between steps
- Real loading animation while agents run
- Error handling screens (retry buttons)
- "Welcome back" flow for returning users (skip to dashboard)

**Deliverables**:
- [ ] Full onboarding → agent formation → roadmap flow is smooth and polished
- [ ] Error states handled gracefully
- [ ] Returning users skip to dashboard

---

### ⏰ Hours 11–12: Progress Dashboard + Deploy

#### Hour 11: Progress Dashboard

**Progress Agent** (lightweight, not LLM):
- Calculate completion % from `daily_tasks` table
- Calculate streak from `activity_log` in `progress` table
- Update `progress` table on task completion

**Progress Route**:
- `GET /api/v1/progress/:roadmap_id` → return complete progress object

**Frontend Progress Page**:
- Stat cards: completion %, streak, milestones done, tasks today
- 52-week heatmap (GitHub-style svg component)
- Milestone completion list
- Quiz score history table/chart

**Deliverables**:
- [ ] Progress dashboard fully functional
- [ ] Heatmap shows activity
- [ ] Stats accurate and updating

---

#### Hour 12: Polish, Bug Fixes & Deploy

**Bug Fix Pass**:
- [ ] Test complete user journey: Register → Onboard → Roadmap → Planner → Resources → Project → Quiz → Progress
- [ ] Fix any broken API calls or UI glitches
- [ ] Verify RLS prevents cross-user data access

**Deployment**:
```bash
# Frontend → Vercel
vercel deploy --prod

# Backend → Railway
# Push to main branch → Railway auto-deploys
# Set environment variables in Railway dashboard

# Configure Supabase
# - Set CORS allowed origins to Vercel URL
# - Enable email auth + Google OAuth in Auth settings
```

**Post-Deploy Checklist**:
- [ ] Vercel frontend live and loading
- [ ] Railway backend API responding (`/health`)
- [ ] Supabase RLS working in production
- [ ] End-to-end user flow works on production URL

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Gemini API quota reached | Medium | Implement OpenAI fallback in gemini.service.ts |
| LLM response doesn't match schema | High | Zod validation + retry with simplified prompt |
| Planner generates too many tasks | Medium | Hard cap at `daily_budget * 1.1` minutes per day |
| Supabase RLS blocking legitimate requests | Low | Test each endpoint with different user tokens |
| Next.js build fails on Vercel | Low | Test production build locally before deploy |

---

## Dependencies & Package Versions

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.0",
    "axios": "^1.7.0"
  }
}
```

### Backend (`package.json`)
```json
{
  "dependencies": {
    "express": "^4.19.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "@supabase/supabase-js": "^2.45.0",
    "@google/generative-ai": "^0.15.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.1.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/node": "^20.0.0"
  }
}
```
