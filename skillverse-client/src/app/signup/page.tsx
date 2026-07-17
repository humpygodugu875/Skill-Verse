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

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all parameter fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Submit signup request to Supabase Authentication engine
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('Registration succeeded, but no user description parameters were returned.');
      }

      // 2. If email confirmation is enabled, wait for confirmation and show instructions
      if (!data.session) {
        setIsSuccess(true);
        return;
      }

      // 3. Set authenticated context inside Zustand local session store
      setSession(
        {
          id: data.user.id,
          email: data.user.email || email,
          created_at: data.user.created_at,
        },
        data.session.access_token
      );

      // 4. Navigate successfully to dashboard onboarding workflow
      router.push(ROUTES.ONBOARDING);
    } catch (err: any) {
      // 5. Translate raw Supabase backend errors into readable client warning messages
      let friendlyMessage = err.message || 'Registration failed. Please try again.';
      
      const errorStr = (err.message || '').toLowerCase();
      if (errorStr.includes('user already registered') || err.status === 422) {
        friendlyMessage = 'An account with this email address already exists.';
      } else if (errorStr.includes('weak password') || errorStr.includes('password should be')) {
        friendlyMessage = 'Weak password. The password must be at least 6 characters.';
      } else if (err.toString().toLowerCase().includes('fetch') || errorStr.includes('network')) {
        friendlyMessage = 'A network error occurred. Please check your connection status.';
      }
      
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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

        <Card hoverable={false} className="w-full max-w-md p-8 border border-white/5 bg-[#070712]/80 backdrop-blur-md text-center">
          <div className="h-12 w-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-4 text-brand-secondary shadow-glow animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">
            Confirm your Email
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto mb-6">
            We have sent a verification link to <span className="text-text-primary font-semibold">{email}</span>. Click the link inside the email to verify and activate your account.
          </p>
          <div className="pt-6 border-t border-white/5">
            <Button
              variant="primary"
              onClick={() => router.push(ROUTES.LOGIN)}
              className="w-full font-bold"
            >
              Return to Log In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
            Create your account
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Build your private learning team workspace.
          </p>
        </div>

        {error && (
          <div className="bg-status-error/10 border border-status-error/30 text-status-error text-xs rounded-md p-3 mb-4 font-medium text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
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
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 font-bold"
            isLoading={isLoading}
          >
            Create Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-white/5 text-xs text-text-secondary select-none">
          Already registered?{' '}
          <Link href={ROUTES.LOGIN} className="text-brand-secondary hover:text-brand-primary hover:underline font-semibold cursor-pointer">
            Log In
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
