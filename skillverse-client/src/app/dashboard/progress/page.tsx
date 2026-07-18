'use client';

import React from 'react';
import { Award, CheckCircle2, Flame, Clock, CalendarDays } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import { MOCK_PROGRESS } from '../../../constants/mockData';
import { api } from '../../../services/api';

export default function ProgressPage() {
  const [progress, setProgress] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const res = await api.progress.getStats();
        if (res.data) {
          setProgress(res.data);
        }
      } catch (err) {
        console.error('[ProgressPage] Failed to fetch progress:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const activeProgress = progress || MOCK_PROGRESS;

  // Generate mock heatmap cells (53 weeks * 7 days) simulating commit histories
  const generateHeatmapDays = () => {
    const daysData = [];
    const baseDate = new Date('2026-01-01');
    
    // We render a grid of 14 weeks (98 days) for a sleek UI display
    for (let i = 0; i < 98; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + i);
      
      // Simulate random activity weights (0: none, 1: light, 2: active, 3: heavy)
      let weight = 0;
      if (i > 10 && i < 25) weight = Math.floor(Math.random() * 3);
      if (i >= 82 && i <= 87) weight = 3; // streak days
      if (Math.random() > 0.7) weight = Math.floor(Math.random() * 3);

      daysData.push({
        id: i,
        weight,
        date: currentDate.toISOString().split('T')[0]
      });
    }
    return daysData;
  };

  const heatmapDays = generateHeatmapDays();

  const getWeightColor = (weight: number) => {
    switch (weight) {
      case 3:
        return 'bg-brand-primary border border-brand-primary/20 shadow-[0_0_8px_rgba(124,58,255,0.4)]';
      case 2:
        return 'bg-brand-primary/60 border border-brand-primary/10';
      case 1:
        return 'bg-brand-primary/30 border border-brand-primary/5';
      case 0:
      default:
        return 'bg-white/3 border border-white/5';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
          Progress Heatmap Analytics
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Historical log tracking your daily study milestones.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Flame, text: 'Current Streak', value: `${activeProgress.current_streak || 0} days`, color: 'text-status-warning' },
          { icon: Award, text: 'Longest Streak', value: `${activeProgress.longest_streak || 0} days`, color: 'text-brand-secondary' },
          { icon: CheckCircle2, text: 'Tasks Completed', value: `${activeProgress.completed_tasks || 0} tasks`, color: 'text-status-success' },
          { icon: Clock, text: 'Total Hours Spent', value: `${((activeProgress.completed_tasks || 0) * 0.5).toFixed(1)} hours`, color: 'text-status-info' }
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} hoverable={true} className="p-5 flex flex-col text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-text-secondary select-none">{metric.text}</span>
                <Icon className={`h-4.5 w-4.5 ${metric.color}`} />
              </div>
              <p className="text-xl font-bold text-text-primary tracking-tight">{metric.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Contribution Heatmap Card */}
      <Card hoverable={false} className="border-card-border p-6 text-left">
        <CardHeader className="mb-4">
          <CardTitle>Study consistency chart</CardTitle>
          <CardDescription>Activity logs tracked during current calendar weeks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Heatmap Grid */}
          <div className="flex flex-wrap gap-1.5 justify-start">
            {heatmapDays.map((day) => (
              <div
                key={day.id}
                title={`Date: ${day.date}`}
                className={`h-3 w-3 rounded-xs transition-colors shrink-0 cursor-pointer hover:scale-105 ${getWeightColor(day.weight)}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-muted select-none border-t border-white/5 pt-4">
            <span>Commit Timeline</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-xs bg-white/3 border border-white/5" />
              <div className="h-2.5 w-2.5 rounded-xs bg-brand-primary/30" />
              <div className="h-2.5 w-2.5 rounded-xs bg-brand-primary/60" />
              <div className="h-2.5 w-2.5 rounded-xs bg-brand-primary" />
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log List */}
      <Card hoverable={false} className="border-card-border p-6 text-left col-span-2">
        <CardHeader className="mb-4">
          <CardTitle>Historical Log Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(activeProgress.activity_log || []).map((log: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3.5 border border-white/3 bg-background/20 rounded-md">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4.5 w-4.5 text-brand-secondary" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-text-primary">{log.date}</span>
                  <span className="text-[10px] text-text-secondary mt-0.5">Checked {log.tasks_completed} task blocks</span>
                </div>
              </div>
              <Badge variant="success">Completed</Badge>
            </div>
          ))}
          {(!activeProgress.activity_log || activeProgress.activity_log.length === 0) && (
            <div className="text-xs text-text-muted text-center py-6 select-none animate-pulse">No study history recorded yet. Complete daily checklist tasks to log streaks!</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
