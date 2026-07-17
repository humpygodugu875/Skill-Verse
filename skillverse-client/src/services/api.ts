import { apiClient } from './client';
import { Roadmap, Task, Resource, Project, Quiz, Progress } from '../types';

export const api = {
  // Authentication Route Controllers
  auth: {
    login: (credentials: any) => apiClient.post('/auth/login', credentials),
    register: (details: any) => apiClient.post('/auth/register', details),
  },

  // Goal & Onboarding Controllers
  goals: {
    submit: (goalParams: any) => apiClient.post('/goals', goalParams),
  },

  // Roadmap & Milestones Controllers
  roadmaps: {
    getActive: (): Promise<Roadmap> => apiClient.get('/roadmaps/active'),
    updateMilestoneStatus: (milestoneId: string, status: string) =>
      apiClient.patch(`/milestones/${milestoneId}/status`, { status }),
  },

  // Daily Planner Controllers
  planner: {
    getTasksForDay: (date: string): Promise<Task[]> =>
      apiClient.get(`/planner/today`, { params: { date } }),
    toggleTaskCompleted: (taskId: string, isCompleted: boolean): Promise<Task> =>
      apiClient.patch(`/planner/tasks/${taskId}`, { is_completed: isCompleted }),
  },

  // Resource Library Controllers
  resources: {
    getMilestoneResources: (milestoneId: string): Promise<Resource[]> =>
      apiClient.get(`/milestones/${milestoneId}/resources`),
    toggleBookmark: (resourceId: string, isBookmarked: boolean): Promise<Resource> =>
      apiClient.patch(`/resources/${resourceId}/bookmark`, { is_bookmarked: isBookmarked }),
  },

  // Capstone Projects & Mentoring Controllers
  projects: {
    getMilestoneProject: (milestoneId: string): Promise<Project> =>
      apiClient.get(`/milestones/${milestoneId}/project`),
    sendSocraticMessage: (projectId: string, message: string): Promise<{ reply: string }> =>
      apiClient.post(`/projects/${projectId}/chat`, { message }),
  },

  // Quiz Controllers
  quizzes: {
    getMilestoneQuiz: (milestoneId: string): Promise<Quiz> =>
      apiClient.get(`/milestones/${milestoneId}/quiz`),
    submitQuizAnswers: (quizId: string, answers: Array<{ question_id: number; selected_option: string }>) =>
      apiClient.post(`/quizzes/${quizId}/submit`, { answers }),
  },

  // Progress Analytics Controllers
  progress: {
    getStats: (): Promise<Progress> => apiClient.get('/progress'),
  },

  // Career Outcome Controllers
  career: {
    getProfile: () => apiClient.get('/career/profile'),
  },
};
