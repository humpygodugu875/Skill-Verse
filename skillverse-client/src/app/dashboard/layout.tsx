'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/shared/sidebar';
import { useAuthStore } from '../../store';
import { ROUTES } from '../../constants/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Session Auth Gate check
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    } else {
      setIsRendered(true);
    }
  }, [isAuthenticated, router]);

  if (!isRendered) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-text-secondary select-none">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-6.5 w-6.5 text-brand-secondary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-semibold tracking-wide">Syncing Workspace Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Workspace Sidebar Wrapper */}
      <Sidebar />

      {/* Main Study Desk Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-linear-to-b from-[#030307] to-[#070716] p-6 md:p-8">
        <div className="max-w-6xl w-full mx-auto space-y-6 animate-fade-slide-up">
          {children}
        </div>
      </main>
    </div>
  );
}
