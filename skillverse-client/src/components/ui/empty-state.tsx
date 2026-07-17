import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './button';

export interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: string;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  iconName,
  actionText,
  onActionClick,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("glass-panel border-dashed border-white/10 rounded-lg p-10 flex flex-col items-center justify-center text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-brand-secondary mb-4">
        <HelpCircle className="h-6 w-6" />
      </div>
      <h3 className="font-display font-semibold text-lg text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onActionClick && (
        <Button variant="secondary" onClick={onActionClick}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
