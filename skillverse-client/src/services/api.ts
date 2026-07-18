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
    getAll: (): Promise<any> => apiClient.get('/goals'),
    getDetails: (goalId: string): Promise<any> => apiClient.get(`/goals/${goalId}`),
    update: (goalId: string, params: any): Promise<any> => apiClient.put(`/goals/${goalId}`, params),
    delete: (goalId: string): Promise<any> => apiClient.delete(`/goals/${goalId}`),
  },

  // Roadmap & Milestones Controllers
  roadmaps: {
    getActive: (): Promise<any> => apiClient.get('/roadmaps/active'),
    updateMilestoneStatus: (milestoneId: string, status: string): Promise<any> =>
      apiClient.patch(`/milestones/${milestoneId}/status`, { status }),
  },

  // Daily Planner Controllers
  planner: {
    getTasksForDay: (date: string): Promise<any> =>
      apiClient.get(`/planner/today`, { params: { date } }),
    toggleTaskCompleted: (taskId: string, isCompleted: boolean): Promise<any> =>
      apiClient.patch(`/planner/tasks/${taskId}`, { is_completed: isCompleted }),
    getDailyPlan: (date?: string): Promise<any> =>
      apiClient.get('/daily-plan', { params: { date } }),
  },

  // Task Status Controllers
  tasks: {
    updateStatus: (taskId: string, status: 'completed' | 'pending'): Promise<any> =>
      apiClient.patch(`/tasks/${taskId}`, { status }),
  },

  // Resource Library Controllers
  resources: {
    getAll: (type?: string): Promise<any> =>
      apiClient.get('/resources', type ? { params: { type } } : {}),
    getMilestoneResources: (milestoneId: string): Promise<any> =>
      apiClient.get(`/milestones/${milestoneId}/resources`),
    toggleBookmark: (resourceId: string, isBookmarked: boolean): Promise<any> =>
      apiClient.patch(`/resources/${resourceId}/bookmark`, { is_bookmarked: isBookmarked }),
  },

  // Capstone Projects & Mentor Chat Controllers
  projects: {
    getAll: (): Promise<any> => apiClient.get('/projects'),
    getById: (projectId: string): Promise<any> => apiClient.get(`/projects/${projectId}`),
    getHistory: (projectId: string): Promise<any> => apiClient.get(`/projects/${projectId}/chat`),
    sendMessage: (projectId: string, message: string): Promise<any> =>
      apiClient.post(`/projects/${projectId}/chat`, { message }),
  },

  // Quiz Evaluator Controllers
  quizzes: {
    getCurrent: (): Promise<any> => apiClient.get('/quiz/current'),
    submit: (quizId: string, answers: Record<string, number>): Promise<any> =>
      apiClient.post('/quiz/submit', { quizId, answers }),
  },

  // Progress Analytics Controllers
  progress: {
    getStats: (): Promise<any> => apiClient.get('/progress'),
  },

  // Career Outcome Controllers
  career: {
    getProfile: (): Promise<any> => apiClient.get('/career/profile'),
  },
};
