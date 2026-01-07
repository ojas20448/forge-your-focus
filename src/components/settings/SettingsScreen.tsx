import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Moon, Sun, Zap, Clock, ChevronRight, LogOut, HelpCircle, FileText, Palette, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EnergyProfile } from '@/types/focusforge';
import { useNotifications } from '@/utils/notificationManager';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState(false);
  const [strictMode, setStrictMode] = useState(true);
  const [energyProfile, setEnergyProfile] = useState<EnergyProfile>('morning_lark');
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const { isSupported, checkPermission, requestPermission, sendTest } = useNotifications();

  // Check notification permission on mount
  useEffect(() => {
    const checkPerm = async () => {
      const granted = await checkPermission();
      setNotifications(granted);
    };
    if (isSupported) {
      checkPerm();
    }
  }, [checkPermission, isSupported]);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      setNotifications(granted);
      if (granted) {
        // Send test notification
        setTimeout(() => sendTest(), 500);
      }
    } else {
      setNotifications(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
            <h2 className="font-bold text-foreground text-lg">{profile?.display_name || user?.email?.split('@')[0] || 'Focus Warrior'}</h2>
            <p className="text-sm text-muted-foreground">Level {profile?.level || 1} • {profile?.current_streak || 0} day streak</p>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="w-3 h-3 text-xp-glow" />
              <span className="text-xs text-xp-glow font-mono-time">{profile?.total_xp?.toLocaleString() || 0} XP</span>
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
            icon={
              energyProfile === 'morning_lark' ? <Sun className="w-5 h-5 text-warning" /> :
              energyProfile === 'night_owl' ? <Moon className="w-5 h-5 text-primary" /> :
              <Coffee className="w-5 h-5 text-muted-foreground" />
            }
            label={
              energyProfile === 'morning_lark' ? "Morning Lark" :
              energyProfile === 'night_owl' ? "Night Owl" : "Balanced"
            }
            description={
              energyProfile === 'morning_lark' ? "Peak focus: 6 AM - 12 PM" :
              energyProfile === 'night_owl' ? "Peak focus: 6 PM - 12 AM" :
              "Steady throughout day"
            }
            onClick={() => setShowEnergyModal(true)}
          />
        </div>
      </section>

      {/* Energy Profile Selection Modal */}
      {showEnergyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEnergyModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-foreground mb-2">Select Energy Profile</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose when you're most productive. We'll optimize your schedule accordingly.
            </p>
            <div className="space-y-3">
              {[
                { id: 'morning_lark' as EnergyProfile, icon: Sun, label: 'Morning Lark', desc: 'Peak: 6 AM - 12 PM', color: 'text-warning' },
                { id: 'balanced' as EnergyProfile, icon: Coffee, label: 'Balanced', desc: 'Steady all day', color: 'text-muted-foreground' },
                { id: 'night_owl' as EnergyProfile, icon: Moon, label: 'Night Owl', desc: 'Peak: 6 PM - 12 AM', color: 'text-primary' },
              ].map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    setEnergyProfile(profile.id);
                    setShowEnergyModal(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                    energyProfile === profile.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    energyProfile === profile.id ? "bg-primary/20" : "bg-secondary"
                  )}>
                    <profile.icon className={cn("w-6 h-6", profile.color)} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{profile.label}</p>
                    <p className="text-xs text-muted-foreground">{profile.desc}</p>
                  </div>
                  {energyProfile === profile.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-primary-foreground rotate-180" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setShowEnergyModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

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
            onToggle={handleNotificationToggle}
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
            icon={darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-warning" />}
            label="Dark Mode"
            description={darkMode ? "Dark theme active" : "Light theme active"}
            toggle
            value={darkMode}
            onToggle={setDarkMode}
          />
        </div>
      </section>

      {/* Theme Colors */}
      <section className="px-4 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
          Accent Color
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-3">
            {[
              { color: 'hsl(217, 91%, 60%)', name: 'Blue' },
              { color: 'hsl(0, 84%, 60%)', name: 'Red' },
              { color: 'hsl(142, 71%, 45%)', name: 'Green' },
              { color: 'hsl(280, 87%, 65%)', name: 'Purple' },
              { color: 'hsl(38, 92%, 50%)', name: 'Orange' },
            ].map((theme) => (
              <button
                key={theme.name}
                className="w-10 h-10 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
                style={{ backgroundColor: theme.color }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="px-4 py-4">
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
      <section className="px-4 py-2">
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
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={async () => {
            await signOut();
            navigate('/auth');
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
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
