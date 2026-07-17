'use client';

import React, { useState } from 'react';
import { Hammer, Sparkles, Send, HelpCircle, Code, Award, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';
import { MOCK_PROJECTS } from '../../../constants/mockData';
import { stripCodeBlocks } from '../../../lib/utils';

export default function ProjectsPage() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[1]); // Active is project 2
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [steps, setSteps] = useState(activeProject.steps || []);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; message: string; timestamp: string }>>([]);

  const handleRevealHint = (idx: number) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === idx ? { ...step, hint_revealed: true } : step))
    );
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    const cleanUserMsg = stripCodeBlocks(userMsg); // filter out code blocks
    
    const newHistory = [...chatHistory, {
      role: 'user' as const,
      message: cleanUserMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }];

    setChatHistory(newHistory);
    setChatMessage('');
    setIsTyping(true);

    // Simulate Socratic Mentor replies
    setTimeout(() => {
      let mentorReply = "Let's work through this. Instead of pasting code classes, look at the error log. What does it report about undefined targets?";
      
      if (cleanUserMsg.toLowerCase().includes('middlware') || cleanUserMsg.toLowerCase().includes('validation')) {
        mentorReply = "Good check. Middleware interceptors evaluate inputs before controllers load. Think about the order of operations in your parameters stack. Where is the validation schema declared?";
      } else if (cleanUserMsg.toLowerCase().includes('router') || cleanUserMsg.toLowerCase().includes('route')) {
        mentorReply = "Examine the scope of your router initialization. Are you mounting the routes file in your central server script correctly? What routes path prefix is linked?";
      }

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          message: mentorReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Project Checkpoints list */}
        <div className="lg:col-span-2 space-y-6">
          <Card hoverable={false} className="border-card-border p-6 text-left col-span-2">
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <div>
                <CardTitle>{activeProject.title}</CardTitle>
                <CardDescription>Target: {activeProject.deliverable}</CardDescription>
              </div>
              <Badge variant="primary">
                {activeProject.estimated_hours} hours target
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="text-xs font-bold text-text-primary mb-1 select-none">Project Description</h5>
                <p className="text-xs text-text-secondary leading-relaxed">{activeProject.description}</p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-text-primary mb-2 select-none">Required Stack</h5>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.tech_stack.map((tech) => (
                    <span key={tech} className="text-[10px] select-none text-brand-secondary bg-brand-primary/5 px-2 py-0.5 rounded-full border border-brand-primary/10 font-bold">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Steps List */}
          <Card hoverable={false} className="border-card-border p-6 text-left">
            <CardHeader className="mb-4">
              <CardTitle>Milestone Milestones Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 border border-white/3 bg-background/30 rounded-md">
                  <div className="h-6 w-6 rounded-full bg-brand-primary/10 text-brand-secondary flex items-center justify-center font-bold text-xs select-none shrink-0">
                    {step.step_number}
                  </div>
                  <div className="flex-1 flex flex-col text-left">
                    <span className="text-xs font-bold text-text-primary">{step.title}</span>
                    <p className="text-xs text-text-secondary mt-1">{step.description}</p>

                    {step.hint_revealed ? (
                      <div className="mt-3 p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-md text-[11px] text-brand-secondary leading-relaxed italic">
                        Tip: {step.hint}
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
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Socratic Mentor Chat Sidebar */}
        <div className="h-[600px] flex flex-col">
          <Card hoverable={false} className="border-card-border flex flex-col h-full p-6 text-left bg-[#070712]/40">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <div className="h-9 w-9 rounded-lg brand-gradient text-white flex items-center justify-center shrink-0 shadow-glow">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm">Socratic Technical Mentor</CardTitle>
                <CardDescription className="text-[10px]">Guiding queries without block checks</CardDescription>
              </div>
            </CardHeader>

            {/* Chat Messages scroll container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs mb-4">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-text-muted px-4 select-none">
                  <HelpCircle className="h-8 w-8 mb-2" />
                  <p className="font-semibold text-xs text-text-secondary">Ask Socratic Questions</p>
                  <p className="text-[10px] max-w-[200px] mt-1 line-clamp-3">Mentor explains principles to nudge your debugging—no direct copy code shortcuts.</p>
                </div>
              ) : (
                chatHistory.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] rounded-lg p-3 ${
                      chat.role === 'user'
                        ? 'bg-brand-primary/10 border border-brand-primary/20 ml-auto'
                        : 'bg-white/3 border border-white/5 mr-auto'
                    }`}
                  >
                    <span className="text-[11px] text-text-primary leading-relaxed break-words font-medium">
                      {chat.message}
                    </span>
                    <span className="text-[9px] text-text-muted mt-1.5 text-right select-none">
                      {chat.timestamp}
                    </span>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="bg-white/3 border border-white/5 rounded-lg p-3 flex items-center gap-1.5 max-w-[100px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce delay-300" />
                </div>
              )}
            </div>

            {/* Prompt input field */}
            <form onSubmit={handleSendPrompt} className="flex gap-2 border-t border-white/5 pt-4">
              <Input
                id="workspaceMessage"
                type="text"
                placeholder="Ask about step configs..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={isTyping}
                className="h-9 py-1 px-3 text-xs"
              />
              <Button type="submit" variant="primary" size="sm" className="h-9 py-1 px-3.5 cursor-pointer" disabled={isTyping}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}
