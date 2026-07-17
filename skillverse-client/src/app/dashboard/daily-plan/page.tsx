'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, BookOpen, Video, Code, HelpCircle, CheckSquare, Dumbbell } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import { useWorkspaceStore } from '../../../store';
import { MOCK_TASKS } from '../../../constants/mockData';
import { cn } from '../../../lib/utils';
import { ROUTES } from '../../../constants/navigation';

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

export default function DailyPlanPage() {
  const router = useRouter();
  
  // Use tasks from workspace store, sync initial values if empty
  const storeTasks = useWorkspaceStore((state) => state.tasksList);
  const tasks = storeTasks.length > 0 ? storeTasks : MOCK_TASKS;
  const toggleTask = useWorkspaceStore((state) => state.toggleTask);

  const [activeDay, setActiveDay] = useState<number>(7); // today is default

  const daysList = Array.from(new Set(MOCK_TASKS.map((t) => t.day_number))).sort((a,b) => a - b);
  const currentDayTasks = tasks.filter((t) => t.day_number === activeDay);

  const handleTaskToggle = (id: string) => {
    // If tasks are loaded in store, toggle it
    if (storeTasks.length === 0) {
      // populate store with mock data first so toggle works during interactive sessions
      useWorkspaceStore.setState({ tasksList: MOCK_TASKS });
    }
    toggleTask(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
          Daily Action Planner
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Perform scheduled study sessions to build streaks.
        </p>
      </div>

      {/* Day Navigation Bubbles */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start select-none">
        {daysList.map((dayNum) => {
          const isToday = dayNum === 7;
          const isSelected = dayNum === activeDay;
          const dayTasks = tasks.filter((t) => t.day_number === dayNum);
          const allCompleted = dayTasks.every((t) => t.is_completed);

          return (
            <button
              key={dayNum}
              onClick={() => setActiveDay(dayNum)}
              className={cn(
                "px-4.5 py-2.5 rounded-lg border text-xs font-semibold shrink-0 cursor-pointer transition-all",
                isSelected
                  ? "bg-brand-primary border-brand-primary text-white shadow-glow"
                  : "bg-white/2 border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/5",
                allCompleted && !isSelected && "border-status-success/35 text-status-success bg-status-success/4"
              )}
            >
              Day {dayNum} {isToday && '(Today)'}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main tasks list panel */}
        <div className="lg:col-span-2">
          <Card hoverable={false} className="border-card-border p-6 text-left">
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <div>
                <CardTitle>Schedule Day {activeDay}</CardTitle>
                <CardDescription>Daily task checkpoints</CardDescription>
              </div>
              <Badge variant="primary">
                {currentDayTasks.length} task blocks
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentDayTasks.length > 0 ? (
                currentDayTasks.map((task) => {
                  const Icon = typeIcons[task.task_type] || HelpCircle;
                  const color = typeColors[task.task_type] || 'text-text-secondary bg-white/5 border-white/10';

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-4 p-4 border rounded-md transition-all",
                        task.is_completed
                          ? "border-status-success/20 bg-status-success/2/5 opacity-65"
                          : "border-white/5 bg-background/50 hover:bg-white/2"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleTaskToggle(task.id)}
                        className={cn(
                          "h-5.5 w-5.5 rounded-md border flex items-center justify-center cursor-pointer transition-all mt-0.5 shrink-0",
                          task.is_completed
                            ? "bg-status-success border-status-success text-white shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                            : "border-white/20 hover:border-brand-primary"
                        )}
                      >
                        {task.is_completed && <Check className="h-3 w-3" />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 flex flex-col text-left">
                        <span className={cn(
                          "text-xs font-semibold leading-relaxed transition-colors",
                          task.is_completed ? "text-text-secondary line-through" : "text-text-primary"
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
                            {task.task_type}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Estimated: {task.estimated_minutes} min
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

        {/* Resources references shortcuts panel */}
        <div>
          <Card hoverable={false} className="border-card-border p-6 text-left h-full">
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
    </div>
  );
}
