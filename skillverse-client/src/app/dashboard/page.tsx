'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, CalendarDays, CheckCircle2, ShieldCheck, Flame, Hourglass, Edit3, Trash2, X, PlusCircle, AlertTriangle, Sparkles, BookOpen, User } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import Badge from '../../components/ui/badge';
import ProgressBar from '../../components/ui/progress-bar';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { useWorkspaceStore } from '../../store';
import { ROUTES } from '../../constants/navigation';
import { api } from '../../services/api';

export default function DashboardOverview() {
  const router = useRouter();

  // Zustand State hooks
  const { activeRoadmap, setActiveRoadmap, setTasksList } = useWorkspaceStore();

  // Local state variables
  const [goals, setGoals] = useState<any[]>([]);
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Goal Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editHours, setEditHours] = useState('15');
  const [editDate, setEditDate] = useState('');
  const [editSkillLevel, setEditSkillLevel] = useState('beginner');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Action Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch unified workspace data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch targets lists, active progress indices and goals
      const [goalsRes, roadmapRes, progressRes] = await Promise.all([
        api.goals.getAll(),
        api.roadmaps.getActive().catch(() => ({ data: null })),
        api.progress.getStats().catch(() => ({ data: null })),
      ]);

      const goalList = goalsRes.data || [];
      setGoals(goalList);

      if (goalList.length > 0) {
        // Active goal is the latest one
        const latestGoal = goalList[0];
        setActiveGoal(latestGoal);

        // Sync inputs for edit form
        setEditTitle(latestGoal.title || '');
        setEditDescription(latestGoal.raw_goal || latestGoal.description || '');
        setEditHours(String(latestGoal.hours_per_week || '15'));
        setEditDate(latestGoal.target_date ? latestGoal.target_date.split('T')[0] : '');
        setEditSkillLevel(latestGoal.skill_level || 'beginner');
      } else {
        setActiveGoal(null);
      }

      const activeRm = roadmapRes.data;
      setActiveRoadmap(activeRm);

      // Sync tasks from active milestones modules
      if (activeRm && activeRm.milestones) {
        const sampleTasks: any[] = [];
        activeRm.milestones.forEach((m: any) => {
          if (m.tasks) sampleTasks.push(...m.tasks);
        });
        setTasksList(sampleTasks);
      }

      setProgress(progressRes.data || null);
    } catch (err: any) {
      showToast(err.message || 'Error occurred syncing workspace panels.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleEditGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;
    try {
      setIsSaving(true);
      const updatePayload = {
        title: editTitle,
        description: editDescription,
        hours_per_week: parseInt(editHours, 10),
        target_date: editDate,
        skill_level: editSkillLevel,
      };

      const res = await api.goals.update(activeGoal.id, updatePayload);
      showToast('Learning parameters updated successfully!');
      setIsEditModalOpen(false);

      // Optimistic state updates
      setActiveGoal(res.data);
      // Re-trigger fetch to sync roadmap end dates or titles
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update target parameters.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoalSubmit = async () => {
    if (!activeGoal) return;
    try {
      setIsDeleting(true);
      await api.goals.delete(activeGoal.id);
      showToast('Learning Goal and roadmap cascade completely reset.', 'success');
      setIsDeleteConfirmOpen(false);
      
      // Reset local caches
      setActiveGoal(null);
      setActiveRoadmap(null);
      setTasksList([]);
      setProgress(null);
      setGoals([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete workspace.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-text-secondary animate-pulse">Hydrating Command Center...</span>
      </div>
    );
  }

  // Dashboard Empty Onboarding Onramps
  if (!activeGoal || !activeRoadmap) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card hoverable={false} className="border-card-border bg-[#070712]/50 p-8 text-center flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 shadow-glow">
            <Compass className="h-7 w-7" />
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-2">Configure Your Learning Space</h2>
          <p className="text-sm text-text-secondary mb-6 max-w-lg leading-relaxed">
            SkillVerse AI organizes custom weekly learning roadmaps, resources libraries, daily milestone schedules and Capstones based on your objectives.
          </p>
          <Button variant="primary" onClick={() => router.push(ROUTES.ONBOARDING)}>
            Orchestrate Goal & Generate Roadmap
            <PlusCircle className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  // Extract analysis payload info
  const analysisProps = activeGoal.analyzed_payload || {};
  const milestonesList = activeRoadmap.milestones || [];
  const currentMilestoneIndex = milestonesList.findIndex((m: any) => m.status === 'in_progress' || m.status === 'not_started');
  const activeMilestone = milestonesList[currentMilestoneIndex !== -1 ? currentMilestoneIndex : 0];
  const nextMilestone = milestonesList[currentMilestoneIndex !== -1 ? currentMilestoneIndex + 1 : 1];

  // Helper variables for daily planner
  const completionPercentage = progress?.completion_percentage || 0;
  const completedTasksCount = progress?.completed_tasks || 0;
  const totalTasksCount = progress?.total_tasks || 0;
  const completedModules = progress?.completed_modules || 0;
  const totalModules = progress?.total_modules || 0;

  return (
    <div className="space-y-6">
      
      {/* Toast Alert overlay notifications */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-glow border text-sm font-semibold transition-all duration-300 ${
          toast.type === 'error' 
            ? 'bg-status-danger/10 border-status-danger/30 text-status-danger' 
            : 'bg-status-success/10 border-status-success/30 text-status-success'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Motivational Header & Admin actions panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
            Workspace Overview
          </h2>
          <p className="text-sm text-text-secondary mt-1 max-w-xl truncate">
            Focus Goal: <span className="text-brand-secondary font-semibold">{activeGoal.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card hoverable={false} className="flex items-center gap-2 px-3 py-1.5 border-white/5 bg-white/5 p-0">
            <Flame className="h-4 w-4 text-status-warning" />
            <span className="text-xs font-bold text-text-primary">{progress?.current_streak || 0} Streak</span>
          </Card>
          
          <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)} className="h-9 px-3">
            <Edit3 className="h-4 w-4" />
          </Button>

          <Button variant="danger" size="sm" onClick={() => setIsDeleteConfirmOpen(true)} className="h-9 px-3">
            <Trash2 className="h-4 w-4 text-status-danger" />
          </Button>

          <Button variant="primary" size="sm" onClick={() => router.push(ROUTES.DAILY_PLAN)} className="h-9">
            Study Core Plan
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable={true} className="flex flex-col justify-between text-left p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary select-none">Total Completion Progress</span>
              <Compass className="h-4 w-4 text-brand-secondary" />
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {completionPercentage}%
            </p>
          </div>
          <ProgressBar value={completionPercentage} className="mt-4 animate-progress" />
        </Card>

        <Card hoverable={true} className="flex flex-col justify-between text-left p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary select-none">Milestones Completed</span>
              <ShieldCheck className="h-4 w-4 text-status-success" />
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {completedModules} <span className="text-xs text-text-secondary">of {totalModules} Modules</span>
            </p>
          </div>
          <p className="text-xs text-text-secondary mt-4 truncate">
            Next Milestone: {nextMilestone ? nextMilestone.title : 'All Milestones Scheduled'}
          </p>
        </Card>

        <Card hoverable={true} className="flex flex-col justify-between text-left p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary select-none">Goal Schedule Timeline</span>
              <Hourglass className="h-4 w-4 text-status-info" />
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {activeGoal.hours_per_week} <span className="text-xs text-text-secondary">Hours / Wk</span>
            </p>
          </div>
          <p className="text-xs text-status-info hover:underline mt-4 cursor-pointer truncate">
            Target Finish Date: {activeGoal.target_date ? new Date(activeGoal.target_date).toLocaleDateString() : 'None'}
          </p>
        </Card>
      </div>

      {/* Main content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Milestones and AI Goal Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Goal Diagnostics details (View Goal specifications) */}
          <Card hoverable={false} className="border-card-border p-6 text-left">
            <CardHeader className="flex flex-row items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-brand-primary" />
              <div>
                <CardTitle>AI Goal Diagnostics</CardTitle>
                <CardDescription>AI recommendations based on initial experience context</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-card-border/50 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Difficulty Rating</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5">{analysisProps.difficulty_score || 5}/10</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Confidence Rating</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5">{Math.round((analysisProps.confidence_score || 0.85) * 100)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Format Schedule</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5">{analysisProps.learning_style || 'Practical study'}</span>
                </div>
              </div>
              
              <div>
                <span className="text-xs font-bold text-text-primary block mb-1">Recommended Learning Strategy</span>
                <p className="text-xs text-text-secondary leading-relaxed bg-white/[0.02] border border-white/5 rounded-md p-3.5">
                  {analysisProps.learning_strategy || 'Organize milestones, review recommended resources, and complete capstones.'}
                </p>
              </div>

              {analysisProps.prerequisites && analysisProps.prerequisites.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-text-primary block mb-2">Targeted Prerequisites</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisProps.prerequisites.map((prereq: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary rounded px-2 py-0.5 font-medium">
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {analysisProps.strengths && analysisProps.strengths.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-status-success block mb-2">Strengths Assessed</span>
                    <ul className="text-xs text-text-secondary space-y-1 pr-3 list-disc pl-4">
                      {analysisProps.strengths.slice(0, 3).map((str: string, index: number) => (
                        <li key={index} className="leading-tight">{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisProps.weaknesses && analysisProps.weaknesses.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-status-warning block mb-2">Potential Friction Points</span>
                    <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4">
                      {analysisProps.weaknesses.slice(0, 3).map((wk: string, index: number) => (
                        <li key={index} className="leading-tight">{wk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Schedule Preview Panel */}
        <div className="space-y-6">
          <Card hoverable={false} className="border-card-border p-6 text-left flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <div>
                <CardTitle>Active Milestones</CardTitle>
                <CardDescription>Curriculum checklist index</CardDescription>
              </div>
              <Badge variant="primary">Module {activeMilestone ? activeMilestone.sequence_number : 1}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto max-h-[360px] flex-1">
              {activeRoadmap.milestones && activeRoadmap.milestones.length > 0 ? (
                activeRoadmap.milestones.map((m: any) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 p-3.5 border rounded-md transition-colors cursor-pointer ${
                      m.status === 'completed'
                        ? 'border-status-success/20 bg-status-success/5 hover:bg-status-success/10'
                        : m.status === 'in_progress'
                        ? 'border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 animate-border-pulse'
                        : 'border-white/5 bg-background/40 hover:bg-white/2'
                    }`}
                    onClick={() => router.push(ROUTES.ROADMAP)}
                  >
                    <div className="h-5 w-5 rounded-md border border-white/10 flex items-center justify-center mt-0.5 shrink-0">
                      {m.status === 'completed' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                      ) : (
                        <div className={`h-2 w-2 rounded-full ${m.status === 'in_progress' ? 'bg-brand-primary animate-pulse' : 'bg-text-muted'}`} />
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-text-primary leading-tight">
                        {m.title}
                      </span>
                      <span className="text-[10px] text-text-secondary mt-1">
                        Est: {m.estimated_days} days · {m.topics?.length || 0} topics
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-text-muted text-center py-6">No scheduled milestones.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT GOAL MODAL DIALOG FLOOR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <Card hoverable={false} className="w-full max-w-lg border-card-border bg-[#070712] p-6 shadow-glow relative animate-scale-up">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
            <CardHeader className="mb-4">
              <CardTitle>Adjust Target Goal</CardTitle>
              <CardDescription>Update your learning milestones parameters</CardDescription>
            </CardHeader>
            <form onSubmit={handleEditGoalSubmit}>
              <CardContent className="space-y-4">
                <Input
                  id="editTitle"
                  type="text"
                  label="Goal Title summary"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary select-none tracking-wide text-left">
                    Goal Description
                  </label>
                  <textarea
                    className="w-full min-h-[90px] bg-card-bg/75 border border-card-border rounded-md px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 transition-all resize-none"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="editHours"
                    type="number"
                    label="Hours Per Week"
                    min="1"
                    max="40"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    required
                  />

                  <Input
                    id="editDate"
                    type="date"
                    label="Target Completion Date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 select-none text-left">
                  <label className="text-xs font-semibold text-text-secondary tracking-wide">Familiarity Level</label>
                  <select
                    className="w-full bg-card-bg/75 border border-card-border rounded-md px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 transition-all cursor-pointer h-10"
                    value={editSkillLevel}
                    onChange={(e) => setEditSkillLevel(e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-card-border/40">
                <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" isLoading={isSaving}>Save parameters</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE GOAL CASCADE DIALOG CONFIRM */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <Card hoverable={false} className="w-full max-w-md border-status-danger/30 bg-[#0c050d] p-6 shadow-glow relative animate-scale-up">
            <CardHeader className="flex flex-row items-start gap-3 mb-4">
              <div className="p-2 bg-status-danger/10 text-status-danger rounded-md">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-status-danger">Reset Learning Target?</CardTitle>
                <CardDescription>Deep removal of AI modules, Capstones, bookmarks and plans</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                Confirming deletes this learning path: <span className="text-text-primary font-semibold">{activeGoal.title}</span>. All module progress details, capstone checklists and schedules will be permanently cleared. This action cannot be undone.
              </p>
            </CardContent>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-card-border/40">
              <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Keep Goal</Button>
              <Button variant="danger" onClick={handleDeleteGoalSubmit} isLoading={isDeleting}>Reset Goal Data</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
