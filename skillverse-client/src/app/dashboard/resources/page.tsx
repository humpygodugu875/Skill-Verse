'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Video, FileText, Bookmark, BookmarkCheck, ExternalLink, Library } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import Button from '../../../components/ui/button';
import { MOCK_RESOURCES } from '../../../constants/mockData';

export default function ResourcesPage() {
  const [resources, setResources] = useState(MOCK_RESOURCES);
  const [filterType, setFilterType] = useState<'All' | 'Article' | 'Video' | 'Documentation'>('All');

  const handleBookmarkToggle = (id: string) => {
    setResources((prev) =>
      prev.map((res) =>
        res.id === id ? { ...res, is_bookmarked: !res.is_bookmarked } : res
      )
    );
  };

  const filteredResources = filterType === 'All'
    ? resources
    : resources.filter((res) => res.resource_type === filterType);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return Video;
      case 'Documentation':
        return FileText;
      case 'Article':
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary flex items-center gap-2 select-none">
            Selected Learning Resources
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Curator Agent provides verified documentation and tutorials.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 justify-start select-none">
        {(['All', 'Article', 'Video', 'Documentation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              filterType === tab
                ? 'bg-brand-primary/10 text-brand-secondary border border-brand-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/3 border border-transparent'
            }`}
          >
            {tab === 'Documentation' ? 'Docs' : tab}s
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => {
          const Icon = getResourceIcon(res.resource_type);
          return (
            <Card key={res.id} hoverable={true} className="flex flex-col justify-between text-left p-6 relative">
              
              {/* Top Meta info */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] text-text-muted select-none">
                  #{res.topic}
                </span>

                <button
                  onClick={() => handleBookmarkToggle(res.id)}
                  className="text-text-secondary hover:text-brand-secondary p-1 rounded-md hover:bg-white/5 cursor-pointer"
                >
                  {res.is_bookmarked ? (
                    <BookmarkCheck className="h-4.5 w-4.5 text-brand-secondary" />
                  ) : (
                    <Bookmark className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>

              {/* Title & Icon */}
              <div className="mt-4 flex-grow">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="p-2 rounded-md bg-white/5 border border-white/10 text-brand-secondary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Badge variant={res.difficulty === 'beginner' ? 'info' : 'primary'}>
                    {res.difficulty}
                  </Badge>
                </div>
                <h3 className="font-display font-semibold text-sm text-text-primary mb-2 line-clamp-2">
                  {res.title}
                </h3>
                {res.why_recommended && (
                  <p className="text-xs text-text-secondary italic leading-relaxed line-clamp-3">
                    &ldquo;{res.why_recommended}&rdquo;
                  </p>
                )}
              </div>

              {/* Duration and Button */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10.5px] text-text-muted select-none">
                  {res.estimated_minutes} min read
                </span>
                <Link
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                >
                  Read original
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
