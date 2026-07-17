import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-shimmer bg-linear-to-r from-white/3 to-white/8 bg-[length:200%_100%] rounded-md h-full w-full", className)}
      {...props}
    />
  );
}

export function SkeletonHeadline() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonGridCard() {
  return (
    <div className="glass-panel border border-white/5 p-5 rounded-lg flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex flex-col gap-1.5 w-full">
          <Skeleton className="h-4.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}
