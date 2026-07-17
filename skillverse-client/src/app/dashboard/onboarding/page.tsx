'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Play, Hourglass, CheckCircle2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';
import AgentCard from '../../../components/ui/agent-card';
import { usePipelineStore, useWorkspaceStore } from '../../../store';
import { ROUTES } from '../../../constants/navigation';
import { MOCK_ROADMAP, MOCK_AGENTS, MOCK_TASKS } from '../../../constants/mockData';

export default function OnboardingPage() {
  const router = useRouter();
  
  // Zustand State hooks
  const { isGenerating, setGenerating, activeAgentsList, generationStep, setStep } = usePipelineStore();
  const { setActiveRoadmap, setTasksList } = useWorkspaceStore();

  // Onboarding Form parameters
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('15');
  const [weeks, setWeeks] = useState('6');
  const [experience, setExperience] = useState('beginner');

  const startOrchestratorSimulation = () => {
    // Scaffold initial idle agent instances
    usePipelineStore.setState({
      activeAgentsList: MOCK_AGENTS.map(agent => ({ ...agent, status: 'idle' }))
    });
    setGenerating(true);
    setStep(0);

    const agents = MOCK_AGENTS;
    let currentAgentIndex = 0;

    const runNextAgentStep = () => {
      if (currentAgentIndex >= agents.length) {
        // Pipeline completed. Save roadmaps inside stores.
        setTimeout(() => {
          setActiveRoadmap(MOCK_ROADMAP);
          setTasksList(MOCK_TASKS);
          setGenerating(false);
          router.push(ROUTES.ROADMAP);
        }, 1200);
        return;
      }

      setStep(currentAgentIndex + 1);

      // Toggle preceding agents as completed & current active
      usePipelineStore.setState((state) => ({
        activeAgentsList: state.activeAgentsList.map((agent, idx) => {
          if (idx < currentAgentIndex) return { ...agent, status: 'done' };
          if (idx === currentAgentIndex) return { ...agent, status: 'active' };
          return { ...agent, status: 'idle' };
        }),
      }));

      currentAgentIndex++;
      setTimeout(runNextAgentStep, 1500); // 1.5 seconds per Agent
    };

    setTimeout(runNextAgentStep, 500);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || goal.trim().length < 10) return;
    
    startOrchestratorSimulation();
  };

  // 1. Generation Animation View
  if (isGenerating) {
    return (
      <div className="space-y-8 py-6 text-center max-w-4xl mx-auto flex flex-col items-center justify-center">
        
        {/* Loading Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-11 w-11 rounded-xl brand-gradient flex items-center justify-center text-white shadow-glow animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary mt-2">
            Assembling Your AI Learning Team
          </h2>
          <p className="text-xs text-text-secondary max-w-md">
            Agents are analyzing targets, compiling milestones, scheduler checklists, and querying whitelisted documents.
          </p>
        </div>

        {/* Dynamic Pipeline Progress Bar */}
        <div className="w-full max-w-xl mx-auto h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full brand-gradient rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(generationStep / MOCK_AGENTS.length) * 100}%` }}
          />
        </div>

        {/* Active Agents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {activeAgentsList.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    );
  }

  // 2. Goal Input Form Wizard Design
  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="text-left mb-8">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
          Formulate Your Learning Target
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Provide parameters to configure your personalized, agent-generated workspace.
        </p>
      </div>

      <Card hoverable={false} className="border-card-border bg-[#070712]/50 p-8 text-left">
        <form onSubmit={handleCreateRequest} className="space-y-6">
          
          {/* Target Goal Input */}
          <div className="flex flex-col gap-1.5 align-left">
            <label className="text-xs font-semibold text-text-secondary select-none tracking-wide text-left">
              What objective would you like to achieve?
            </label>
            <textarea
              className="w-full min-h-[100px] bg-card-bg/75 border border-card-border rounded-md px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 transition-all resize-none"
              placeholder="e.g. Master TypeScript backend APIs and databases in order to build high-performance microservices."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isGenerating}
              required
            />
            <span className="text-[10px] text-text-muted text-left">
              Minimum 10 characters. Avoid brief descriptions.
            </span>
          </div>

          {/* Configuration Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Input
              id="hours"
              type="number"
              label="Hours Available per Week"
              min="1"
              max="40"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={isGenerating}
            />
            <Input
              id="weeks"
              type="number"
              label="Target Deadline (Weeks)"
              min="1"
              max="52"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              disabled={isGenerating}
            />

            <div className="flex flex-col gap-1.5 align-left">
              <label className="text-xs font-semibold text-text-secondary select-none tracking-wide text-left">
                Prior Familiarity
              </label>
              <select
                className="w-full bg-card-bg/75 border border-card-border rounded-md px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 transition-all cursor-pointer h-10"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                disabled={isGenerating}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold h-11"
            disabled={goal.trim().length < 10}
          >
            Orchestrate Learning Team
            <Play className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
