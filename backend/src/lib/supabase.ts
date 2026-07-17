import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

if (env.SUPABASE_URL === 'https://placeholder.supabase.co') {
  logger.warn('Supabase client is running with placeholder credentials. Please update .env with your actual Supabase URL & Anon Key.');
} else {
  logger.info('Supabase client successfully configured.');
}

// Disable session persistence since Node server processes are sessionless/stateless
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const getSupabaseClient = (accessToken?: string) => {
  if (!accessToken) {
    return supabase;
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

