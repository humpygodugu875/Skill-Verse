'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hammer, Sparkles, Send, HelpCircle, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';
import { useWorkspaceStore } from '../../../store';
import { stripCodeBlocks } from '../../../lib/utils';
import { api } from '../../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

interface ProjectStep {
  step_number: number;
  title?: string;
  description: string;
  hint?: string;
  hint_revealed?: boolean;
}

interface LiveProject {
  id: string;
  title: string;
  description: string;
  requirements: string | string[];
  tech_stack: string[];
  steps: ProjectStep[];
  estimated_hours?: number;
  roadmap_modules?: { title: string; sequence_number: number } | null;
  project_progress?: { status: string }[] | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ─── Socratic Mentor Chat Panel ───────────────────────────────────────────────

function MentorChat({
  project,
}: {
  project: LiveProject | null;
}) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping]       = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [chatError, setChatError]     = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Load chat history when project changes ──────────────────────────────
  useEffect(() => {
    if (!project?.id) return;

    let cancelled = false;
    setChatHistory([]);
    setChatError(null);
    setHistoryLoaded(false);

    api.projects.getHistory(project.id)
      .then((envelope: any) => {
        if (cancelled) return;
        const history: ChatMessage[] = Array.isArray(envelope?.data?.history)
          ? envelope.data.history
          : [];
        setChatHistory(history);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.warn('[MentorChat] Could not load history:', err?.message);
        // Non-fatal — chat is still usable
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });

    return () => { cancelled = true; };
  }, [project?.id]);

  // ── Auto-scroll on new messages ─────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  // ── Send a message ──────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isTyping || !project?.id) return;

    const rawMessage = chatMessage.trim();
    const cleanMessage = stripCodeBlocks(rawMessage); // filter code blocks per existing util
    setChatMessage('');
    setChatError(null);
    setIsTyping(true);

    // Optimistically add user message
    const optimisticUser: ChatMessage = {
      role: 'user',
      message: cleanMessage,
      timestamp: new Date().toISOString(),
    };
    setChatHistory(prev => [...prev, optimisticUser]);

    try {
      const envelope = await api.projects.sendMessage(project.id, cleanMessage);
      // Envelope: { success, data: { reply, history } }
      const data = envelope?.data;

      if (data?.history && Array.isArray(data.history)) {
        // Replace with authoritative history from server (includes timestamps)
        setChatHistory(data.history);
      } else if (data?.reply) {
        // Fallback: append assistant reply manually
        const assistantEntry: ChatMessage = {
          role: 'assistant',
          message: data.reply,
          timestamp: new Date().toISOString(),
        };
        setChatHistory(prev => {
          // Replace the optimistic user entry with the server history
          const withoutOptimistic = prev.filter(m => m !== optimisticUser);
          return [...withoutOptimistic, optimisticUser, assistantEntry];
        });
      }
    } catch (err: any) {
      console.error('[MentorChat] Send failed:', err);
      // Remove the optimistic message since the send failed
      setChatHistory(prev => prev.filter(m => m !== optimisticUser));

      let msg = 'Failed to reach the mentor. Check your network and try again.';
      if (err?.status === 401) msg = 'Your session expired. Please log in again.';
      else if (err?.status === 404) msg = 'Project context not found. Try refreshing the page.';
      else if (err?.status === 429) msg = 'Rate limit reached. Please wait a moment before sending another message.';
      else if (err?.status >= 500) msg = 'The mentor service is temporarily unavailable. Try again shortly.';
      else if (err?.message) msg = err.message;

      setChatError(msg);
    } finally {
      setIsTyping(false);
    }
  };

  const isDisabled = isTyping || !project?.id || !historyLoaded;

  return (
    <Card hoverable={false} className="border-card-border flex flex-col h-full p-6 text-left bg-[#070712]/40">
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="h-9 w-9 rounded-lg brand-gradient text-white flex items-center justify-center shrink-0 shadow-glow">
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        <div>
          <CardTitle className="text-sm">Socratic Technical Mentor</CardTitle>
          <CardDescription className="text-[10px]">
            {project ? `Guiding: ${project.title}` : 'No project loaded'}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs mb-4"
      >
        {/* Error banner */}
        {chatError && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-status-danger/10 border border-status-danger/20 text-status-danger text-[11px]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{chatError}</span>
          </div>
        )}

        {/* Empty state */}
        {historyLoaded && chatHistory.length === 0 && !chatError && (
          <div className="flex flex-col items-center justify-center text-center h-full text-text-muted px-4 select-none">
            <HelpCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold text-xs text-text-secondary">Ask Socratic Questions</p>
            <p className="text-[10px] max-w-[200px] mt-1 line-clamp-4">
              Your mentor knows your project context. Ask about architecture, debugging steps, or how to approach a requirement.
            </p>
          </div>
        )}

        {/* History skeleton while loading */}
        {!historyLoaded && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[11px] select-none animate-pulse gap-1">
            <Sparkles className="h-5 w-5 mb-1" />
            Loading conversation…
          </div>
        )}

        {/* Chat messages */}
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[88%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-brand-primary/10 border border-brand-primary/20 ml-auto'
                : 'bg-white/3 border border-white/5 mr-auto'
            }`}
          >
            <span className="text-[11px] text-text-primary leading-relaxed break-words font-medium whitespace-pre-wrap">
              {msg.message}
            </span>
            <span className="text-[9px] text-text-muted mt-1.5 text-right select-none">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="bg-white/3 border border-white/5 rounded-lg p-3 flex items-center gap-1.5 max-w-[100px]">
            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce delay-150" />
            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce delay-300" />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-white/5 pt-4">
        <Input
          id="mentorMessage"
          type="text"
          placeholder={project ? 'Ask about your project…' : 'No project loaded'}
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          disabled={isDisabled}
          className="h-9 py-1 px-3 text-xs"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="h-9 py-1 px-3.5 cursor-pointer shrink-0"
          disabled={isDisabled || chatMessage.trim().length === 0}
          aria-label="Send message"
        >
          {isTyping ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { activeRoadmap } = useWorkspaceStore();

  const [projects, setProjects]           = useState<LiveProject[]>([]);
  const [activeProject, setActiveProject] = useState<LiveProject | null>(null);
  const [steps, setSteps]                 = useState<ProjectStep[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // ── Fetch all projects for this user ─────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const envelope = await api.projects.getAll();
      const data: LiveProject[] = Array.isArray(envelope?.data) ? envelope.data : [];

      if (data.length > 0) {
        setProjects(data);
        setActiveProject(data[0]);
      } else if (activeRoadmap?.milestones) {
        // Graceful fallback: pull from store if API returns empty
        const storeProjects = activeRoadmap.milestones
          .map((m: any) => m.project)
          .filter(Boolean);
        if (storeProjects.length > 0) {
          setActiveProject(storeProjects[0]);
        }
      }
    } catch (err: any) {
      console.error('[ProjectsPage] Failed to fetch projects:', err);
      setProjectsError(err?.message || 'Failed to load projects.');

      // Store fallback on API failure
      if (activeRoadmap?.milestones) {
        const storeProjects = activeRoadmap.milestones
          .map((m: any) => m.project)
          .filter(Boolean);
        if (storeProjects.length > 0) {
          setActiveProject(storeProjects[0]);
        }
      }
    } finally {
      setIsLoadingProjects(false);
    }
  }, [activeRoadmap]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Sync steps when active project changes ────────────────────────────────
  useEffect(() => {
    if (activeProject) {
      setSteps((activeProject.steps || []).map(s => ({ ...s, hint_revealed: false })));
    }
  }, [activeProject?.id]);

  const handleRevealHint = (idx: number) => {
    setSteps(prev =>
      prev.map((step, i) => i === idx ? { ...step, hint_revealed: true } : step)
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
          Capstone Practice Workspace
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Apply topics into actual code and ask socratic questions.
        </p>
      </div>

      {/* Project selector tabs (only when multiple projects) */}
      {projects.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap border-b border-white/5 pb-3">
          {projects.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all border ${
                activeProject?.id === p.id
                  ? 'bg-brand-primary/10 text-brand-secondary border-brand-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/3 border-transparent'
              }`}
            >
              Milestone {p.roadmap_modules?.sequence_number ?? idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoadingProjects && !activeProject && (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm animate-pulse gap-2">
          <Sparkles className="h-4 w-4" />
          Loading projects…
        </div>
      )}

      {/* Error banner */}
      {projectsError && !activeProject && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load projects</p>
            <p className="text-xs mt-0.5 text-status-danger/80">{projectsError}</p>
          </div>
        </div>
      )}

      {/* No project at all */}
      {!isLoadingProjects && !activeProject && !projectsError && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center text-text-muted">
            <Hammer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">No Projects Yet</p>
            <p className="text-xs text-text-muted mt-1 max-w-xs">
              Complete onboarding to generate your AI-powered roadmap and capstone projects.
            </p>
          </div>
        </div>
      )}

      {/* Main content — only shown when a project is loaded */}
      {activeProject && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Project details + step checklist */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project header card */}
            <Card hoverable={false} className="border-card-border p-6 text-left">
              <CardHeader className="flex flex-row items-center justify-between mb-4">
                <div>
                  <CardTitle>{activeProject.title}</CardTitle>
                  <CardDescription>
                    {activeProject.roadmap_modules
                      ? `Milestone ${activeProject.roadmap_modules.sequence_number}: ${activeProject.roadmap_modules.title}`
                      : 'Capstone Project'}
                  </CardDescription>
                </div>
                {activeProject.estimated_hours && (
                  <Badge variant="primary">
                    {activeProject.estimated_hours} hours target
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-text-primary mb-1 select-none">Project Description</h5>
                  <p className="text-xs text-text-secondary leading-relaxed">{activeProject.description}</p>
                </div>

                {/* Tech stack */}
                {activeProject.tech_stack?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-text-primary mb-2 select-none">Required Stack</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {activeProject.tech_stack.map((tech: string) => (
                        <span
                          key={tech}
                          className="text-[10px] select-none text-brand-secondary bg-brand-primary/5 px-2 py-0.5 rounded-full border border-brand-primary/10 font-bold"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {activeProject.requirements && (
                  <div>
                    <h5 className="text-xs font-bold text-text-primary mb-2 select-none">Requirements</h5>
                    <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4">
                      {(Array.isArray(activeProject.requirements)
                        ? activeProject.requirements
                        : [activeProject.requirements]
                      ).map((req: string, i: number) => (
                        <li key={i} className="leading-relaxed">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Steps Checklist */}
            <Card hoverable={false} className="border-card-border p-6 text-left">
              <CardHeader className="mb-4">
                <CardTitle>Milestone Steps Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {steps.length === 0 ? (
                  <p className="text-xs text-text-muted">No steps available for this project.</p>
                ) : (
                  steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-4 border border-white/3 bg-background/30 rounded-md">
                      <div className="h-6 w-6 rounded-full bg-brand-primary/10 text-brand-secondary flex items-center justify-center font-bold text-xs select-none shrink-0">
                        {step.step_number}
                      </div>
                      <div className="flex-1 flex flex-col text-left">
                        {step.title && (
                          <span className="text-xs font-bold text-text-primary">{step.title}</span>
                        )}
                        <p className="text-xs text-text-secondary mt-1">{step.description}</p>

                        {step.hint_revealed ? (
                          <div className="mt-3 p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-md text-[11px] text-brand-secondary leading-relaxed italic">
                            💡 {step.hint || 'Consult the mentor chat for hints.'}
                          </div>
                        ) : (
                          <div className="mt-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="py-1 h-7 text-[10px] cursor-pointer"
                              onClick={() => handleRevealHint(idx)}
                            >
                              Reveal guide tip
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Socratic Mentor Chat */}
          <div className="h-[640px] flex flex-col">
            <MentorChat project={activeProject} />
          </div>
        </div>
      )}
    </div>
  );
}
