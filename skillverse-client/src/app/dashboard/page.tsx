'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Compass, CalendarDays, CheckCircle2, ShieldCheck, Flame, Hourglass } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import Badge from '../../components/ui/badge';
import ProgressBar from '../../components/ui/progress-bar';
import AgentCard from '../../components/ui/agent-card';
import Button from '../../components/ui/button';
import { MOCK_ROADMAP, MOCK_AGENTS, MOCK_PROGRESS, MOCK_TASKS } from '../../constants/mockData';
import { ROUTES } from '../../constants/navigation';

export default function DashboardOverview() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Dynamic Motivational Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
            Workspace Overview
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Focus Goal: <span className="text-gradient font-semibold">{MOCK_ROADMAP.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card hoverable={false} className="flex items-center gap-2 px-4 py-2 border-white/5 bg-white/1">
            <Flame className="h-4 w-4 text-status-warning" />
            <span className="text-xs font-bold text-text-primary">{MOCK_PROGRESS.current_streak} Day Streak</span>
          </Card>
          <Button variant="primary" onClick={() => router.push(ROUTES.DAILY_PLAN)}>
            Resume Study
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable={true} className="flex flex-col justify-between text-left p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary select-none">Total Progress</span>
              <Compass className="h-4 w-4 text-brand-secondary" />
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {MOCK_PROGRESS.completion_percentage}%
            </p>
          </div>
          <ProgressBar value={MOCK_PROGRESS.completion_percentage} className="mt-4" />
        </Card>

        <Card hoverable={true} className="flex flex-col justify-between text-left p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary select-none">Milestones Completed</span>
              <ShieldCheck className="h-4 w-4 text-status-success" />
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {MOCK_PROGRESS.completed_milestones} <span className="text-xs text-text-secondary">of {MOCK_PROGRESS.total_milestones}</span>
            </p>
          </div>
          <p className="text-xs text-text-secondary mt-4">
            Next: {MOCK_ROADMAP.milestones?.[1].title}
          </p>
        </Card>

        <Card hoverable={true} className="flex flex-col justify-between text-left p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary select-none">Tasks Completed Today</span>
              <Hourglass className="h-4 w-4 text-status-info" />
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              0 <span className="text-xs text-text-secondary">of 3 completed</span>
            </p>
          </div>
          <p className="text-xs text-brand-secondary hover:underline mt-4 cursor-pointer" onClick={() => router.push(ROUTES.DAILY_PLAN)}>
            Open daily checklists &rarr;
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Schedule Preview Panel */}
        <div className="lg:col-span-2">
          <Card hoverable={false} className="border-card-border p-6 text-left">
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <div>
                <CardTitle>Daily Study Planner</CardTitle>
                <CardDescription>Scheduled tasks lists for today</CardDescription>
              </div>
              <Badge variant="primary">Day 7</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_TASKS.filter(t => !t.is_completed).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3.5 border border-white/5 bg-background/40 hover:bg-white/2 rounded-md transition-colors cursor-pointer"
                  onClick={() => router.push(ROUTES.DAILY_PLAN)}
                >
                  <div className="h-5 w-5 rounded-md border border-white/10 hover:border-brand-primary flex items-center justify-center mt-0.5 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-text-primary leading-tight">
                      {task.title}
                    </span>
                    <span className="text-[10px] text-text-secondary mt-1">
                      {task.task_type} · {task.estimated_minutes} mins
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* AI Learning Team Status */}
        <div>
          <Card hoverable={false} className="border-card-border p-6 text-left h-full flex flex-col">
            <CardHeader className="mb-4">
              <CardTitle>AI Learning Team</CardTitle>
              <CardDescription>All agents are ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto max-h-[300px] flex-1">
              {MOCK_AGENTS.slice(0, 4).map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-2.5 border border-white/3 bg-background/20 rounded-md">
                  <div className="h-8 w-8 rounded-md bg-status-success/10 border border-status-success/20 text-status-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {agent.name}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Pipeline state complete
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
