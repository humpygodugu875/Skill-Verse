// TypeScript Types for SkillVerse Core System

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type TaskType = 'Read' | 'Watch' | 'Practice' | 'Build' | 'Quiz';

export type RoadmapStatus = 'active' | 'completed' | 'paused';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed';

export type QuizStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningGoal {
  id?: string;
  user_id: string;
  raw_goal: string;
  skill_level: SkillLevel;
  hours_per_week: number;
  deadline_weeks: number;
  domain?: string;
  sub_topics?: string[];
  estimated_weeks?: number;
  difficulty?: SkillLevel;
  confidence_score?: number;
  goal_summary?: string;
  job_outcomes?: {
    target_job_titles: string[];
    resume_impact_statements: string[];
    technical_interview_prep: {
      key_topics: string[];
      mock_questions: Array<{ question: string; target_response: string }>;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface Milestone {
  id: string;
  user_id: string;
  roadmap_id: string;
  sequence_number: number;
  title: string;
  description: string;
  estimated_days: number;
  topics: string[];
  learning_objectives: string[];
  status: MilestoneStatus;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  profile_id: string;
  title: string;
  total_weeks: number;
  start_date?: string;
  end_date?: string;
  status: RoadmapStatus;
  milestones?: Milestone[];
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  roadmap_id: string;
  milestone_id: string;
  day_number: number;
  task_date: string;
  title: string;
  description?: string;
  task_type: TaskType;
  estimated_minutes: number;
  is_completed: boolean;
  completed_at?: string;
  resource_id?: string;
  created_at?: string;
}

export interface Resource {
  id: string;
  user_id: string;
  milestone_id: string;
  topic: string;
  title: string;
  url: string;
  resource_type: 'Article' | 'Video' | 'Course' | 'Documentation' | 'Tool';
  estimated_minutes?: number;
  difficulty?: SkillLevel;
  why_recommended?: string;
  relevance_score?: number;
  is_bookmarked: boolean;
  created_at?: string;
}

export interface ProjectStep {
  step_number: number;
  title: string;
  description: string;
  hint: string;
  hint_revealed?: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  milestone_id: string;
  title: string;
  description: string;
  objective: string;
  tech_stack: string[];
  steps: ProjectStep[];
  deliverable: string;
  estimated_hours?: number;
  status: ProjectStatus;
  started_at?: string;
  completed_at?: string;
  qa_history: Array<{ role: 'user' | 'assistant'; message: string; timestamp: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  type: 'mcq' | 'true_false';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  user_answer?: string;
  is_correct?: boolean;
}

export interface Quiz {
  id: string;
  user_id: string;
  milestone_id: string;
  topic: string;
  questions: QuizQuestion[];
  score: number;
  max_score?: number;
  pass_threshold?: number;
  status: QuizStatus;
  started_at?: string;
  completed_at?: string;
  attempt_number: number;
  created_at?: string;
  updated_at?: string;
}

export interface Progress {
  id: string;
  user_id: string;
  roadmap_id: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  total_milestones: number;
  completed_milestones: number;
  activity_log: Array<{ date: string; tasks_completed: number; minutes_spent: number }>;
  created_at?: string;
  updated_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  role_description: string;
  status: 'idle' | 'active' | 'done';
}
