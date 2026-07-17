'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Target, ClipboardList, BookOpen, Compass, Code, Brain } from 'lucide-react';
import Navbar from '../components/shared/navbar';
import Button from '../components/ui/button';
import Card from '../components/ui/card';
import { ROUTES } from '../constants/navigation';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Target,
      title: 'Smart Onboarding',
      description: 'Analyze vague goals and extract structured learning targets in seconds.',
    },
    {
      icon: Brain,
      title: 'Dynamic Agent Teams',
      description: 'Watch specialized AI agents collaborate to plan your learning journey.',
    },
    {
      icon: ClipboardList,
      title: 'Daily Action Planners',
      description: 'Stay consistent with scheduled blocks matching your weekly hours.',
    },
    {
      icon: BookOpen,
      title: 'Search-Free Resources',
      description: 'Get verified tutorials and documentation linked to every milestone.',
    },
    {
      icon: Code,
      title: 'Socratic Mentorship',
      description: 'Build capstone projects with guiding feedback—no direct code cheat sheets.',
    },
    {
      icon: Compass,
      title: 'Career Outcomes',
      description: 'Translate acquired knowledge into resume impact statements and mock interviews.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-32 overflow-hidden flex flex-col items-center justify-center text-center">
          
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-brand-secondary/5 blur-3xl pointer-events-none" />

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-xs font-semibold text-brand-secondary shadow-sm mb-6 select-none">
            <Sparkles className="h-3.5 w-3.5" />
            Learn beyond standard documentation queries
          </div>

          {/* Heading */}
          <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight max-w-4xl leading-[1.1] mb-6 text-left md:text-center">
            Your personalized AI learning team, <span className="text-brand-gradient">orchestrated automatically.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed text-left md:text-center">
            Define a high-level learning goal. Skip the search grids. Watch specialized AI agents collaborate to generate a dynamic roadmap, daily checklists, capstones, and career outposts.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(ROUTES.SIGNUP)}
              className="w-full sm:w-auto font-bold"
            >
              Start Your Journey
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push(ROUTES.LOGIN)}
              className="w-full sm:w-auto"
            >
              Access Workspace
            </Button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-3">
              Designed to beat tutorial hell
            </h2>
            <p className="text-sm text-text-secondary max-w-lg mx-auto">
              SkillVerse is an active learning teammate that ensures you practice and test your knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} hoverable={true} className="flex flex-col text-left p-6">
                  <div className="h-10 w-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary flex items-center justify-center mb-5 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-semibold text-base text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-text-muted select-none">
        <p>© 2026 SkillVerse AI Platform. Learn Smarter. Grow Faster.</p>
      </footer>
    </div>
  );
}
