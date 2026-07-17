import { create } from 'zustand';
import { User, Roadmap, Task, Agent } from '../types';

// 1. Session & Authentication Store Shell
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setSession: (user: User | null, token: string | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  setSession: (user, token) => set({ user, token, isAuthenticated: !!user }),
  clearSession: () => set({ user: null, token: null, isAuthenticated: false }),
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
