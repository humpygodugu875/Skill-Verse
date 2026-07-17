import { create } from 'zustand';
import { User, Roadmap, Task, Agent } from '../types';
import { Session } from '@supabase/supabase-js';

// 1. Session & Authentication Store Shell
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  accessToken: string | null;
  session: Session | null;
  isLoading: boolean;
  setSession: (sessionOrUser: any, token?: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  accessToken: null,
  session: null,
  isLoading: true,
  setSession: (sessionOrUser, token) => {
    if (sessionOrUser && 'access_token' in sessionOrUser) {
      const session = sessionOrUser as Session;
      const user = session.user
        ? {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          }
        : null;
      set({
        session,
        user,
        token: session.access_token,
        accessToken: session.access_token,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } else {
      const user = sessionOrUser as User | null;
      const activeToken = token || null;
      set({
        user,
        token: activeToken,
        accessToken: activeToken,
        session: user
          ? ({
              access_token: activeToken || '',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: '',
              user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at || '',
                aud: 'authenticated',
                app_metadata: {},
                user_metadata: {},
              } as any,
            } as Session)
          : null,
        isAuthenticated: !!user,
        isLoading: false,
      });
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  clearSession: () =>
    set({
      user: null,
      token: null,
      accessToken: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

// 2. Active Learning Goal & Pipelines Store Shell
interface PipelineState {
  currentGoalRaw: string;
  isGenerating: boolean;
  activeAgentsList: Agent[];
  generationStep: number;
  setGenerating: (status: boolean) => void;
  setStep: (step: number) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  currentGoalRaw: '',
  isGenerating: false,
  activeAgentsList: [],
  generationStep: 0,
  setGenerating: (status) => set({ isGenerating: status }),
  setStep: (step) => set({ generationStep: step }),
  updateAgentStatus: (agentId, status) =>
    set((state) => ({
      activeAgentsList: state.activeAgentsList.map((agent) =>
        agent.id === agentId ? { ...agent, status } : agent
      ),
    })),
}));

// 3. User Workspace & Milestones Store Shell
interface WorkspaceState {
  activeRoadmap: Roadmap | null;
  tasksList: Task[];
  selectedMilestoneId: string | null;
  selectedDate: string;
  setActiveRoadmap: (roadmap: Roadmap | null) => void;
  setTasksList: (tasks: Task[]) => void;
  setSelectedMilestone: (id: string | null) => void;
  setSelectedDate: (date: string) => void;
  toggleTask: (taskId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeRoadmap: null,
  tasksList: [],
  selectedMilestoneId: null,
  selectedDate: new Date().toISOString().split('T')[0],
  setActiveRoadmap: (roadmap) => set({ activeRoadmap: roadmap }),
  setTasksList: (tasksList) => set({ tasksList }),
  setSelectedMilestone: (selectedMilestoneId) => set({ selectedMilestoneId }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  toggleTask: (taskId) =>
    set((state) => ({
      tasksList: state.tasksList.map((task) =>
        task.id === taskId ? { ...task, is_completed: !task.is_completed } : task
      ),
    })),
}));
