-- =========================================================================
-- Seed Data: Populate SkillVerse Database for Local Dev / Testing
-- Targets: Users, Profiles, Goals, Roadmaps, Modules, Tasks, and Analytics
-- =========================================================================

BEGIN;

-- Variables to keep track of generated IDs
DO $$
DECLARE
  v_student_id UUID := 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
  v_admin_id   UUID := 'f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c';
  v_goal_id    UUID := '10101010-1010-1010-1010-101010101010';
  v_roadmap_id UUID := '20202020-2020-2020-2020-202020202020';
  v_mod1_id    UUID := '30303030-3030-3030-3030-303030303031';
  v_mod2_id    UUID := '30303030-3030-3030-3030-303030303032';
  v_plan1_id   UUID := '40404040-4040-4040-4040-404040404001';
  v_plan2_id   UUID := '40404040-4040-4040-4040-404040404002';
  v_res1_id    UUID := '50505050-5050-5050-5050-505050505001';
  v_res2_id    UUID := '50505050-5050-5050-5050-505050505002';
  v_task1_id   UUID := '60606060-6060-6060-6060-606060606001';
  v_task2_id   UUID := '60606060-6060-6060-6060-606060606002';
  v_task3_id   UUID := '60606060-6060-6060-6060-606060606003';
  v_proj_id    UUID := '70707070-7070-7070-7070-707070707001';
  v_quiz_id    UUID := '80808080-8080-8080-8080-808080808001';
  v_q1_id      UUID := '81818181-8181-8181-8181-818181818101';
  v_q2_id      UUID := '81818181-8181-8181-8181-818181818102';
