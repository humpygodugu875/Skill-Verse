'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useAuthStore } from '../../store';
import { ROUTES } from '../../constants/navigation';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import Card from '../../components/ui/card';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Submit login request to Supabase Authentication engine
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user || !data.session) {
        throw new Error('Login succeeded, but no session parameters were returned.');
      }

      // 2. Set authenticated context inside Zustand local session store
      setSession(
        {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at,
        },
        data.session.access_token
      );

      // 3. Navigate successfully to dashboard onboarding workflow
      router.push(ROUTES.ONBOARDING);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative">
      
      {/* Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <Link href={ROUTES.HOME} className="flex items-center gap-2 mb-8 cursor-pointer select-none">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient text-white shadow-glow">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <span className="font-display font-bold text-lg text-text-primary tracking-wide">
          Skill<span className="text-brand-secondary">Verse</span>
        </span>
      </Link>

      <Card hoverable={false} className="w-full max-w-md p-8 border border-white/5 bg-[#070712]/80 backdrop-blur-md">
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-xl text-text-primary">
            Welcome back
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Access your active personalized workspaces.
          </p>
        </div>

        {error && (
          <div className="bg-status-error/10 border border-status-error/30 text-status-error text-xs rounded-md p-3 mb-4 font-medium text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 font-bold"
            isLoading={isLoading}
          >
            Access Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-white/5 text-xs text-text-secondary select-none">
          New to the workspace?{' '}
          <Link href={ROUTES.SIGNUP} className="text-brand-secondary hover:text-brand-primary hover:underline font-semibold cursor-pointer">
            Create an Account
          </Link>
        </div>
      </Card>
      
      <Link href={ROUTES.HOME} className="text-[10px] font-semibold text-text-muted hover:text-text-secondary transition-colors mt-6 flex items-center gap-1">
        <CornerDownLeft className="h-3 w-3" />
        Back to Home
      </Link>
    </div>
  );
}
