'use client';

import React from 'react';
import { Target, BookOpen, Calendar, Search, Hammer, HelpCircle, Briefcase, Bot, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Agent } from '../../types';
import { cn } from '../../lib/utils';
import Card from './card';

const iconMap: Record<string, React.ComponentType<any>> = {
  Target,
  BookOpen,
  Calendar,
  Search,
  Hammer,
  HelpCircle,
  Briefcase,
  Bot
};

export interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const IconComponent = iconMap[agent.icon] || Bot;

  const statusConfigs = {
    idle: {
      border: 'border-card-border',
      text: 'text-text-muted',
      bg: 'bg-white/5',
      glow: false,
    },
    active: {
      border: 'border-brand-primary/60 outline-pulse-glow',
      text: 'text-brand-secondary',
      bg: 'bg-brand-primary/10',
      glow: true,
    },
    done: {
      border: 'border-status-success/30',
      text: 'text-status-success',
      bg: 'bg-status-success/5',
      glow: false,
    },
  };

  const config = statusConfigs[agent.status];

  return (
    <Card
      hoverable={agent.status === 'active'}
      glow={config.glow}
      className={cn(
        "flex flex-col relative transition-all border p-5",
        config.border,
        agent.status === 'active' && 'animate-pulse-glow'
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2.5 rounded-lg border border-white/5", config.bg, config.text)}>
          <IconComponent className="h-5 w-5" />
        </div>
        {agent.status === 'done' && (
          <CheckCircle className="h-4 w-4 text-status-success" />
        )}
        {agent.status === 'active' && (
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-brand-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-secondary"></span>
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col text-left">
        <h4 className={cn("font-display text-sm font-semibold select-none", 
          agent.status === 'idle' ? 'text-text-secondary' : 'text-text-primary'
        )}>
          {agent.name}
        </h4>
        <p className="text-xs text-text-secondary mt-1 whitespace-normal break-words line-clamp-3">
          {agent.role_description}
        </p>
      </div>
    </Card>
  );
}
