# FocusForge Backend Setup Guide (Supabase + Lovable Cloud)

## 🎯 Overview
This guide covers complete backend setup for FocusForge using Supabase (Lovable's default backend).

---

## 📋 Prerequisites

1. **Supabase Account** - https://supabase.com (Free tier available)
2. **Node.js 18+** installed
3. **FocusForge repo** cloned and npm installed

---

## 🚀 Part 1: Supabase Project Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project details:
   - Name: `focusforge`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait 2-3 minutes for project creation

### Step 2: Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (NEVER expose to frontend!)
   ```

3. Add to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

---

## 🗄️ Part 2: Database Schema

### Step 1: Open SQL Editor

1. Go to **SQL Editor** in Supabase dashboard
2. Create a new query

### Step 2: Create Tables

```sql
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users Profile Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  energy_profile TEXT CHECK (energy_profile IN ('morning_lark', 'night_owl', 'balanced')) DEFAULT 'balanced',
  league TEXT CHECK (league IN ('bronze', 'silver', 'gold', 'diamond')) DEFAULT 'bronze',
  league_rank INTEGER DEFAULT 999,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  debt_score INTEGER DEFAULT 0,
  manifestation_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('year', 'month', 'week')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  is_active BOOLEAN DEFAULT true,
  parent_goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  required_weekly_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('study', 'deepwork', 'physical', 'manifestation', 'break')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'rotten', 'violated')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  decay_level INTEGER DEFAULT 0 CHECK (decay_level >= 0 AND decay_level <= 3),
  suggested_start TIME NOT NULL,
  suggested_end TIME NOT NULL,
  scheduled_date DATE NOT NULL,
  verification_required BOOLEAN DEFAULT false,
  goal_alignment_score DECIMAL(3,2) DEFAULT 0.5 CHECK (goal_alignment_score >= 0 AND goal_alignment_score <= 1),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Focus Sessions Table (for tracking actual work)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  verification_score DECIMAL(3,2) DEFAULT 1.0,
  violations INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raids Table
CREATE TABLE IF NOT EXISTS public.raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_hours INTEGER NOT NULL,
  current_hours INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reward_xp INTEGER NOT NULL,
  reward_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raid Members Table
CREATE TABLE IF NOT EXISTS public.raid_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id UUID REFERENCES public.raids(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  contribution_hours DECIMAL(5,2) DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raid_id, user_id)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_awarded INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vision Board Images Table
CREATE TABLE IF NOT EXISTS public.vision_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Challenges Table (friend challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  challenged_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  target INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'expired')) DEFAULT 'pending',
  winner_id UUID REFERENCES public.user_profiles(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_date ON public.tasks(user_id, scheduled_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_goals_user_active ON public.goals(user_id, is_active);
CREATE INDEX idx_focus_sessions_user ON public.focus_sessions(user_id);
CREATE INDEX idx_raid_members_raid ON public.raid_members(raid_id);
CREATE INDEX idx_friendships_user ON public.friendships(user_id);
```

### Step 3: Create Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp / 100)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = calculate_level(NEW.total_xp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_on_xp_change BEFORE UPDATE OF total_xp ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Function to calculate debt score
CREATE OR REPLACE FUNCTION calculate_debt_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    rotten_count INTEGER;
    overdue_count INTEGER;
    total_tasks INTEGER;
BEGIN
    SELECT COUNT(*) INTO rotten_count
    FROM public.tasks
    WHERE user_id = user_uuid AND status = 'rotten';
    
    SELECT COUNT(*) INTO overdue_count
    FROM public.tasks
    WHERE user_id = user_uuid 
      AND status = 'pending' 
      AND scheduled_date < CURRENT_DATE;
    
    SELECT COUNT(*) INTO total_tasks
    FROM public.tasks
    WHERE user_id = user_uuid 
      AND status IN ('pending', 'active', 'rotten');
    
    IF total_tasks = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN LEAST(100, ((rotten_count * 30 + overdue_count * 15) * 100 / GREATEST(total_tasks, 1)));
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 Part 3: Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raid_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles (leaderboard)" ON public.user_profiles
    FOR SELECT USING (true);

-- Goals Policies
CREATE POLICY "Users can view their own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can view their own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Focus Sessions Policies
CREATE POLICY "Users can view their own sessions" ON public.focus_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.focus_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Raids Policies (public read, admin write)
CREATE POLICY "Anyone can view raids" ON public.raids
    FOR SELECT USING (true);

-- Raid Members Policies
CREATE POLICY "Anyone can view raid members" ON public.raid_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join raids" ON public.raid_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their raid participation" ON public.raid_members
    FOR UPDATE USING (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Vision Board Policies
CREATE POLICY "Users can manage their vision board" ON public.vision_board_items
    FOR ALL USING (auth.uid() = user_id);

-- Friendships Policies
CREATE POLICY "Users can view their friendships" ON public.friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" ON public.friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Challenges Policies
CREATE POLICY "Users can view their challenges" ON public.challenges
    FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" ON public.challenges
    FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges" ON public.challenges
    FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);
```

---

## 🔐 Part 4: Authentication Setup

### Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - Confirm email: ON (recommended)
   - Secure password change: ON
   
### Optional: Enable OAuth

1. Enable providers (Google, GitHub, etc.)
2. Add OAuth credentials
3. Configure redirect URLs

---

## 📦 Part 5: Storage Setup (for images)

### Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create buckets:

```sql
-- Create buckets via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('vision-boards', 'vision-boards', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vision board images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vision-boards');

CREATE POLICY "Users can upload vision board images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vision-boards' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🔌 Part 6: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (auto-generated is better)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          // ... add all fields
        };
      };
      // ... add all tables
    };
  };
};
```

---

## 🚀 Part 7: Edge Functions (Optional)

### Set up Supabase CLI

```bash
npm install -g supabase
supabase login
supabase init
```

### Create Edge Function for Task Decay

```bash
supabase functions new task-decay-cron
```

Edit `supabase/functions/task-decay-cron/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Increase decay for pending tasks older than 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('tasks')
    .update({ decay_level: supabase.rpc('increment', 1) })
    .eq('status', 'pending')
    .lt('updated_at', sixHoursAgo.toISOString())
    .lt('decay_level', 3);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ updated: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Deploy:

```bash
supabase functions deploy task-decay-cron
```

### Set up Cron Job

1. Go to **Database** → **Cron Jobs** (pg_cron extension)
2. Enable extension
3. Create job:

```sql
SELECT cron.schedule(
  'task-decay-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='YOUR_EDGE_FUNCTION_URL',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## ✅ Part 8: Testing

### Test Authentication

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123',
});

// Sign out
await supabase.auth.signOut();
```

### Test Database Operations

```typescript
// Create task
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'Test Task',
    type: 'study',
    duration_min: 60,
    suggested_start: '09:00',
    suggested_end: '10:00',
    scheduled_date: '2026-01-07',
  });

// Query tasks
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .eq('scheduled_date', '2026-01-07');
```

---

## 📱 Part 9: Real-time Subscriptions

```typescript
// Subscribe to task changes
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Task changed:', payload);
  })
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

---

## 🎯 Next Steps

1. Generate TypeScript types: `supabase gen types typescript --project-id YOUR_PROJECT_ID`
2. Set up GitHub Actions for CI/CD
3. Configure backup strategy
4. Set up monitoring and alerts
5. Implement rate limiting
6. Add API middleware for validation

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

