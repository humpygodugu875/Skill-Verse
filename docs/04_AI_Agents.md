# SkillVerse — AI Agents Specification

> **Version**: 1.0 — MVP  
> **Last Updated**: 2026-07-17  

---

## Overview

SkillVerse uses **7 specialized AI agents** orchestrated in a sequential pipeline. Each agent has a specific role, takes structured inputs from the previous agent, and returns structured JSON output that is immediately persisted to the database.

All agents communicate with **Gemini 1.5 Pro** via the Google Generative AI SDK, using JSON-mode output for type-safe parsing.

---

## Agent Pipeline Summary

```
User Goal Input
       ↓
1. Goal Analyzer Agent
       ↓ GoalAnalysis JSON
2. Curriculum Agent
       ↓ Milestones[] JSON
3. Planner Agent
       ↓ DailyTasks[] JSON
4. Resource Finder Agent
       ↓ Resources[] JSON
5. Project Mentor Agent
       ↓ Projects[] JSON
6. Quiz Generator Agent
       ↓ Quizzes[] JSON
7. Progress Agent
       ↓ Initial Progress Record
```

---

## Agent 1: Goal Analyzer Agent

### Responsibility
Parses the user's free-form goal text into a structured learning objective. Determines domain, sub-topics, difficulty, and feasibility.

### Input
```typescript
interface GoalAnalyzerInput {
  goal: string;                    // raw user input, e.g. "become a backend dev in 3 months"
  skill_level?: "beginner" | "intermediate" | "advanced";
  hours_per_week?: number;         // 1–40
  deadline_weeks?: number;         // 1–52
}
```

### Output
```typescript
interface GoalAnalysis {
  domain: string;                  // e.g., "Backend Web Development"
  sub_topics: string[];            // e.g., ["Node.js", "REST APIs", "Databases", "Auth"]
  estimated_weeks: number;         // realistic timeline estimate
  difficulty: "beginner" | "intermediate" | "advanced";
  confidence_score: number;        // 0.0–1.0; if < 0.7, return clarification_questions
  clarification_questions?: string[]; // 3 questions if confidence < 0.7
  summary: string;                 // 1-sentence confirmation of what the agent understood
}
```

### Behavior Rules
- If the goal is too broad (e.g. "learn everything"), set `confidence_score < 0.7` and return 3 targeted clarification questions
- If `skill_level` is not provided, infer from the goal text
- Cap `estimated_weeks` at `deadline_weeks` if provided; flag if timeline is unrealistic

### Prompt Reference
See `10_Prompts.md` → `PROMPT_GOAL_ANALYZER`

---

## Agent 2: Curriculum Agent

### Responsibility
Takes the GoalAnalysis and designs a structured milestone-based curriculum — the "what to learn" at a high level.

### Input
```typescript
interface CurriculumAgentInput {
  goal_analysis: GoalAnalysis;
  user_id: string;
}
```

### Output
```typescript
interface CurriculumOutput {
  roadmap_title: string;
  milestones: Milestone[];
}

interface Milestone {
  sequence_number: number;         // 1-based ordering
  title: string;                   // e.g., "JavaScript Fundamentals"
  description: string;             // 2–3 sentence explanation
  estimated_days: number;          // realistic duration
  topics: string[];                // specific sub-topics for this milestone
  learning_objectives: string[];   // what the learner will be able to do
}
```

### Behavior Rules
- Generate 3–8 milestones (more = smaller milestones; fewer = broader)
- Milestones MUST follow logical prerequisite order
- Each milestone's `estimated_days` must sum close to `goal_analysis.estimated_weeks * 7`
- Include a "Foundation" milestone first and a "Capstone/Apply" milestone last

### Prompt Reference
See `10_Prompts.md` → `PROMPT_CURRICULUM`

---

## Agent 3: Planner Agent

### Responsibility
Breaks the milestone-based curriculum into actionable daily tasks, fitting the user's schedule.

### Input
```typescript
interface PlannerAgentInput {
  milestones: Milestone[];
  hours_per_week: number;          // default: 7 if not provided
  start_date: string;              // ISO 8601 date
}
```

### Output
```typescript
interface PlannerOutput {
  daily_tasks: DailyTask[];
}

interface DailyTask {
  day_number: number;              // Day 1, 2, 3...
  date: string;                    // ISO 8601 date
  milestone_sequence: number;      // which milestone this belongs to
  title: string;
  type: "Read" | "Watch" | "Practice" | "Build" | "Quiz";
  estimated_minutes: number;       // should not exceed daily_budget_minutes per day
  description: string;             // what specifically to do
}
```

### Behavior Rules
- Daily budget = `(hours_per_week / 7) * 60` minutes
- Never assign more tasks than the daily budget allows
- Weekends should have slightly lighter task loads if possible
- Task types should vary (not 5 consecutive "Read" tasks)
- "Quiz" tasks link to Quiz Agent output for that topic

### Prompt Reference
See `10_Prompts.md` → `PROMPT_PLANNER`

---

## Agent 4: Resource Finder Agent

### Responsibility
Generates curated high-quality learning resources for each topic in the curriculum. In MVP, resources are LLM-generated recommendations (no live web search).

### Input
```typescript
interface ResourceFinderInput {
  topics: string[];                // all unique topics from all milestones
  domain: string;                  // from GoalAnalysis
  difficulty: string;              // from GoalAnalysis
}
```

