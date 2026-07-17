# SkillVerse — API Reference

> **Version**: 1.0 — MVP  
> **Base URL**: `http://localhost:3001/api/v1` (development)  
> **Auth**: All endpoints (except `/auth/*`) require `Authorization: Bearer <jwt_token>`  
> **Last Updated**: 2026-07-17  

---

## Authentication

All protected endpoints expect a Supabase JWT in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

---

## Standard Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { ... }   // optional, for validation errors
}
```

### Standard Error Codes

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `VALIDATION_ERROR` | Request body failed Zod schema validation |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Valid JWT but accessing another user's resource |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `SERVER_ERROR` | Internal server / LLM failure |
| 503 | `AI_UNAVAILABLE` | All LLM providers timed out |

---

## Auth Endpoints

### `POST /api/v1/auth/register`
Register a new user with email/password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "minLength8Characters"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt...",
      "refresh_token": "token...",
      "expires_at": 1234567890
    }
  }
}
```

---

### `POST /api/v1/auth/login`
Authenticate an existing user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "yourPassword"
}
```

**Response** `200 OK`: Same as register.

---

### `POST /api/v1/auth/logout`
🔒 Invalidate the current session.

**Response** `200 OK`:
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

## Goal Endpoint

### `POST /api/v1/goal`
🔒 Submit a learning goal and trigger the Goal Analyzer Agent.

**Request Body**:
```json
{
  "goal": "I want to become a backend developer using Node.js in 3 months",
  "skill_level": "beginner",          // optional: "beginner" | "intermediate" | "advanced"
  "hours_per_week": 10,               // optional: 1–40
  "deadline_weeks": 12                // optional: 1–52
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "profile_id": "uuid",
    "goal_analysis": {
      "domain": "Backend Web Development",
      "sub_topics": ["Node.js", "Express.js", "REST APIs", "PostgreSQL", "Auth"],
      "estimated_weeks": 12,
      "difficulty": "beginner",
      "confidence_score": 0.92,
      "summary": "You want to build backend web applications using Node.js and learn the core skills needed to be job-ready in 12 weeks."
    }
  }
}
```

**If confidence < 0.7** — `200 OK` with clarification request:
```json
{
  "success": true,
  "data": {
    "needs_clarification": true,
    "confidence_score": 0.45,
    "clarification_questions": [
      "What specific technologies do you want to learn?",
      "Do you have any programming experience already?",
      "What is your end goal — job, freelancing, or a personal project?"
    ]
  }
}
```

---

## Roadmap Endpoints

### `POST /api/v1/roadmap`
🔒 Generate a full roadmap from a processed goal profile.

**Request Body**:
```json
{
  "profile_id": "uuid"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "roadmap": {
      "id": "uuid",
      "title": "Backend Developer with Node.js — 12 Weeks",
      "total_weeks": 12,
      "start_date": "2026-07-17",
      "end_date": "2026-10-09",
      "status": "active"
    },
    "milestones": [
      {
        "id": "uuid",
        "sequence_number": 1,
        "title": "JavaScript Fundamentals",
        "description": "Master core JavaScript concepts needed for Node.js development.",
        "estimated_days": 14,
        "topics": ["Variables & Types", "Functions", "Promises & Async/Await", "ES6+ Syntax"],
        "learning_objectives": [
          "Write async JavaScript confidently",
          "Understand closures and the event loop"
        ],
        "status": "not_started"
      }
      // ... more milestones
    ]
  }
}
```

---

### `GET /api/v1/roadmap/:roadmap_id`
🔒 Retrieve an existing roadmap with all milestones.

**Response** `200 OK`: Same shape as POST /roadmap response data.

---

### `PATCH /api/v1/roadmap/:roadmap_id/milestones/:milestone_id`
🔒 Update milestone status.

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "milestone_id": "uuid",
    "status": "completed",
    "completed_at": "2026-07-25T10:30:00Z"
  }
}
```

---

## Daily Planner Endpoints

### `POST /api/v1/daily-plan`
🔒 Generate daily tasks for the full roadmap timeline.

**Request Body**:
```json
{
  "roadmap_id": "uuid"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "total_days": 84,
    "daily_tasks": [
      {
        "id": "uuid",
        "day_number": 1,
        "task_date": "2026-07-17",
        "title": "Introduction to JavaScript and Node.js",
        "description": "Read the official Node.js intro documentation and complete the first 3 exercises.",
        "task_type": "Read",
        "estimated_minutes": 45,
        "is_completed": false,
        "milestone_id": "uuid"
      }
      // ...
    ]
  }
}
```

---

### `GET /api/v1/daily-plan/:roadmap_id`
🔒 Retrieve all tasks for a roadmap.

