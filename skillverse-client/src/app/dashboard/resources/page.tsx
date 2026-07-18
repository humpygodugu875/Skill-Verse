'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Video,
  FileText,
  BookMarked,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  AlertCircle,
  Library,
  RefreshCw,
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import Skeleton from '../../../components/ui/loading-skeleton';
import { api } from '../../../services/api';
import { ROUTES } from '../../../constants/navigation';

// ─── Types ──────────────────────────────────────────────────────────────────

type ResourceType = 'article' | 'video' | 'course' | 'documentation' | 'tool';

interface Resource {
  id: string;
  module_id: string;
  title: string;
  url: string;
  resource_type: ResourceType;
  estimated_minutes: number | null;
  why_recommended: string | null;
  is_completed: boolean;
  roadmap_modules?: {
    id: string;
    title: string;
    sequence_number: number;
  } | null;
}

// ─── Filter definitions ──────────────────────────────────────────────────────

type FilterTab = 'All' | 'Articles' | 'Videos' | 'Documentation' | 'Books';

interface FilterConfig {
  label: FilterTab;
  apiType?: ResourceType | ResourceType[];   // undefined means no filter (All)
}

const FILTERS: FilterConfig[] = [
  { label: 'All' },
  { label: 'Articles',      apiType: 'article' },
  { label: 'Videos',        apiType: 'video' },
  { label: 'Documentation', apiType: 'documentation' },
  { label: 'Books',         apiType: 'course' },   // 'course' is the closest DB enum value
];

// ─── Icon helpers ────────────────────────────────────────────────────────────

const getResourceIcon = (type: ResourceType) => {
  switch (type) {
    case 'video':        return Video;
    case 'documentation': return FileText;
    case 'course':       return BookMarked;    // "Books"
    case 'tool':         return Library;
    case 'article':
    default:             return BookOpen;
  }
};

const getResourceLabel = (type: ResourceType): string => {
  switch (type) {
    case 'course':        return 'Book / Course';
    case 'documentation': return 'Docs';
    case 'video':         return 'Video';
    case 'tool':          return 'Tool';
    default:              return 'Article';
  }
};

