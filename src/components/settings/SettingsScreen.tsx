import React, { useState } from 'react';
import { User, Bell, Shield, Moon, Zap, Clock, ChevronRight, LogOut, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  toggle?: boolean;
  value?: boolean;
  onToggle?: (value: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  label,
  description,
  onClick,
  toggle,
  value,
  onToggle,
}) => (
  <button
    onClick={toggle ? () => onToggle?.(!value) : onClick}
    className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
  >
    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    {toggle ? (
      <div className={cn(
        "w-12 h-7 rounded-full p-1 transition-colors",
        value ? "bg-primary" : "bg-secondary"
      )}>
        <div className={cn(
          "w-5 h-5 rounded-full bg-white transition-transform",
          value && "translate-x-5"
        )} />
      </div>
    ) : (
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    )}
  </button>
);

export const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [strictMode, setStrictMode] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Profile section */}
      <section className="px-4 py-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl">
            🎯
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-lg">Focus Warrior</h2>
            <p className="text-sm text-muted-foreground">Level 14 • Gold League</p>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="w-3 h-3 text-xp-glow" />
              <span className="text-xs text-xp-glow font-mono-time">12,450 XP</span>
            </div>
          </div>
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      </section>

      {/* Energy profile */}
      <section className="px-4 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
          Energy Profile
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<Clock className="w-5 h-5 text-primary" />}
            label="Morning Lark"
            description="Peak focus: 6 AM - 12 PM"
            onClick={() => {}}
          />
        </div>
      </section>

      {/* Preferences */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
          Preferences
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<Bell className="w-5 h-5 text-muted-foreground" />}
            label="Notifications"
            description="Focus reminders & updates"
            toggle
            value={notifications}
            onToggle={setNotifications}
          />
          <SettingItem
            icon={<Shield className="w-5 h-5 text-accent" />}
            label="Strict Mode"
            description="Aggressive violation penalties"
            toggle
            value={strictMode}
            onToggle={setStrictMode}
          />
          <SettingItem
            icon={<Moon className="w-5 h-5 text-muted-foreground" />}
            label="Dark Mode"
            description="Always on for focus"
            toggle
            value={darkMode}
            onToggle={setDarkMode}
          />
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="px-4 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
          Privacy & Security
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<Shield className="w-5 h-5 text-muted-foreground" />}
            label="Camera Permissions"
            description="Required for verification"
            onClick={() => {}}
          />
          <SettingItem
            icon={<FileText className="w-5 h-5 text-muted-foreground" />}
            label="Data Export"
            description="Download your data"
            onClick={() => {}}
          />
        </div>
      </section>

      {/* Support */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
          Support
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<HelpCircle className="w-5 h-5 text-muted-foreground" />}
            label="Help & FAQ"
            onClick={() => {}}
          />
        </div>
      </section>

      {/* Logout */}
      <section className="px-4 py-4">
        <Button variant="danger" className="w-full">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </section>

      {/* Version */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">FocusForge v1.0.0</p>
      </div>
    </div>
  );
};
