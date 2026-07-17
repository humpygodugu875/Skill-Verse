'use client';

import React, { useState } from 'react';
import { User, Bell, Shield, Save } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import Input from '../../../components/ui/input';

export default function SettingsPage() {
  const [email, setEmail] = useState('arjun.developer@example.com');
  const [profileName, setProfileName] = useState('Arjun Developer');
  const [hoursBudget, setHoursBudget] = useState('15');
  const [isSaved, setIsSaved] = useState(false);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left animate-fade-slide-up">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
          Workspace Settings
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Adjust parameters governing your active AI agent pipeline behaviors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Navigation list */}
        <div className="flex flex-col gap-2 select-none h-auto">
          {[
            { icon: User, text: 'Account Profile', active: true },
            { icon: Bell, text: 'System Alerts' },
            { icon: Shield, text: 'Privacy & Security' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide border text-left transition-all cursor-pointer ${
                  item.active
                    ? 'bg-brand-primary/10 border-brand-primary/20 text-text-primary font-bold shadow-sm'
                    : 'bg-white/2 border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/4'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.text}
              </button>
            );
          })}
        </div>

        {/* Input Details Forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card hoverable={false} className="border-card-border p-6 text-left">
            <CardHeader className="border-b border-white/5 pb-4 mb-6">
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <Input
                  id="profileName"
                  type="text"
                  label="Display Full Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
                <Input
                  id="email"
                  type="email"
                  label="Primary Email Address"
                  value={email}
                  disabled
                />
                <Input
                  id="hours"
                  type="number"
                  label="Target Weekly Hours Budget"
                  value={hoursBudget}
                  onChange={(e) => setHoursBudget(e.target.value)}
                />

                <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                  <Button type="submit" variant="primary" className="font-semibold text-xs py-2 h-9 px-4 cursor-pointer">
                    <Save className="h-4 w-4" />
                    {isSaved ? 'Details Saved!' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
