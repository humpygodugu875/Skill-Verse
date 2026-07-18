'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, BookOpen, Video, Code, HelpCircle, Dumbbell } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import EmptyState from '../../../components/ui/empty-state';
import Skeleton, { SkeletonHeadline } from '../../../components/ui/loading-skeleton';
import ProgressBar from '../../../components/ui/progress-bar';
import { useWorkspaceStore } from '../../../store';
import { cn } from '../../../lib/utils';
import { ROUTES } from '../../../constants/navigation';
import { api } from '../../../services/api';
import Toast from '../../../components/shared/toast';

const typeIcons = {
  Read: BookOpen,
  Watch: Video,
  Practice: Dumbbell,
  Build: Code,
  Quiz: HelpCircle,
};

const typeColors = {
  Read: 'text-status-info bg-status-info/5 border-status-info/10',
  Watch: 'text-status-warning bg-status-warning/5 border-status-warning/10',
  Practice: 'text-brand-secondary bg-brand-primary/5 border-brand-primary/10',
  Build: 'text-brand-secondary bg-brand-primary/5 border-brand-primary/10',
  Quiz: 'text-status-success bg-status-success/5 border-status-success/10',
};

const inferTaskType = (title: string): 'Read' | 'Watch' | 'Practice' | 'Build' | 'Quiz' => {
  const lower = title.toLowerCase();
  if (lower.includes('watch') || lower.includes('video')) return 'Watch';
  if (lower.includes('build') || lower.includes('code') || lower.includes('project') || lower.includes('create') || lower.includes('setup') || lower.includes('implement')) return 'Build';
  if (lower.includes('quiz') || lower.includes('test') || lower.includes('assess') || lower.includes('check')) return 'Quiz';
  if (lower.includes('practice') || lower.includes('exercise') || lower.includes('run') || lower.includes('try')) return 'Practice';
  return 'Read';
};

