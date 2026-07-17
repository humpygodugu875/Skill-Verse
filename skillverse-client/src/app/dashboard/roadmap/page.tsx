'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Award, Hammer, GraduationCap, ArrowRight } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Timeline from '../../../components/ui/timeline';
import Button from '../../../components/ui/button';
import { useWorkspaceStore } from '../../../store';
import { ROUTES } from '../../../constants/navigation';
import { api } from '../../../services/api';

export default function RoadmapPage() {
  const router = useRouter();
  
  const { activeRoadmap, setActiveRoadmap, setTasksList } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!activeRoadmap) {
        try {
          setIsLoading(true);
          const res = await api.roadmaps.getActive();
          if (res.data) {
            setActiveRoadmap(res.data);
            const sampleTasks: any[] = [];
            res.data.milestones.forEach((m: any) => {
              if (m.tasks) sampleTasks.push(...m.tasks);
            });
            setTasksList(sampleTasks);
          }
        } catch (err) {
          console.error('Failed to load active roadmap', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadRoadmap();
  }, [activeRoadmap, setActiveRoadmap, setTasksList]);

  const milestones = activeRoadmap?.milestones || [];

  useEffect(() => {
    if (milestones.length > 0 && !selectedMilestoneId) {
      setSelectedMilestoneId(
        milestones.find((m: any) => m.status === 'in_progress')?.id || milestones[0]?.id || ''
      );
    }
  }, [milestones, selectedMilestoneId]);

  const selectedMilestone = milestones.find((m: any) => m.id === selectedMilestoneId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
          Learning Path Curriculum
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Complete milestones to unlock capstone validation quizzes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Milestones Timeline scroll container */}
        <div className="lg:col-span-3">
          <Timeline
            milestones={milestones}
            onSelectMilestone={(id) => setSelectedMilestoneId(id)}
          />
        </div>

        {/* Right: Milestone Details panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMilestone ? (
            <div className="sticky top-6 space-y-6 align-left justify-start">
              <Card hoverable={false} className="border-card-border p-6 text-left">
                <CardHeader className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={selectedMilestone.status === 'completed' ? 'success' : selectedMilestone.status === 'in_progress' ? 'primary' : 'secondary'}>
                      Milestone {selectedMilestone.sequence_number}
                    </Badge>
                    <span className="text-[10px] text-text-muted select-none">
                      {selectedMilestone.estimated_days} days target
                    </span>
                  </div>
                  <CardTitle>{selectedMilestone.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h5 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5 select-none">
                      <BookOpen className="h-3.5 w-3.5 text-brand-secondary" />
                      Core Learning Objectives
                    </h5>
                    <ul className="text-xs text-text-secondary space-y-2 list-disc pl-4">
                      {selectedMilestone.learning_objectives.map((obj, i) => (
                        <li key={i} className="leading-relaxed">
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5 select-none">
                      <GraduationCap className="h-3.5 w-3.5 text-brand-secondary" />
                      Assessment Requirements
                    </h5>
                    <div className="p-3 border border-white/5 bg-background/50 rounded-md flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Topic evaluation test</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(ROUTES.QUIZ)}
                        className="py-1 h-7 text-[10.5px] cursor-pointer"
                      >
                        Challenge
                      </Button>
                    </div>
                  </div>

                  {selectedMilestone.status !== 'not_started' && (
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        className="w-full text-xs font-semibold py-2.5"
                        onClick={() => router.push(ROUTES.DAILY_PLAN)}
                      >
                        Go to daily checklists
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Capstone Project Teaser */}
              <Card hoverable={true} className="border-card-border p-5 bg-[#070715]/40 hover:border-brand-primary/42 text-left cursor-pointer" onClick={() => router.push(ROUTES.PROJECTS)}>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary flex items-center justify-center shrink-0">
                    <Hammer className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-text-primary">Capstone Assignment</span>
                    <span className="text-[11px] text-text-secondary mt-0.5 max-w-xs leading-normal">
                      Build the milestone verification project and ask help using socratic chat tools.
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card hoverable={false} className="p-6 text-center text-text-muted">
              Select a milestone timeline node to display topic targets.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
