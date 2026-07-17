import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export default function Badge({
  children,
  className,
  variant = 'secondary',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold select-none border tracking-wider transition-colors';
  
  const variants = {
    primary: 'bg-brand-primary/10 border-brand-primary/30 text-brand-secondary',
    secondary: 'bg-white/5 border-white/15 text-text-secondary',
    success: 'bg-status-success/10 border-status-success/30 text-status-success',
    warning: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    danger: 'bg-status-error/10 border-status-error/30 text-status-error',
    info: 'bg-status-info/10 border-status-info/30 text-status-info',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
