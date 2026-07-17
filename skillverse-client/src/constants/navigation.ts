export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  ONBOARDING: '/dashboard/onboarding',
  ROADMAP: '/dashboard/roadmap',
  DAILY_PLAN: '/dashboard/daily-plan',
  RESOURCES: '/dashboard/resources',
  PROJECTS: '/dashboard/projects',
  QUIZ: '/dashboard/quiz',
  PROGRESS: '/dashboard/progress',
  SETTINGS: '/dashboard/settings',
} as const;

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  description: string;
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    title: 'Overview',
    href: ROUTES.DASHBOARD,
    iconName: 'LayoutDashboard',
    description: 'Workspace main command center panels.'
  },
  {
    title: 'Timeline Roadmap',
    href: ROUTES.ROADMAP,
    iconName: 'Map',
    description: 'Dynamic sequence milestones roadmap.'
  },
  {
    title: 'Daily Planner',
    href: ROUTES.DAILY_PLAN,
    iconName: 'CalendarRange',
    description: 'Day-by-day checklist task guides.'
  },
  {
    title: 'Resource Library',
    href: ROUTES.RESOURCES,
    iconName: 'Library',
    description: 'Bookmarked tutorials and documents.'
  },
  {
    title: 'Capstone Projects',
    href: ROUTES.PROJECTS,
    iconName: 'Hammer',
    description: 'Applied practice with Socratic hints.'
  },
  {
    title: 'Quiz Center',
    href: ROUTES.QUIZ,
    iconName: 'HelpCircle',
    description: 'Test evaluations and retention checkers.'
  },
  {
    title: 'Progress Heatmap',
    href: ROUTES.PROGRESS,
    iconName: 'Activity',
    description: 'Streaks tally and logs summaries.'
  },
];

export const FOOTER_NAV_ITEMS: NavItem[] = [
  {
    title: 'Settings',
    href: ROUTES.SETTINGS,
    iconName: 'Settings',
    description: 'Option settings profiles.'
  }
];
