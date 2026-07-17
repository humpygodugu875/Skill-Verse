-- =========================================================================
-- Migration: Initialize SkillVerse Database Schema
-- Database: Supabase / PostgreSQL 15+
-- Description: Create All 17 tables, Enums, Constraints, Triggers, Indexes, 
--              and RLS Policies for the Multi-Agent AI Learning Platform.
-- =========================================================================

-- Start Transaction
BEGIN;

-- ==========================================
-- 0. Dropping triggers and tables if exist
--    (Safe for scratch redeploys)
-- ==========================================

-- Drop tables CASCADE automatically cleans up their triggers, indexes, and constraints
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.learning_sessions CASCADE;
DROP TABLE IF EXISTS public.agent_logs CASCADE;
DROP TABLE IF EXISTS public.progress CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.project_progress CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.daily_plans CASCADE;
DROP TABLE IF EXISTS public.roadmap_modules CASCADE;
DROP TABLE IF EXISTS public.roadmaps CASCADE;
DROP TABLE IF EXISTS public.learning_goals CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop Enums if they exist
DROP TYPE IF EXISTS public.user_role_enum CASCADE;
DROP TYPE IF EXISTS public.skill_level_enum CASCADE;
DROP TYPE IF EXISTS public.goal_status_enum CASCADE;
DROP TYPE IF EXISTS public.roadmap_status_enum CASCADE;
DROP TYPE IF EXISTS public.module_status_enum CASCADE;
DROP TYPE IF EXISTS public.task_type_enum CASCADE;
DROP TYPE IF EXISTS public.task_status_enum CASCADE;
DROP TYPE IF EXISTS public.resource_type_enum CASCADE;
DROP TYPE IF EXISTS public.project_status_enum CASCADE;
DROP TYPE IF EXISTS public.quiz_status_enum CASCADE;
DROP TYPE IF EXISTS public.agent_type_enum CASCADE;
DROP TYPE IF EXISTS public.log_level_enum CASCADE;
DROP TYPE IF EXISTS public.notification_type_enum CASCADE;

-- Drop active triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions CASCADE
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_progress_on_task_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ==========================================
-- 1. Create Enums
-- ==========================================
CREATE TYPE public.user_role_enum AS ENUM ('student', 'admin', 'tutor');
CREATE TYPE public.skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.goal_status_enum AS ENUM ('active', 'completed', 'archived');
CREATE TYPE public.roadmap_status_enum AS ENUM ('active', 'completed', 'paused');
CREATE TYPE public.module_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE public.task_type_enum AS ENUM ('read', 'watch', 'practice', 'build', 'quiz');
CREATE TYPE public.task_status_enum AS ENUM ('pending', 'completed');
CREATE TYPE public.resource_type_enum AS ENUM ('article', 'video', 'course', 'documentation', 'tool');
CREATE TYPE public.project_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE public.quiz_status_enum AS ENUM ('draft', 'published', 'completed');
CREATE TYPE public.agent_type_enum AS ENUM ('goal_analyzer', 'curriculum_architect', 'resource_curator', 'assessment_creator', 'study_planner', 'progress_tracker', 'interactive_tutor', 'orchestrator');
CREATE TYPE public.log_level_enum AS ENUM ('info', 'warning', 'error', 'debug');
CREATE TYPE public.notification_type_enum AS ENUM ('info', 'success', 'warning', 'achievement');

-- ==========================================
-- 2. Create Trigger Functions
-- ==========================================

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. Create Tables
-- ==========================================

