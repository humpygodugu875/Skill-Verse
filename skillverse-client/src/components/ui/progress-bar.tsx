'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
  showText?: boolean;
}

export default function ProgressBar({
  value,
  className,
  showText = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center text-xs font-semibold text-text-secondary select-none">
        {showText && <span>Goal Progress</span>}
        {showText && <span>{percentage.toFixed(0)}%</span>}
      </div>
      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full brand-gradient rounded-full"
        />
      </div>
    </div>
  );
}