**Query Params**:
- `date` (optional): ISO date string — filters to that specific day
- `day_number` (optional): integer — get tasks for a specific day number

**Response** `200 OK`: Array of DailyTask objects.

---

### `PATCH /api/v1/daily-plan/tasks/:task_id`
🔒 Mark a task as complete or incomplete.

**Request Body**:
```json
{
  "is_completed": true
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "task_id": "uuid",
    "is_completed": true,
    "completed_at": "2026-07-17T15:30:00Z",
    "streak_updated": true,
    "new_streak": 3
  }
}
```

---

## Resources Endpoints

### `POST /api/v1/resources`
🔒 Generate resources for all topics in a roadmap.

**Request Body**:
```json
{
  "roadmap_id": "uuid"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "uuid",
        "topic": "Promises & Async/Await",
        "title": "JavaScript Promises In 10 Minutes",
        "url": "https://www.youtube.com/watch?v=DHvZLI7Db8E",
        "resource_type": "Video",
        "estimated_minutes": 10,
        "difficulty": "beginner",
        "why_recommended": "Clear visual explanation of the Promise chain and async/await syntax.",
        "relevance_score": 0.95,
        "is_bookmarked": false
      }
      // ...
    ]
  }
}
```

---

### `PATCH /api/v1/resources/:resource_id/bookmark`
🔒 Toggle bookmark on a resource.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "resource_id": "uuid",
    "is_bookmarked": true
  }
}
```

---

## Projects Endpoints

### `POST /api/v1/projects`
🔒 Generate capstone projects for all milestones in a roadmap.

**Request Body**:
```json
{
  "roadmap_id": "uuid"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "milestone_id": "uuid",
        "title": "Build a CLI To-Do App",
        "description": "Create a command-line task manager using Node.js that persists data to a JSON file.",
        "objective": "Apply JavaScript fundamentals and Node.js file system module",
        "tech_stack": ["Node.js", "JavaScript", "fs module"],
        "steps": [
          {
            "step_number": 1,
            "title": "Set up the project",
            "description": "Initialize a Node.js project and create the entry file.",
            "hint": "Use `npm init -y` and create `index.js`",
            "hint_revealed": false
          }
        ],
        "deliverable": "A working CLI app that can add, list, complete, and delete tasks",
        "estimated_hours": 4,
        "status": "not_started"
      }
    ]
  }
}
```

---

### `POST /api/v1/projects/:project_id/ask`
🔒 Ask the Project Mentor Agent a question about the project.

**Request Body**:
```json
{
  "question": "How do I read and write JSON files in Node.js?"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "answer": "Great question! Think about what built-in Node.js module handles file operations. Have you looked at `fs.readFileSync` and `fs.writeFileSync`? What do you think would happen if the file doesn't exist yet?"
  }
}
```

---

### `PATCH /api/v1/projects/:project_id/steps/:step_number/reveal-hint`
🔒 Reveal the hint for a specific project step.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "hint": "Use `npm init -y` and create `index.js`"
  }
}
```

---

## Quiz Endpoints

### `POST /api/v1/quiz`
🔒 Generate quizzes for all topics in a milestone.

**Request Body**:
```json
{
  "milestone_id": "uuid"
}
```

**Response** `201 Created`: Array of Quiz objects per topic.

---

### `POST /api/v1/quiz/:quiz_id/answer`
🔒 Submit an answer for a quiz question.

**Request Body**:
```json
{
  "question_id": "uuid",
  "answer": "Promises"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "correct_answer": "Promises",
    "explanation": "Promises represent a value that may be available now, in the future, or never. They are the foundation of async/await syntax.",
    "score_so_far": { "correct": 3, "total_answered": 4 }
  }
}
```

---

### `POST /api/v1/quiz/:quiz_id/complete`
🔒 Finalize a quiz and compute the final score.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "score": 7,
    "max_score": 10,
    "percentage": 70,
    "passed": true,
    "flagged_questions": ["uuid-of-question-2", "uuid-of-question-6"]
  }
}
```

---

## Progress Endpoint

### `GET /api/v1/progress/:roadmap_id`
🔒 Fetch aggregated progress for a roadmap.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "roadmap_id": "uuid",
    "total_tasks": 84,
    "completed_tasks": 23,
    "completion_percentage": 27.38,
    "current_streak": 5,
    "longest_streak": 8,
    "last_activity_date": "2026-07-17",
    "total_milestones": 6,
    "completed_milestones": 1,
    "tasks_today": {
      "planned": 3,
      "completed": 2
    },
    "activity_log": [
      { "date": "2026-07-17", "tasks_completed": 2, "minutes_spent": 75 },
      { "date": "2026-07-16", "tasks_completed": 3, "minutes_spent": 90 }
    ]
  }
}
```