const getBadgeVariant = (type: ResourceType) => {
  switch (type) {
    case 'video':         return 'warning';
    case 'documentation': return 'info';
    case 'course':        return 'success';
    case 'tool':          return 'secondary';
    default:              return 'primary';
  }
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function ResourceSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl border border-white/5 bg-card-bg/50 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="flex items-center gap-2.5 mt-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyResources({ filter, onClear }: { filter: FilterTab; onClear: () => void }) {
  const isFiltered = filter !== 'All';
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-14 w-14 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center text-text-muted">
        <Library className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">
          {isFiltered ? `No ${filter} Found` : 'No Resources Yet'}
        </p>
        <p className="text-xs text-text-muted mt-1 max-w-xs">
          {isFiltered
            ? `No resources of type "${filter}" exist in your current roadmap.`
            : 'Complete the onboarding to generate a personalised roadmap with curated resources.'}
        </p>
      </div>
      {isFiltered && (
        <Button variant="secondary" size="sm" onClick={onClear} className="mt-2">
          Clear Filter
        </Button>
      )}
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-14 w-14 rounded-xl bg-status-danger/10 border border-status-danger/20 flex items-center justify-center text-status-danger">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Failed to Load Resources</p>
        <p className="text-xs text-text-muted mt-1 max-w-sm">{message}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2 gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onBookmarkToggle,
}: {
  resource: Resource & { is_bookmarked?: boolean };
  onBookmarkToggle: (id: string) => void;
}) {
  const Icon = getResourceIcon(resource.resource_type);
  const label = getResourceLabel(resource.resource_type);
  const variant = getBadgeVariant(resource.resource_type) as any;
  const milestoneTitle = resource.roadmap_modules?.title;

  return (
    <Card hoverable className="flex flex-col justify-between text-left p-6 relative group transition-all">

      {/* Top meta row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] text-text-muted select-none truncate max-w-[70%]" title={milestoneTitle}>
          {milestoneTitle ? `Milestone ${resource.roadmap_modules?.sequence_number}: ${milestoneTitle}` : 'Learning Resource'}
        </span>
        <button
          onClick={() => onBookmarkToggle(resource.id)}
          className="text-text-secondary hover:text-brand-secondary p-1 rounded-md hover:bg-white/5 cursor-pointer transition-colors shrink-0"
          aria-label={resource.is_bookmarked ? 'Remove bookmark' : 'Bookmark resource'}
        >
          {resource.is_bookmarked ? (
            <BookmarkCheck className="h-4 w-4 text-brand-secondary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Icon + Badge row */}
      <div className="mt-4 flex-grow">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-md bg-white/5 border border-white/10 text-brand-secondary shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-sm text-text-primary mb-2 line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {/* Recommendation rationale */}
        {resource.why_recommended && (
          <p className="text-xs text-text-secondary italic leading-relaxed line-clamp-3">
            &ldquo;{resource.why_recommended}&rdquo;
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10.5px] text-text-muted select-none">
          {resource.estimated_minutes ? `${resource.estimated_minutes} min` : '—'}
        </span>
        <Link
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
        >
          Open resource
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const router = useRouter();

  const [allResources, setAllResources] = useState<(Resource & { is_bookmarked?: boolean })[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

  // ── Fetch all resources once on mount ──────────────────────────────────────
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // apiClient interceptor unwraps axios response → returns the API envelope { success, data }
      const envelope = await api.resources.getAll();
      const data: Resource[] = Array.isArray(envelope?.data) ? envelope.data : [];
      setAllResources(data.map(r => ({ ...r, is_bookmarked: false })));
    } catch (err: any) {
      console.error('[ResourcesPage] fetch failed:', err);
      if (err?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (!err?.status || err?.status >= 500) {
        setError('Unable to reach the backend server. Ensure the Express service is running.');
      } else {
        setError(err?.message || 'An unexpected error occurred while loading resources.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ── Client-side filter (we loaded all at once, filter in memory) ───────────
  const filteredResources = React.useMemo(() => {
    if (activeFilter === 'All') return allResources;
    const config = FILTERS.find(f => f.label === activeFilter);
    if (!config?.apiType) return allResources;
    const types = Array.isArray(config.apiType) ? config.apiType : [config.apiType];
    return allResources.filter(r => types.includes(r.resource_type));
  }, [allResources, activeFilter]);

  // ── Bookmark toggle (local state — UI only) ────────────────────────────────
  const handleBookmarkToggle = (id: string) => {
    setAllResources(prev =>
      prev.map(r => r.id === id ? { ...r, is_bookmarked: !r.is_bookmarked } : r)
    );
  };

  // ── Counts per filter tab ──────────────────────────────────────────────────
  const countForFilter = (filter: FilterConfig): number => {
    if (!filter.apiType) return allResources.length;
    const types = Array.isArray(filter.apiType) ? filter.apiType : [filter.apiType];
    return allResources.filter(r => types.includes(r.resource_type)).length;
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary select-none">
            Learning Resource Library
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            AI-curated materials generated for your active roadmap.
          </p>
        </div>
        {!isLoading && !error && allResources.length > 0 && (
          <span className="text-xs text-text-muted shrink-0 select-none">
            {allResources.length} resource{allResources.length !== 1 ? 's' : ''} total
          </span>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 flex-wrap select-none">
        {FILTERS.map(filter => {
          const count = countForFilter(filter);
          const isActive = activeFilter === filter.label;
          return (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              disabled={isLoading}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-secondary border border-brand-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/3 border border-transparent'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {filter.label}
              {!isLoading && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-primary/20 text-brand-secondary' : 'bg-white/5 text-text-muted'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      {isLoading ? (
        <ResourceSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            if (error.includes('session')) {
              router.push(ROUTES.LOGIN);
            } else {
              fetchResources();
            }
          }}
        />
      ) : filteredResources.length === 0 ? (
        <EmptyResources
          filter={activeFilter}
          onClear={() => setActiveFilter('All')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
