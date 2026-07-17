'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  CalendarRange,
  Library,
  Hammer,
  HelpCircle,
  Activity,
  Settings,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SIDEBAR_NAV_ITEMS, FOOTER_NAV_ITEMS, ROUTES } from '../../constants/navigation';
import { useAuthStore } from '../../store';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Map,
  CalendarRange,
  Library,
  Hammer,
  HelpCircle,
  Activity,
  Settings
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuthStore();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    clearSession();
    router.push(ROUTES.HOME);
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-[#030307] flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center border-b border-white/5 gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md brand-gradient text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display font-bold text-base text-text-primary tracking-wide">
          Skill<span className="text-brand-secondary">Verse</span>
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.iconName] || HelpCircle;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer",
                isActive
                  ? "bg-brand-primary/10 border-brand-primary/20 text-text-primary font-bold shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/3"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-brand-secondary" : "text-text-secondary")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="border-t border-white/5 p-4 bg-white/2 flex flex-col gap-2 align-bottom justify-end">
        {FOOTER_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.iconName] || Settings;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer",
                isActive
                  ? "bg-brand-primary/10 border-brand-primary/20 text-text-primary font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/3"
              )}
            >
              <Icon className="h-4.5 w-4.5 text-text-secondary" />
              {item.title}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold text-status-error/85 hover:text-status-error hover:bg-status-error/5 border border-transparent hover:border-status-error/10 transition-all cursor-pointer text-left w-full"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log Out
        </button>

        {user?.email && (
          <div className="mt-2 px-3 py-1.5 border border-white/5 bg-background/30 rounded-md text-center">
            <span className="text-[10px] text-text-muted block truncate font-medium text-left">
              Logged in as
            </span>
            <span className="text-[10.5px] text-text-secondary block truncate font-bold text-left">
              {user.email}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