-- Table 1: Users (Linked to auth.users in Supabase)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role public.user_role_enum DEFAULT 'student'::public.user_role_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 2: Profiles (Extended user descriptors)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Table 3: Learning Goals (Inputs & breakdowns)
CREATE TABLE public.learning_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    raw_goal TEXT NOT NULL CHECK (char_length(raw_goal) BETWEEN 10 AND 1000),
    target_date DATE,
    skill_level public.skill_level_enum DEFAULT 'beginner'::public.skill_level_enum NOT NULL,
    hours_per_week SMALLINT NOT NULL CHECK (hours_per_week BETWEEN 1 AND 168),
    duration_weeks SMALLINT NOT NULL CHECK (duration_weeks BETWEEN 1 AND 104),
    status public.goal_status_enum DEFAULT 'active'::public.goal_status_enum NOT NULL,
    analyzed_payload JSONB DEFAULT '{}'::jsonb NOT NULL, -- Core output of Goal Analyzer Agent
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 4: Roadmaps (Curriculum maps generated from goals)
CREATE TABLE public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    total_weeks SMALLINT NOT NULL CHECK (total_weeks > 0),
    start_date DATE DEFAULT CURRENT_DATE NOT NULL,
    end_date DATE,
    status public.roadmap_status_enum DEFAULT 'active'::public.roadmap_status_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 5: Roadmap Modules (Milestones within the curriculum)
CREATE TABLE public.roadmap_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    sequence_number SMALLINT NOT NULL CHECK (sequence_number > 0),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_days SMALLINT NOT NULL CHECK (estimated_days > 0),
    topics JSONB DEFAULT '[]'::jsonb NOT NULL, -- List of topics (strings)
    status public.module_status_enum DEFAULT 'not_started'::public.module_status_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_roadmap_module_sequence UNIQUE (roadmap_id, sequence_number)
);

-- Table 6: Daily Plans (Planner Agent structures)
CREATE TABLE public.daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.roadmap_modules(id) ON DELETE CASCADE,
    day_number SMALLINT NOT NULL CHECK (day_number > 0),
    plan_date DATE NOT NULL,
    focus_topic TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_daily_plan_day UNIQUE (roadmap_id, day_number)
);

-- Table 7: Resources (Aggregated from Resource Curator Agent)
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.roadmap_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL CHECK (url ~* '^https?://[^\s/$.?#].[^\s]*$'),
    resource_type public.resource_type_enum NOT NULL,
    estimated_minutes SMALLINT CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
    why_recommended TEXT,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 8: Tasks (Action items for each day)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.roadmap_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type public.task_type_enum NOT NULL,
    estimated_minutes SMALLINT NOT NULL CHECK (estimated_minutes > 0),
    status public.task_status_enum DEFAULT 'pending'::public.task_status_enum NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 9: Projects (Capstone projects)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.roadmap_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    tech_stack JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array of strings
    steps JSONB DEFAULT '[]'::jsonb NOT NULL,  -- Structured JSON array of steps
    estimated_hours SMALLINT CHECK (estimated_hours > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_project_per_module UNIQUE (module_id)
);

-- Table 10: Project Progress (Individual progress tracker for projects)
CREATE TABLE public.project_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    status public.project_status_enum DEFAULT 'not_started'::public.project_status_enum NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    qa_history JSONB DEFAULT '[]'::jsonb NOT NULL, -- Conversation log with Tutor Agent
    steps_completed JSONB DEFAULT '[]'::jsonb NOT NULL, -- Indexes of finished steps
    submission_link TEXT,
    tutor_review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_project UNIQUE (user_id, project_id)
);

