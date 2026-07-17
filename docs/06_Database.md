# SkillVerse Database Architecture

> **Version**: 2.0 — Production-Ready  
> **Database Engine**: PostgreSQL 15+ (Optimized for Supabase)  
> **Last Updated**: 2026-07-17  

---

## 1. Entity Relationship (ER) Diagram

Below is the visual map representing the 17 tables, their columns, keys, and relational cardinality.

```mermaid
erDiagram
  users {
    uuid id PK "REFERENCES auth.users(id)"
    text email "UNIQUE"
    user_role_enum role "DEFAULT 'student'"
    timestamptz created_at
    timestamptz updated_at
  }
  profiles {
    uuid id PK
    uuid user_id FK "UNIQUE REFERENCES public.users(id)"
    text full_name
    text avatar_url
    text bio
    jsonb preferences "DEFAULT {}"
    timestamptz created_at
    timestamptz updated_at
  }
  learning_goals {
    uuid id PK
    uuid user_id FK "REFERENCES public.users(id)"
    text title
    text raw_goal "CHECK (10 to 1000 chars)"
    date target_date
    skill_level_enum skill_level "DEFAULT 'beginner'"
    smallint hours_per_week "CHECK (1 to 168)"
    smallint duration_weeks "CHECK (1 to 104)"
    goal_status_enum status "DEFAULT 'active'"
    jsonb analyzed_payload "DEFAULT {}"
    timestamptz created_at
    timestamptz updated_at
  }
  roadmaps {
    uuid id PK
    uuid user_id FK
    uuid goal_id FK
    text title
    text description
    smallint total_weeks "CHECK (>0)"
    date start_date
    date end_date
    roadmap_status_enum status
    timestamptz created_at
    timestamptz updated_at
  }
  roadmap_modules {
    uuid id PK
    uuid user_id FK
    uuid roadmap_id FK
    smallint sequence_number "CHECK (>0)"
    text title
    text description
    smallint estimated_days "CHECK (>0)"
    jsonb topics "DEFAULT []"
    module_status_enum status
    timestamptz created_at
    timestamptz updated_at
  }
  daily_plans {
    uuid id PK
    uuid user_id FK
    uuid roadmap_id FK
    uuid module_id FK
    smallint day_number
    date plan_date
    text focus_topic
    boolean is_completed "DEFAULT FALSE"
    timestamptz created_at
    timestamptz updated_at
  }
  resources {
    uuid id PK
    uuid user_id FK
    uuid module_id FK
    text title
    text url "CHECK REGEX"
    resource_type_enum resource_type
    smallint estimated_minutes "CHECK (>0)"
    text why_recommended
    boolean is_completed "DEFAULT FALSE"
    timestamptz created_at
    timestamptz updated_at
  }
  tasks {
    uuid id PK
    uuid user_id FK
    uuid plan_id FK
    uuid module_id FK
    text title
    text description
    task_type_enum task_type
    smallint estimated_minutes "CHECK (>0)"
    task_status_enum status "DEFAULT 'pending'"
    uuid resource_id FK
    timestamptz completed_at
    timestamptz created_at
    timestamptz updated_at
  }
  projects {
    uuid id PK
    uuid user_id FK
    uuid module_id FK "UNIQUE"
    text title
    text description
    text requirements
    jsonb tech_stack "DEFAULT []"
    jsonb steps "DEFAULT []"
    smallint estimated_hours "CHECK (>0)"
    timestamptz created_at
    timestamptz updated_at
  }
  project_progress {
    uuid id PK
    uuid user_id FK
    uuid project_id FK
    project_status_enum status "DEFAULT 'not_started'"
    timestamptz started_at
    timestamptz completed_at
    jsonb qa_history
    jsonb steps_completed
    text submission_link
    text tutor_review
    timestamptz created_at
    timestamptz updated_at
  }
  quizzes {
    uuid id PK
    uuid user_id FK
    uuid module_id FK
    text title
    smallint max_score "CHECK (>0)"
    smallint pass_percentage "CHECK (0 to 100)"
    timestamptz created_at
    timestamptz updated_at
  }
  quiz_questions {
    uuid id PK
    uuid quiz_id FK
    text question_text
    jsonb options
    smallint correct_option_index
    text explanation
    timestamptz created_at
    timestamptz updated_at
  }
  quiz_attempts {
    uuid id PK
    uuid user_id FK
    uuid quiz_id FK
    smallint score "CHECK (>=0)"
    boolean passed
    jsonb answers_submitted
    timestamptz started_at
    timestamptz completed_at
    timestamptz created_at
    timestamptz updated_at
  }
  progress {
    uuid id PK
    uuid user_id FK
    uuid roadmap_id FK "UNIQUE"
    smallint total_tasks "DEFAULT 0"
    smallint completed_tasks "DEFAULT 0"
    numeric completion_percentage "DEFAULT 0.0"
    smallint current_streak "DEFAULT 0"
    smallint longest_streak "DEFAULT 0"
    date last_activity_date
    smallint total_modules "DEFAULT 0"
    smallint completed_modules "DEFAULT 0"
    jsonb activity_log "DEFAULT []"
    timestamptz created_at
    timestamptz updated_at
  }
  agent_logs {
    uuid id PK
    uuid user_id FK
    agent_type_enum agent_name
    log_level_enum log_level "DEFAULT 'info'"
    text message
    jsonb metadata "DEFAULT {}"
    timestamptz created_at
    timestamptz updated_at
  }
  learning_sessions {
    uuid id PK
    uuid user_id FK
    uuid task_id FK
    smallint focus_minutes "CHECK (>0)"
    text session_notes
    date session_date "DEFAULT CURRENT_DATE"
    timestamptz created_at
    timestamptz updated_at
  }
  notifications {
    uuid id PK
    uuid user_id FK
    text title
    text message
    boolean is_read "DEFAULT FALSE"
    notification_type_enum notification_type "DEFAULT 'info'"
    text link_to
    timestamptz created_at
    timestamptz updated_at
  }

  users ||--|| profiles : "has profile"
  users ||--o{ learning_goals : "defines goals"
  users ||--o{ roadmaps : "follows roadmaps"
  learning_goals ||--o{ roadmaps : "generates roadmaps"
  roadmaps ||--o{ roadmap_modules : "contains modules"
  roadmap_modules ||--o{ daily_plans : "schedules plans"
  roadmap_modules ||--o{ resources : "contains resources"
  roadmap_modules ||--o{ projects : "evaluates modules"
  roadmap_modules ||--o{ quizzes : "assesses knowledge"
  daily_plans ||--o{ tasks : "hosts tasks"
  resources ||--o{ tasks : "referenced in tasks"
  projects ||--o{ project_progress : "tracks projects"
  quizzes ||--o{ quiz_questions : "composes quiz"
  quizzes ||--o{ quiz_attempts : "stores results"
  roadmaps ||--|| progress : "aggregates progress"
  users ||--o{ agent_logs : "triggers agent actions"
  users ||--o{ learning_sessions : "logs study time"
  users ||--o{ notifications : "receives alerts"
```