export default function DailyPlanPage() {
  const router = useRouter();
  
  const { activeRoadmap, setActiveRoadmap } = useWorkspaceStore();
  const [activeDay, setActiveDay] = useState<number>(1);
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [isUpdatingTaskId, setIsUpdatingTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load active roadmap on mount if not present
  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        if (!activeRoadmap) {
          const res = await api.roadmaps.getActive();
          if (res.data) {
            setActiveRoadmap(res.data);
          }
        }
      } catch (err) {
        console.error('[DailyPlanPage] Failed to fetch active roadmap:', err);
      }
    };
    loadRoadmap();
  }, [activeRoadmap, setActiveRoadmap]);

  // Convert Day number in UI (Day 1, 2 etc) to SQL String Date representation (YYYY-MM-DD)
  const getDayDate = useCallback((dayNum: number): string => {
    const startDateStr = activeRoadmap?.start_date || new Date().toISOString().split('T')[0];
    const startDate = new Date(startDateStr);
    startDate.setDate(startDate.getDate() + (dayNum - 1));
    return startDate.toISOString().split('T')[0];
  }, [activeRoadmap]);

  // Map local today date to the exact roadmap day offset
  const getTodayDayNumber = useCallback((): number => {
    if (!activeRoadmap?.start_date) return 1;
    const startDate = new Date(activeRoadmap.start_date);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = diffDays + 1;
    const totalDays = (activeRoadmap.total_weeks || 4) * 7;
    return Math.min(Math.max(currentDay, 1), totalDays);
  }, [activeRoadmap]);

  // Set default initial active day when roadmap clears
  useEffect(() => {
    if (activeRoadmap) {
      const todayNum = getTodayDayNumber();
      setActiveDay(todayNum);
    }
  }, [activeRoadmap, getTodayDayNumber]);

  // Query Daily Plan details from backend API
  const fetchDailyPlan = useCallback(async (dayNum: number) => {
    if (!activeRoadmap) return;
    try {
      setIsLoading(true);
      setError(null);
      
      const targetDate = getDayDate(dayNum);
      const res = await api.planner.getDailyPlan(targetDate);
      
      if (res.data) {
        setPlan(res.data.dailyPlan);
        setTasks(res.data.tasks || []);
      }
    } catch (err: any) {
      if (err?.status !== 404) {
        console.error(`[DailyPlanPage] Failed to load plan for day ${dayNum}:`, err.message || err);
      } else {
        console.warn(`[DailyPlanPage] No plan found for day ${dayNum} (expected 404 empty state)`);
      }
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeRoadmap, getDayDate]);

  // Triggers refresh query whenever requested day shifts
  useEffect(() => {
    if (activeRoadmap) {
      fetchDailyPlan(activeDay);
    }
  }, [activeDay, activeRoadmap, fetchDailyPlan]);

  const handleTaskToggle = async (id: string, currentStatus: string) => {
    if (isUpdatingTaskId) return;

    try {
      setIsUpdatingTaskId(id);
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      const res = await api.tasks.updateStatus(id, newStatus);
      
      if (res.success) {
        await fetchDailyPlan(activeDay);
        setToast({
          message: `Task marked as ${newStatus}!`,
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error('[DailyPlanPage] Task status update failed:', err);
      
      let errMsg = 'Failed to update task. Please check your network connection.';
      if (err.status === 401) {
        errMsg = 'Your session has expired. Please log in again.';
      } else if (err.status === 404) {
        errMsg = 'The selected task could not be found.';
      } else if (err.status === 409) {
        errMsg = 'Conflict updating task. Please refresh and try again.';
      } else if (err.message) {
        errMsg = err.message;
      }
      
      setToast({
        message: errMsg,
        type: 'error'
      });
    } finally {
      setIsUpdatingTaskId(null);
    }
  };

  // Header render block
  const renderHeader = () => (
    <div className="text-left">
      <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-tight">
        Daily Action Planner
      </h2>
      <p className="text-sm text-text-secondary mt-1">
        Perform scheduled study sessions to build streaks.
      </p>
    </div>
  );

  // Calendar Day Selector bubbles
  const renderDayNav = () => {
    const totalDays = (activeRoadmap?.total_weeks || 4) * 7;
    const daysList = Array.from({ length: totalDays }, (_, i) => i + 1);
    const todayIndex = getTodayDayNumber();

    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start select-none">
        {daysList.map((dayNum) => {
          const isToday = dayNum === todayIndex;
          const isSelected = dayNum === activeDay;

          return (
            <button
              key={dayNum}
              onClick={() => setActiveDay(dayNum)}
              className={cn(
                "px-4.5 py-2.5 rounded-lg border text-xs font-semibold shrink-0 cursor-pointer transition-all",
                isSelected
                  ? "bg-brand-primary border-brand-primary text-white shadow-glow"
                  : "bg-white/2 border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              Day {dayNum} {isToday && '(Today)'}
            </button>
          );
        })}
      </div>
    );
  };

  // Empty state if active roadmap is NOT created yet
  if (!activeRoadmap && !isLoading) {
    return (
      <div className="space-y-6 text-left">
        {renderHeader()}
        <EmptyState
          title="No Learning Roadmap Active"
          description="Create a personalized AI roadmap goal to start planning your daily lessons."
          actionText="Go to Onboarding"
          onActionClick={() => router.push(ROUTES.ONBOARDING)}
        />
      </div>
    );
  }

  // Loading skeleton state
  if (isLoading && !plan) {
    return (
      <div className="space-y-6 text-left">
        <SkeletonHeadline />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-lg shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-72 rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-44 rounded-lg" />
            <Skeleton className="h-44 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error State display
  if (error && error.status !== 404) {
    const isUnauthorized = error.status === 401;
    const isServerUnavailable = error.status === 500 || error.status === 503 || error.status === 504 || typeof error.status === 'undefined';

    let errorTitle = 'Network Offline';
    let errorDescription = 'The backend server is unreachable. Please verify the Express.js backend dev service is started.';

    if (isUnauthorized) {
      errorTitle = 'Session Expired';
      errorDescription = 'Unauthorized request. Please log in again to configure your checklists.';
    } else if (error.message) {
      errorTitle = 'Retrieval Exception';
      errorDescription = error.message;
    }

    return (
      <div className="space-y-6 text-left">
        {renderHeader()}
        {activeRoadmap && renderDayNav()}
        <EmptyState
          title={errorTitle}
          description={errorDescription}
          actionText={isUnauthorized ? "Sign In" : "Retry Connection"}
          onActionClick={isUnauthorized ? () => router.push(ROUTES.LOGIN) : () => fetchDailyPlan(activeDay)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}
      {activeRoadmap && renderDayNav()}

      {error?.status === 404 || !plan ? (
        <EmptyState
          title="Day Planner Empty"
          description="No learning plan exists for this day."
          actionText="Jump to Active Today"
          onActionClick={() => setActiveDay(getTodayDayNumber())}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main tasks checklist container */}
          <div className="lg:col-span-2">
            <Card hoverable={false} className="border-card-border p-6 text-left">
              <CardHeader className="flex flex-row items-center justify-between mb-4">
                <div>
                  <CardTitle>Schedule Day {activeDay}</CardTitle>
                  <CardDescription>Daily task checkpoints</CardDescription>
                </div>
                <Badge variant="primary">
                  {tasks.length} task blocks
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const inferredType = inferTaskType(task.title);
                    const Icon = typeIcons[inferredType] || HelpCircle;
                    const color = typeColors[inferredType] || 'text-text-secondary bg-white/5 border-white/10';
                    const isCompleted = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start gap-4 p-4 border rounded-md transition-all",
                          isCompleted
                            ? "border-status-success/20 bg-status-success/2/5 opacity-65"
                            : "border-white/5 bg-background/50 hover:bg-white/2"
                        )}
                      >
                        {/* Checkbox */}
                        <button
                          disabled={isUpdatingTaskId === task.id}
                          onClick={() => handleTaskToggle(task.id, task.status)}
                          className={cn(
                            "h-5.5 w-5.5 rounded-md border flex items-center justify-center cursor-pointer transition-all mt-0.5 shrink-0",
                            isCompleted
                              ? "bg-status-success border-status-success text-white shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                              : "border-white/20 hover:border-brand-primary",
                            isUpdatingTaskId === task.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isCompleted && <Check className="h-3 w-3" />}
                        </button>

                        {/* Description Details */}
                        <div className="flex-1 flex flex-col text-left">
                          <span className={cn(
                            "text-xs font-semibold leading-relaxed transition-colors",
                            isCompleted ? "text-text-secondary line-through" : "text-text-primary"
                          )}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[11px] text-text-secondary mt-1 max-w-lg leading-normal">
                              {task.description}
                            </span>
                          )}
                          
                          <div className="mt-3 flex items-center gap-3">
                            <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold rounded-full px-2 py-0.5 border select-none", color)}>
                              <Icon className="h-3 w-3" />
                              {inferredType}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Estimated: {task.estimatedMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-text-muted">No scheduled tasks logged for this day slot.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Statistics + Recommendations */}
          <div className="space-y-6">
            {/* Daily stats scorecard */}
            <Card hoverable={false} className="border-card-border p-6 text-left bg-gradient-to-br from-[#0c0c22] to-[#070715]">
              <CardHeader className="mb-4">
                <CardTitle className="text-sm font-bold text-brand-secondary uppercase tracking-wider">
                  Daily Analytics
                </CardTitle>
                <CardDescription>Topic study performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted">
                    Focus Topic
                  </span>
                  <h4 className="text-xs font-bold text-text-primary mt-0.5 leading-normal">
                    {plan.focusTopic}
                  </h4>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">
                    Completion Checklist
                  </span>
                  <ProgressBar value={plan.completionPercentage} showText={true} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted block">Tasks Scope</span>
                    <span className="font-semibold text-text-primary mt-0.5 block">
                      {plan.completedTasks} / {plan.totalTasks} Done
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Est. Study Time</span>
                    <span className="font-semibold text-text-primary mt-0.5 block">
                      {plan.estimatedStudyMinutes} mins
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended References Card */}
            <Card hoverable={false} className="border-card-border p-6 text-left">
              <CardHeader className="mb-4">
                <CardTitle>Recommended Materials</CardTitle>
                <CardDescription>Citations for today's studies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border border-white/5 bg-background/50 rounded-md">
                  <span className="text-[10px] uppercase font-bold text-brand-secondary tracking-wide select-none">
                    Reference Guide
                  </span>
                  <h4 className="text-xs font-bold text-text-primary mt-1 truncate">
                    TypeScript handbook compiler options
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-1 leading-normal line-clamp-2">
                    Official declarations outlining compilation configurations and targets parameters.
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="py-1 h-7 text-[10.5px] w-full cursor-pointer"
                      onClick={() => router.push(ROUTES.RESOURCES)}
                    >
                      Open Document Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isOpen={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