-- Table 11: Quizzes (Quiz containers)
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.roadmap_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    max_score SMALLINT NOT NULL CHECK (max_score > 0),
    pass_percentage SMALLINT DEFAULT 70 NOT NULL CHECK (pass_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 12: Quiz Questions (List of questions)
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb NOT NULL, -- string[]
    correct_option_index SMALLINT NOT NULL CHECK (correct_option_index >= 0),
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 13: Quiz Attempts (User responses)
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score SMALLINT NOT NULL CHECK (score >= 0),
    passed BOOLEAN NOT NULL,
    answers_submitted JSONB DEFAULT '{}'::jsonb NOT NULL, -- { question_id: selected_index }
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 14: Progress (Historical data & streak logs)
CREATE TABLE public.progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    total_tasks SMALLINT DEFAULT 0 NOT NULL CHECK (total_tasks >= 0),
    completed_tasks SMALLINT DEFAULT 0 NOT NULL CHECK (completed_tasks >= 0),
    completion_percentage NUMERIC(5,2) DEFAULT 0.00 NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100),
    current_streak SMALLINT DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
    longest_streak SMALLINT DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
    last_activity_date DATE,
    total_modules SMALLINT DEFAULT 0 NOT NULL CHECK (total_modules >= 0),
    completed_modules SMALLINT DEFAULT 0 NOT NULL CHECK (completed_modules >= 0),
    activity_log JSONB DEFAULT '[]'::jsonb NOT NULL, -- [{ date: '2026-07-17', count: 5 }]
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_roadmap_progress UNIQUE (user_id, roadmap_id)
);

-- Table 15: Agent Logs (Telemetry log files for AI steps)
CREATE TABLE public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_name public.agent_type_enum NOT NULL,
    log_level public.log_level_enum DEFAULT 'info'::public.log_level_enum NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- thoughts, tools used, responses
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 16: Learning Sessions (Pomodoro / tracked learning duration)
CREATE TABLE public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    focus_minutes SMALLINT NOT NULL CHECK (focus_minutes > 0),
    session_notes TEXT,
    session_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 17: Notifications (In-app messages and alerts)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    notification_type public.notification_type_enum DEFAULT 'info'::public.notification_type_enum NOT NULL,
    link_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- ==========================================
-- 4. Apply Triggers for updated_at column
-- ==========================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_goals_updated_at BEFORE UPDATE ON public.learning_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON public.roadmaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roadmap_modules_updated_at BEFORE UPDATE ON public.roadmap_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_plans_updated_at BEFORE UPDATE ON public.daily_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_progress_updated_at BEFORE UPDATE ON public.project_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON public.progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_logs_updated_at BEFORE UPDATE ON public.agent_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON public.learning_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- 5. Set up User Auto-Creation Trigger
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Sync auth.users with public.users
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student'::public.user_role_enum);

  -- 2. Create default profile for the user
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 6. Set up Task Progress Sync Trigger
-- ==========================================
CREATE OR REPLACE FUNCTION public.sync_progress_on_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_roadmap_id UUID;
  v_user_id UUID;
  v_total_tasks INT;
  v_completed_tasks INT;
  v_percentage NUMERIC(5,2);
  v_total_modules INT;
  v_completed_modules INT;
BEGIN
  -- Identify user_id and roadmap_id
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  SELECT roadmap_id INTO v_roadmap_id 
  FROM public.daily_plans 
  WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);

  IF v_roadmap_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Ensure a progress record exists
  INSERT INTO public.progress (user_id, roadmap_id)
  VALUES (v_user_id, v_roadmap_id)
  ON CONFLICT (user_id, roadmap_id) DO NOTHING;

  -- 1. Task calculations
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed'::public.task_status_enum)
  INTO v_total_tasks, v_completed_tasks
  FROM public.tasks t
  JOIN public.daily_plans dp ON t.plan_id = dp.id
  WHERE dp.roadmap_id = v_roadmap_id AND dp.user_id = v_user_id;

  IF v_total_tasks > 0 THEN
    v_percentage := ROUND((v_completed_tasks::numeric / v_total_tasks::numeric) * 100.0, 2);
  ELSE
    v_percentage := 0.00;
  END IF;

  -- 2. Module progress summary
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed'::public.module_status_enum)
  INTO v_total_modules, v_completed_modules
  FROM public.roadmap_modules
  WHERE roadmap_id = v_roadmap_id AND user_id = v_user_id;

  -- 3. Update progress row
  UPDATE public.progress
  SET 
    total_tasks = v_total_tasks,
    completed_tasks = v_completed_tasks,
    completion_percentage = v_percentage,
    total_modules = v_total_modules,
    completed_modules = v_completed_modules,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE roadmap_id = v_roadmap_id AND user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_task_status_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.sync_progress_on_task_status_change();