BEGIN

  -- 1. Create standard entries in auth.users (Supabase managed schema)
  -- The handles on_auth_user_created trigger will auto-populate public.users and public.profiles
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  VALUES 
    (v_student_id, '00000000-0000-0000-0000-000000000000', 'alex.learner@skillverse.ai', '', NOW(), NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Alex Learner", "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}', NOW(), NOW(), 'authenticated', 'authenticated'),
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@skillverse.ai', '', NOW(), NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Super Admin", "avatar_url": ""}', NOW(), NOW(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Elevate admin user role
  UPDATE public.users 
  SET role = 'admin'::public.user_role_enum 
  WHERE id = v_admin_id;

  -- Update profiles with bios/preferences
  UPDATE public.profiles
  SET bio = 'Passionate developer looking to transition to Next.js Full Stack Development.',
      preferences = '{"theme": "dark", "daily_reminder_enabled": true}'::jsonb
  WHERE user_id = v_student_id;

  -- 3. Create Learning Goal
  INSERT INTO public.learning_goals (id, user_id, title, raw_goal, target_date, skill_level, hours_per_week, duration_weeks, status, analyzed_payload)
  VALUES (
    v_goal_id,
    v_student_id,
    'Master Next.js 16 and Supabase Integration',
    'I want to build a highly scalable SaaS platform using Next.js 16, Supabase, Tailwind, PostgreSql database, and deploy it to Vercel.',
    (CURRENT_DATE + INTERVAL '4 weeks')::date,
    'beginner'::public.skill_level_enum,
    15,
    4,
    'active'::public.goal_status_enum,
    '{
      "target_role": "Full-Stack SaaS Developer",
      "core_languages": ["HTML/JS/TS", "SQL"],
      "recommended_frameworks": ["Next.js 16", "Supabase PostgreSQL"],
      "analysis_meta": {
        "confidence_level": 0.95,
        "preconditions_checked": true
      }
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  -- 4. Create Roadmap
  INSERT INTO public.roadmaps (id, user_id, goal_id, title, description, total_weeks, start_date, end_date, status)
  VALUES (
    v_roadmap_id,
    v_student_id,
    v_goal_id,
    'Full-Stack Next.js 16 & Supabase Architect',
    'A hyper-personalized curriculum designed by AI to take you from a basic JS coder to a Full Stack Supabase expert.',
    4,
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '4 weeks')::date,
    'active'::public.roadmap_status_enum
  )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Create Roadmap Modules
  INSERT INTO public.roadmap_modules (id, user_id, roadmap_id, sequence_number, title, description, estimated_days, topics, status)
  VALUES 
    (v_mod1_id, v_student_id, v_roadmap_id, 1, 'Module 1: Next.js 16 Core Concepts', 'Learn Server Actions, Dynamic Routing, Suspense boundaries, and Hydration structures.', 7, '["Server Components", "Routing", "Fetching", "Hydration"]'::jsonb, 'in_progress'::public.module_status_enum),
    (v_mod2_id, v_student_id, v_roadmap_id, 2, 'Module 2: Supabase & PostgreSQL Foundations', 'Learn Tables, Foreign Keys, RLS policies, triggers, and migrations.', 7, '["Schema Design", "RLS Policies", "Triggers", "Seed Data"]'::jsonb, 'not_started'::public.module_status_enum)
  ON CONFLICT (id) DO NOTHING;

  -- 6. Create Daily Plans
  INSERT INTO public.daily_plans (id, user_id, roadmap_id, module_id, day_number, plan_date, focus_topic, is_completed)
  VALUES 
    (v_plan1_id, v_student_id, v_roadmap_id, v_mod1_id, 1, CURRENT_DATE, 'Setup & App Router Basics', true),
    (v_plan2_id, v_student_id, v_roadmap_id, v_mod1_id, 2, (CURRENT_DATE + INTERVAL '1 day')::date, 'Rendering Modes & Hydration', false)
  ON CONFLICT (id) DO NOTHING;

  -- 7. Curated Resources
  INSERT INTO public.resources (id, user_id, module_id, title, url, resource_type, estimated_minutes, why_recommended, is_completed)
  VALUES 
    (v_res1_id, v_student_id, v_mod1_id, 'Next.js App Router Guide', 'https://nextjs.org/docs/app', 'documentation'::public.resource_type_enum, 25, 'Official next.js docs covering dynamic routing patterns.', true),
    (v_res2_id, v_student_id, v_mod1_id, 'Server Actions Best Practices', 'https://youtube.com/watch?v=action-guide', 'video'::public.resource_type_enum, 15, 'Clear visual walkthrough of Next.js Server Components.', false)
  ON CONFLICT (id) DO NOTHING;

  -- 8. Daily Tasks
  INSERT INTO public.tasks (id, user_id, plan_id, module_id, title, description, task_type, estimated_minutes, status, resource_id, completed_at)
  VALUES 
    (v_task1_id, v_student_id, v_plan1_id, v_mod1_id, 'Read routing docs', 'Go through files layout structure in Next.js', 'read'::public.task_type_enum, 20, 'completed'::public.task_status_enum, v_res1_id, NOW()),
    (v_task2_id, v_student_id, v_plan1_id, v_mod1_id, 'Setup sample project scaffolding', 'Initialize a mock next.js project using npx create-next-app', 'practice'::public.task_type_enum, 30, 'completed'::public.task_status_enum, NULL, NOW()),
    (v_task3_id, v_student_id, v_plan2_id, v_mod1_id, 'Watch Server Actions overview', 'Learn the basics of forms handling with actions', 'watch'::public.task_type_enum, 15, 'pending'::public.task_status_enum, v_res2_id, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Note: Trigger automatically initializes public.progress on task inserts and tracks completion percentage.

  -- 9. Capstone Project
  INSERT INTO public.projects (id, user_id, module_id, title, description, requirements, tech_stack, steps, estimated_hours)
  VALUES (
    v_proj_id,
    v_student_id,
    v_mod1_id,
    'SaaS Dashboard Prototype',
    'Build a fully styled dashboard prototype in Next.js demonstrating responsive sidebar navigation and server components dynamic list rendering.',
    'Must include: sidebar UI component, loading states, modular folders structure, and dynamic parameter paths.',
    '["Next.js", "TailwindCSS", "Lucide React"]'::jsonb,
    '[
      {"step_number": 1, "description": "Create folder structure with app/dashboard layouts."},
      {"step_number": 2, "description": "Implement sidebar links and handle responsive mobile layouts."},
      {"step_number": 3, "description": "Fetch and display mock data under component suspense state."}
    ]'::jsonb,
    6
  )
  ON CONFLICT (id) DO NOTHING;

  -- Project Progress Link
  INSERT INTO public.project_progress (user_id, project_id, status, started_at, completed_at, qa_history, steps_completed, submission_link, tutor_review)
  VALUES (
    v_student_id,
    v_proj_id,
    'in_progress'::public.project_status_enum,
    NOW(),
    NULL,
    '[{"role": "user", "message": "How do I trigger hydration updates on layout changes?", "timestamp": "2026-07-17T22:30:00Z"},
      {"role": "tutor", "message": "In App Router routing, layouts preserve state. Wrap contents in a context provider or use a key if you need to remount.", "timestamp": "2026-07-17T22:31:00Z"}]'::jsonb,
    '[1]'::jsonb,
    'https://github.com/alex-learner/saas-dashboard-prototype',
    NULL
  )
  ON CONFLICT (user_id, project_id) DO NOTHING;

  -- 10. Quiz Data
  INSERT INTO public.quizzes (id, user_id, module_id, title, max_score, pass_percentage)
  VALUES (
    v_quiz_id,
    v_student_id,
    v_mod1_id,
    'Next.js Router Diagnostic Assessment',
    20,
    70
  )
  ON CONFLICT (id) DO NOTHING;

  -- Questions
  INSERT INTO public.quiz_questions (id, quiz_id, question_text, options, correct_option_index, explanation)
  VALUES 
    (v_q1_id, v_quiz_id, 'Which folder marks the route segment "/dashboard/settings" in Next.js App Router?', '["app/dashboard-settings/page.tsx", "app/dashboard/settings/page.tsx", "app/dashboard/page/settings.tsx", "pages/dashboard/settings.tsx"]'::jsonb, 1, 'In Next.js, nested folders under the (app) folder map directly to URL paths. The directory "app/dashboard/settings" exposes a route on "/dashboard/settings" using page.tsx.'),
    (v_q2_id, v_quiz_id, 'Are server components rendered on client browsers by default?', '["Yes, they behave like normal React components.", "No, they compile on the server and stream to client as static HTML payload.", "They run both on server and client asynchronously.", "Server components are deprecated in Next.js 16."]'::jsonb, 1, 'Server Components execute only on the server, generating static HTML and interactive boundaries for the client.')
  ON CONFLICT (id) DO NOTHING;

  -- Quiz Attempt
  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, passed, answers_submitted, started_at, completed_at)
  VALUES (
    v_student_id,
    v_quiz_id,
    20,
    true,
    '{"81818181-8181-8181-8181-818181818101": 1, "81818181-8181-8181-8181-818181818102": 1}'::jsonb,
    (NOW() - INTERVAL '1 hour'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 11. Custom Streaks Seeding in progress (Trigger created the row, we adjust metadata)
  UPDATE public.progress
  SET current_streak = 3,
      longest_streak = 7,
      activity_log = '[{"date": "2026-07-15", "tasks_completed": 2}, {"date": "2026-07-16", "tasks_completed": 3}, {"date": "2026-07-17", "tasks_completed": 2}]'::jsonb
  WHERE user_id = v_student_id AND roadmap_id = v_roadmap_id;

  -- 12. Agent Telemetry Logs
  INSERT INTO public.agent_logs (user_id, agent_name, log_level, message, metadata)
  VALUES 
    (v_student_id, 'orchestrator'::public.agent_type_enum, 'info'::public.log_level_enum, 'Goal received: Master Next.js 16 and Supabase. Routing to Curriculum Architect.', '{"input_length": 110}'::jsonb),
    (v_student_id, 'curriculum_architect'::public.agent_type_enum, 'info'::public.log_level_enum, 'Generated 4-week roadmap with 2 initial modules.', '{"modules_count": 2, "estimated_weeks": 4}'::jsonb),
    (v_student_id, 'resource_curator'::public.agent_type_enum, 'info'::public.log_level_enum, 'Acquired 10 high-quality documentation links and video guides.', '{"keywords": ["Next.js 16", "Supabase"]}'::jsonb);

  -- 13. Focus Learning sessions
  INSERT INTO public.learning_sessions (user_id, task_id, focus_minutes, session_notes, session_date)
  VALUES 
    (v_student_id, v_task1_id, 25, 'Focused on App Router structure. Completed routing docs.', CURRENT_DATE),
    (v_student_id, v_task2_id, 35, 'Set up Next.js app scaffolding successfully.', CURRENT_DATE);

  -- 14. Activity Notifications
  INSERT INTO public.notifications (user_id, title, message, is_read, notification_type, link_to)
  VALUES 
    (v_student_id, 'Welcome to SkillVerse!', 'AI Agents have initialized. Describe a goal to begin learning.', true, 'success'::public.notification_type_enum, '/dashboard'),
    (v_student_id, 'Roadmap Generated!', 'Your Full-Stack Next.js 16 roadmap is ready for review.', false, 'info'::public.notification_type_enum, '/dashboard/roadmap');

END $$;

COMMIT;
