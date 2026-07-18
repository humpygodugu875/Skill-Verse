import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { env } from '../config/env';
import { logger } from '../utils/logger';

if (env.SUPABASE_URL === 'https://placeholder.supabase.co') {
  logger.warn('Supabase client is running with placeholder credentials. Please update .env with your actual Supabase URL & Anon Key.');
} else {
  logger.info('Supabase client successfully configured.');
}

// Global context storage to pass request bearer tokens to services without changing function signatures
export const contextStorage = new AsyncLocalStorage<{ token?: string }>();

// Monkey-patch the global Express application prototype init function to hook request lifecycles
const expressProto = (express as any).application;
if (expressProto && typeof expressProto.init === 'function') {
  const originalInit = expressProto.init;
  expressProto.init = function (...args: any[]) {
    const result = originalInit.apply(this, args);
    // Mount context middleware at the very top of the Express app stack
    this.use((req: any, _res: any, next: any) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : undefined;

      contextStorage.run({ token }, () => {
        next();
      });
    });
    return result;
  };
}

// Disable session persistence since Node server processes are sessionless/stateless
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const getSupabaseClient = (accessToken?: string) => {
  const token = accessToken || contextStorage.getStore()?.token;
  if (!token) {
    return supabase;
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};