-- ==========================================
-- 7. Create Indexes for Performance
-- ==========================================
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_goals_user ON public.learning_goals(user_id);
CREATE INDEX idx_roadmaps_user ON public.roadmaps(user_id);
CREATE INDEX idx_roadmaps_goal ON public.roadmaps(goal_id);
CREATE INDEX idx_modules_roadmap_sequence ON public.roadmap_modules(roadmap_id, sequence_number);
CREATE INDEX idx_plans_roadmap_day ON public.daily_plans(roadmap_id, day_number);
CREATE INDEX idx_plans_date ON public.daily_plans(user_id, plan_date);
CREATE INDEX idx_resources_module ON public.resources(module_id);
CREATE INDEX idx_tasks_plan ON public.tasks(plan_id);
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_projects_module ON public.projects(module_id);
CREATE INDEX idx_proj_progress_user ON public.project_progress(user_id);
CREATE INDEX idx_proj_progress_project ON public.project_progress(project_id);
CREATE INDEX idx_quizzes_module ON public.quizzes(module_id);
CREATE INDEX idx_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX idx_attempts_quiz_user ON public.quiz_attempts(quiz_id, user_id);
CREATE INDEX idx_progress_roadmap_lookup ON public.progress(user_id, roadmap_id);
CREATE INDEX idx_logs_agent_user ON public.agent_logs(agent_name, user_id);
CREATE INDEX idx_sessions_user_date ON public.learning_sessions(user_id, session_date);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;


-- ==========================================
-- 8. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 9. Create Row Level Security (RLS) Policies
-- ==========================================

-- USERS Table Policies
CREATE POLICY "Users read own profile credentials" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all credentials" ON public.users FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role_enum
));

-- PROFILES Table Policies
CREATE POLICY "Users view own profile details" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile details" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- LEARNING GOALS Table Policies
CREATE POLICY "Users manage own goals" ON public.learning_goals FOR ALL USING (auth.uid() = user_id);

-- ROADMAPS Table Policies
CREATE POLICY "Users manage own roadmaps" ON public.roadmaps FOR ALL USING (auth.uid() = user_id);

-- ROADMAP MODULES Table Policies
CREATE POLICY "Users manage own modules" ON public.roadmap_modules FOR ALL USING (auth.uid() = user_id);

-- DAILY PLANS Table Policies
CREATE POLICY "Users manage own daily plans" ON public.daily_plans FOR ALL USING (auth.uid() = user_id);

-- RESOURCES Table Policies
CREATE POLICY "Users manage own resources" ON public.resources FOR ALL USING (auth.uid() = user_id);

-- TASKS Table Policies
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- PROJECTS Table Policies
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- PROJECT PROGRESS Table Policies
CREATE POLICY "Users manage own project progress" ON public.project_progress FOR ALL USING (auth.uid() = user_id);

-- QUIZZES Table Policies
CREATE POLICY "Users manage own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);

-- QUIZ QUESTIONS Table Policies
CREATE POLICY "Users read authorized quiz questions" ON public.quiz_questions FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.user_id = auth.uid()
));
CREATE POLICY "Admins manage all quiz questions" ON public.quiz_questions FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role_enum
));

-- QUIZ ATTEMPTS Table Policies
CREATE POLICY "Users manage own attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- PROGRESS Table Policies
CREATE POLICY "Users see own progress analytics" ON public.progress FOR ALL USING (auth.uid() = user_id);

-- AGENT LOGS Table Policies
CREATE POLICY "Users read own agent interaction logs" ON public.agent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts logs for users" ON public.agent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- LEARNING SESSIONS Table Policies
CREATE POLICY "Users manage own focus sessions" ON public.learning_sessions FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS Table Policies
CREATE POLICY "Users manage own alerts" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Commit Database Transactions
COMMIT;
