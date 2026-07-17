'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isOpen: boolean;
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  type = 'success',
  isOpen,
  onClose,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, durationMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, durationMs, onClose]);

  const configs = {
    success: {
      icon: CheckCircle,
      text: 'text-status-success',
      border: 'border-status-success/30 bg-status-success/5',
    },
    error: {
      icon: AlertTriangle,
      text: 'text-status-error',
      border: 'border-status-error/30 bg-status-error/5',
    },
    info: {
      icon: CheckCircle, // fallback tag icon
      text: 'text-status-info',
      border: 'border-status-info/30 bg-status-info/5',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3 rounded-lg border backdrop-blur-md shadow-glow-large max-w-sm",
            config.border
          )}
        >
          <Icon className={cn("h-4.5 w-4.5 shrink-0", config.text)} />
          <p className="text-xs font-semibold text-text-primary text-left">
            {message}
          </p>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-0.5 rounded-md hover:bg-white/5 cursor-pointer ml-auto shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
