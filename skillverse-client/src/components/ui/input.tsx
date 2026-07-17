import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export default function Input({
  className,
  type = 'text',
  error,
  label,
  id,
  ...props
}: InputProps) {
  return (
    <div className="w-full flex flex-col gap-1.5 align-left">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-text-secondary select-none tracking-wide text-left">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        className={cn(
          "w-full bg-card-bg/75 border border-card-border rounded-md px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 transition-all",
          error && "border-status-error/50 focus:border-status-error/70 focus:ring-status-error/30",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-status-error/90 font-medium text-left">
          {error}
        </span>
      )}
    </div>
  );
}
