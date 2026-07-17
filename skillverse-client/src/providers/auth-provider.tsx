'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
        } else {
          clearSession();
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Subscribe to authentication state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        if (session) {
          setSession(session);
        }
      } else if (event === 'SIGNED_OUT') {
        clearSession();
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, clearSession, setLoading]);

  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
