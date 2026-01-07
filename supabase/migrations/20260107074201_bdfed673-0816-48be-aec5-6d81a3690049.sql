-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    wake_time TIME DEFAULT '07:00',
    sleep_time TIME DEFAULT '23:00',
    total_xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create goals table
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('year', 'month', 'week')),
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    success_criteria JSONB DEFAULT '[]',
    progress INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    color TEXT DEFAULT '#8B5CF6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_photo_url TEXT,
    xp_reward INTEGER DEFAULT 10,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create focus_sessions table
CREATE TABLE public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    planned_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER,
    break_count INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    was_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create vision_boards table
CREATE TABLE public.vision_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vision_boards ENABLE ROW LEVEL SECURITY;

-- Create vision_board_items table
CREATE TABLE public.vision_board_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vision_board_id UUID REFERENCES public.vision_boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 200,
    height INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;

-- Create affirmations table
CREATE TABLE public.affirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    schedule_times JSONB DEFAULT '["09:00", "14:00", "21:00"]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;

-- Create manifestation_sessions table
CREATE TABLE public.manifestation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('visualization', 'affirmation', 'journaling')),
    duration_minutes INTEGER,
    journal_text TEXT,
    xp_awarded INTEGER DEFAULT 5,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manifestation_sessions ENABLE ROW LEVEL SECURITY;

-- Create leagues table
CREATE TABLE public.leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 5),
    min_xp INTEGER NOT NULL,
    max_xp INTEGER,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- Create user_league_history table
CREATE TABLE public.user_league_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    weekly_xp INTEGER DEFAULT 0,
    rank_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_league_history ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vision_boards_updated_at
    BEFORE UPDATE ON public.vision_boards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- goals policies
CREATE POLICY "Users can view their own goals"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);

-- tasks policies
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- focus_sessions policies
CREATE POLICY "Users can view their own focus sessions"
    ON public.focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own focus sessions"
    ON public.focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
    ON public.focus_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- vision_boards policies
CREATE POLICY "Users can view their own vision boards"
    ON public.vision_boards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision boards"
    ON public.vision_boards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision boards"
    ON public.vision_boards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision boards"
    ON public.vision_boards FOR DELETE
    USING (auth.uid() = user_id);

-- vision_board_items policies
CREATE POLICY "Users can view their own vision board items"
    ON public.vision_board_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision board items"
    ON public.vision_board_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision board items"
    ON public.vision_board_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision board items"
    ON public.vision_board_items FOR DELETE
    USING (auth.uid() = user_id);

-- affirmations policies
CREATE POLICY "Users can view their own affirmations"
    ON public.affirmations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affirmations"
    ON public.affirmations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affirmations"
    ON public.affirmations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affirmations"
    ON public.affirmations FOR DELETE
    USING (auth.uid() = user_id);

-- manifestation_sessions policies
CREATE POLICY "Users can view their own manifestation sessions"
    ON public.manifestation_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own manifestation sessions"
    ON public.manifestation_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- leagues policies (public read for leaderboards)
CREATE POLICY "Anyone can view leagues"
    ON public.leagues FOR SELECT
    USING (true);

-- user_league_history policies
CREATE POLICY "Users can view their own league history"
    ON public.user_league_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own league history"
    ON public.user_league_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own league history"
    ON public.user_league_history FOR UPDATE
    USING (auth.uid() = user_id);