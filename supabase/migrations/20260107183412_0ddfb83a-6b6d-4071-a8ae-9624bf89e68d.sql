-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_league_tier INTEGER,
ADD COLUMN IF NOT EXISTS debt_score INTEGER DEFAULT 0;

-- Add color column to leagues table
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friendships
CREATE POLICY "Users can view their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    challenger_id UUID NOT NULL,
    challenged_id UUID NOT NULL,
    challenge_type TEXT NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 0,
    current_value_challenger INTEGER NOT NULL DEFAULT 0,
    current_value_challenged INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for challenges
CREATE POLICY "Users can view their own challenges" 
ON public.challenges 
FOR SELECT 
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their own challenges" 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Add missing columns to user_league_history
ALTER TABLE public.user_league_history 
ADD COLUMN IF NOT EXISTS xp_at_entry INTEGER;

-- Create get_weekly_leaderboard function
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(week_start TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    weekly_xp BIGINT,
    rank BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.display_name,
        p.avatar_url,
        COALESCE(SUM(fs.xp_earned), 0)::BIGINT as weekly_xp,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(fs.xp_earned), 0) DESC)::BIGINT as rank
    FROM profiles p
    LEFT JOIN focus_sessions fs ON fs.user_id = p.user_id 
        AND fs.created_at >= week_start
    GROUP BY p.user_id, p.display_name, p.avatar_url
    ORDER BY weekly_xp DESC
    LIMIT 100;
END;
$$;