'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, LogIn, Compass } from 'lucide-react';
import { ROUTES } from '../../constants/navigation';
import { useAuthStore } from '../../store';
import Button from '../ui/button';

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, clearSession } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2 گروه cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient text-white shadow-glow">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="font-display font-bold text-lg text-text-primary tracking-wide">
            Skill<span className="text-brand-secondary">Verse</span>
          </span>
        </Link>

        {/* Global links */}
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href={ROUTES.DASHBOARD} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
                <Compass className="h-4 w-4" />
                Go to Workspace
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  clearSession();
                  router.push(ROUTES.HOME);
                }}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.LOGIN}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(ROUTES.SIGNUP)}
              >
                Get Started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