### Output
```typescript
interface ResourceFinderOutput {
  resources: Resource[];
}

interface Resource {
  topic: string;                   // which topic this resource covers
  title: string;
  url: string;                     // real, plausible URL (best-effort in MVP)
  type: "Article" | "Video" | "Course" | "Documentation" | "Tool";
  estimated_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  why_recommended: string;         // 1-sentence rationale
  relevance_score: number;         // 0.0–1.0
}
```

### Behavior Rules
- Generate 3–5 resources per topic
- Prioritize free resources; include at least 1 official documentation link where applicable
- URLs must be **real, well-known resources** (MDN, official docs, YouTube channels, freeCodeCamp, etc.) — not hallucinated URLs
- Sort by `relevance_score` descending within each topic

### Prompt Reference
See `10_Prompts.md` → `PROMPT_RESOURCE_FINDER`

---

## Agent 5: Project Mentor Agent

### Responsibility
Designs a practical capstone project per milestone that forces the learner to apply everything they've learned in that milestone.

### Input
```typescript
interface ProjectMentorInput {
  milestone: Milestone;
  domain: string;
  difficulty: string;
}
```

### Output
```typescript
interface ProjectOutput {
  project: Project;
}

interface Project {
  title: string;
  description: string;             // 2–4 sentences
  objective: string;               // single clear goal
  tech_stack: string[];            // tools/technologies to use
  steps: ProjectStep[];
  deliverable: string;             // what the final artifact should be
  estimated_hours: number;
}

interface ProjectStep {
  step_number: number;
  title: string;
  description: string;             // what to do in this step
  hint: string;                    // a guiding hint (revealed on demand)
}
```

### Behavior Rules
- Project MUST be realistic for the milestone's difficulty level
- Steps: 4–8 steps minimum
- Hints should guide without giving away the answer
- Tech stack must match the milestone's topics exactly

### Q&A Behavior
When user asks a project question, agent receives:
```typescript
interface ProjectQAInput {
  project: Project;
  question: string;
  conversation_history: { role: "user" | "mentor", message: string }[];
}
```
And returns a helpful, Socratic response that guides without directly solving.

### Prompt Reference
See `10_Prompts.md` → `PROMPT_PROJECT_MENTOR`, `PROMPT_PROJECT_QA`

---

## Agent 6: Quiz Generator Agent

### Responsibility
Creates topic-specific quizzes with multiple choice and true/false questions, including explanations for every answer.

### Input
```typescript
interface QuizGeneratorInput {
  topic: string;
  milestone_topics: string[];      // broader context
  difficulty: string;
  num_questions?: number;          // default: 7
}
```

### Output
```typescript
interface QuizOutput {
  topic: string;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  type: "mcq" | "true_false";
  question: string;
  options: string[];               // 4 options for mcq, ["True", "False"] for tf
  correct_answer: string;          // must exactly match one of the options
  explanation: string;             // why that answer is correct
  difficulty: "easy" | "medium" | "hard";
}
```

### Behavior Rules
- Mix question difficulties: ~40% easy, ~40% medium, ~20% hard
- True/False questions must be unambiguously true or false
- Explanations must be educational (explain the concept, not just confirm the answer)
- No duplicate questions within the same quiz

### Prompt Reference
See `10_Prompts.md` → `PROMPT_QUIZ_GENERATOR`

---

## Agent 7: Progress Agent

### Responsibility
Initializes the progress record for a user's learning journey and provides streak/completion calculations. (Mostly computational in MVP, not LLM-heavy.)

### Input
```typescript
interface ProgressAgentInput {
  user_id: string;
  roadmap_id: string;
  milestones: Milestone[];
  daily_tasks: DailyTask[];
}
```

### Output
```typescript
interface ProgressOutput {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  current_streak: number;
  longest_streak: number;
  milestones_completed: number;
  activity_log: ActivityLogEntry[];  // for heatmap
}

interface ActivityLogEntry {
  date: string;                    // ISO date
  tasks_completed: number;
  minutes_spent: number;
}
```

### Behavior Rules
- Streak resets to 0 if no task is completed on a given calendar day
- Completion % = `completed_tasks / total_tasks * 100`
- This agent runs on every task completion (via a lightweight recalculation, not a full LLM call)

---

## Agent Orchestrator

The orchestrator (`server/src/agents/orchestrator.ts`) manages the full pipeline:

```typescript
class AgentOrchestrator {
  async runFullPipeline(input: GoalAnalyzerInput): Promise<PipelineResult> {
    const goalAnalysis = await goalAnalyzerAgent(input);
    const curriculum = await curriculumAgent({ goal_analysis: goalAnalysis });
    const planner = await plannerAgent({ milestones: curriculum.milestones, ... });
    const resources = await resourceFinderAgent({ topics: allTopics, ... });
    const projects = await projectMentorAgent({ milestones: curriculum.milestones, ... });
    const quizzes = await quizGeneratorAgent({ topics: allTopics, ... });
    await progressAgent({ user_id, roadmap_id, ... });
    
    return { goalAnalysis, curriculum, planner, resources, projects, quizzes };
  }
}
```

All results are persisted to the database at each step so partial recovery is possible if a later agent fails.