---

## 2. PostgreSQL Enumerated Types (Enums)

We instantiate 13 strict types to reinforce relational integrity:
1. `user_role_enum`: Supports role-based access management (`student`, `admin`, `tutor`).
2. `skill_level_enum`: Standardized cognitive levels (`beginner`, `intermediate`, `advanced`).
3. `goal_status_enum`: Lifecycle of user learning aspirations (`active`, `completed`, `archived`).
4. `roadmap_status_enum`: States for a generated syllabus (`active`, `completed`, `paused`).
5. `module_status_enum`: Workflow status of a module (`not_started`, `in_progress`, `completed`).
6. `task_type_enum`: Modes of task completion (`read`, `watch`, `practice`, `build`, `quiz`).
7. `task_status_enum`: Completion state transitions (`pending`, `completed`).
8. `resource_type_enum`: Modality of materials (`article`, `video`, `course`, `documentation`, `tool`).
9. `project_status_enum`: Submission state for capstones (`not_started`, `in_progress`, `completed`).
10. `quiz_status_enum`: Accessibility states (`draft`, `published`, `completed`).
11. `agent_type_enum`: Strict naming for the 8 AI agents (`goal_analyzer`, `curriculum_architect`, `resource_curator`, `assessment_creator`, `study_planner`, `progress_tracker`, `interactive_tutor`, `orchestrator`).
12. `log_level_enum`: Standard logging thresholds (`info`, `warning`, `error`, `debug`).
13. `notification_type_enum`: Banner alert themes (`info`, `success`, `warning`, `achievement`).

---

## 3. Database Triggers (Automations)

### A. Auto-Updated Timestamps
All tables run an `update_updated_at_column()` trigger which automatically overwrites the `updated_at` column during row edits:
```sql
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### B. Supabase Auth Synchronizer
When a user signs up on Supabase Auth, they are created in the core authenticated table (`auth.users`). We bind a trigger (`on_auth_user_created`) to automatically insert matching database rows into `public.users` and `public.profiles`, making authentication seamless.

### C. Automatic Progress Tracker
When a user marks a task completed (status set to `'completed'`), the `on_task_status_changed` trigger recalculates the total tasks, completed tasks, and `completion_percentage` in `public.progress` for the active roadmap. It also updates the module-count metrics and updates the `last_activity_date`.

---

## 4. Row Level Security (RLS) & Security Policies

Supabase requires defensive backend design. Therefore, **all 17 tables** have row level security enabled. Users are locked into sandbox visibility, using the following baseline policy matching:
- **Direct Ownership**: `auth.uid() = user_id` for profile, goals, roadmaps, modules, plans, tasks, progress, logs, sessions, and notifications.
- **Relational Access**: Tables without direct `user_id` links (like `quiz_questions`) utilize subquery verification:
  ```sql
  CREATE POLICY "Users read authorized quiz questions" ON public.quiz_questions 
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.user_id = auth.uid()
    ));
  ```
- **Admin Elevation**: System administrators override restrictions using a role-based check:
  ```sql
  CREATE POLICY "Admins read all credentials" ON public.users 
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role_enum
    ));
  ```

---

## 5. Performance Tuning (Indexes)

To keep API requests snappy, b-tree indexes are compiled for all foreign-key lookups, composite lookups, and range searches.
For example:
- Unique index on `roadmap_modules(roadmap_id, sequence_number)` for curriculum lists.
- Composite index on `daily_plans(roadmap_id, day_number)` for plan lookups.
- Partial index on `notifications` to only scan unread alerts:
  ```sql
  CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;
  ```

---

## 6. Accessing files

The schema files are stored locally in the workspace:
1. Schema Migration: [/supabase/migrations/20260717000000_init_skillverse_db.sql](file:///c:/Users/sravy/OneDrive/Desktop/SkillVerse/supabase/migrations/20260717000000_init_skillverse_db.sql)
2. Mock Seed Data: [/supabase/seed.sql](file:///c:/Users/sravy/OneDrive/Desktop/SkillVerse/supabase/seed.sql)
