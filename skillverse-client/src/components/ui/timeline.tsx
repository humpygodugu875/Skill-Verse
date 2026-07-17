'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Milestone } from '../../types';
import { cn } from '../../lib/utils';
import Card from './card';
import Badge from './badge';

export interface TimelineProps {
  milestones: Milestone[];
  onSelectMilestone?: (milestoneId: string) => void;
}

export default function Timeline({
  milestones,
  onSelectMilestone,
}: TimelineProps) {
  return (
    <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8 py-2 align-left justify-start">
      {milestones.map((milestone, index) => {
        const isCompleted = milestone.status === 'completed';
        const isInProgress = milestone.status === 'in_progress';

        return (
          <div key={milestone.id} className="relative group text-left">
            {/* Timeline bullet indicator */}
            <span className={cn(
              "absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border text-[9px] font-bold select-none cursor-pointer",
              isCompleted && "bg-status-success border-status-success text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]",
              isInProgress && "bg-brand-primary border-brand-primary text-white shadow-[0_0_10px_rgba(124,58,255,0.4)]",
              milestone.status === 'not_started' && "bg-[#030307] border-white/20 text-text-secondary"
            )}>
              {isCompleted ? <Check className="h-2.5 w-2.5" /> : milestone.sequence_number}
            </span>

            {/* Content card */}
            <Card
              hoverable={true}
              onClick={() => onSelectMilestone?.(milestone.id)}
              className={cn(
                "cursor-pointer transition-all p-5 hover:border-brand-primary/40",
                isInProgress && "border-brand-primary/45 bg-brand-primary/5 shadow-glow"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col text-left">
                  <h4 className="font-display font-semibold text-base text-text-primary group-hover:text-brand-secondary transition-colors">
                    {milestone.title}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Duration Target: {milestone.estimated_days} days
                  </p>
                </div>
                <div>
                  <Badge variant={isCompleted ? 'success' : isInProgress ? 'primary' : 'secondary'}>
                    {milestone.status === 'completed' ? 'Passed' : milestone.status === 'in_progress' ? 'Active' : 'Unopened'}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                {milestone.description}
              </p>

              {/* Topics tags */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {milestone.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[10px] select-none text-brand-secondary bg-brand-primary/5 px-2 py-0.5 rounded-full border border-brand-primary/10 font-semibold"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
