-- Anti-Cheat Challenges table
CREATE TABLE public.anti_cheat_challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    focus_session_id UUID REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL, -- 'math', 'pattern', 'typing', 'memory'
    challenge_data JSONB NOT NULL, -- stores question/answer data
    was_passed BOOLEAN DEFAULT false,
    response_time_ms INTEGER, -- how fast user responded
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    answered_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.anti_cheat_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
    ON public.anti_cheat_challenges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges"
    ON public.anti_cheat_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
    ON public.anti_cheat_challenges FOR UPDATE
    USING (auth.uid() = user_id);

-- Commitment Contracts table
CREATE TABLE public.commitment_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    staked_xp INTEGER NOT NULL DEFAULT 0,
    buddy_email TEXT, -- accountability buddy
    buddy_user_id UUID, -- if buddy is a user
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed', 'cancelled'
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    penalty_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_target CHECK (task_id IS NOT NULL OR goal_id IS NOT NULL)
);

ALTER TABLE public.commitment_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
    ON public.commitment_contracts FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = buddy_user_id);

CREATE POLICY "Users can create their own contracts"
    ON public.commitment_contracts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
    ON public.commitment_contracts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
    ON public.commitment_contracts FOR DELETE
    USING (auth.uid() = user_id);

-- Add decay_level to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS decay_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS decay_started_at TIMESTAMP WITH TIME ZONE;

-- Task decay history for audit
CREATE TABLE public.task_decay_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    previous_decay_level INTEGER NOT NULL,
    new_decay_level INTEGER NOT NULL,
    xp_penalty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_decay_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decay events"
    ON public.task_decay_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decay events"
    ON public.task_decay_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to calculate and apply task decay
CREATE OR REPLACE FUNCTION public.apply_task_decay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hours_overdue NUMERIC;
    new_decay INTEGER;
    xp_penalty INTEGER;
BEGIN
    -- Only process incomplete tasks that are past their scheduled time
    IF NEW.is_completed = false AND NEW.scheduled_date < CURRENT_DATE THEN
        -- Calculate hours overdue
        hours_overdue := EXTRACT(EPOCH FROM (now() - (NEW.scheduled_date + NEW.end_time::interval))) / 3600;
        
        -- Calculate decay level (0-3 based on hours overdue)
        IF hours_overdue >= 72 THEN
            new_decay := 3; -- Fully rotten
        ELSIF hours_overdue >= 48 THEN
            new_decay := 2;
        ELSIF hours_overdue >= 24 THEN
            new_decay := 1;
        ELSE
            new_decay := 0;
        END IF;
        
        -- Only update if decay level changed
        IF new_decay > COALESCE(OLD.decay_level, 0) THEN
            NEW.decay_level := new_decay;
            
            -- Set decay start time if first decay
            IF NEW.decay_started_at IS NULL THEN
                NEW.decay_started_at := now();
            END IF;
            
            -- Calculate XP penalty (10 XP per decay level)
            xp_penalty := (new_decay - COALESCE(OLD.decay_level, 0)) * 10;
            
            -- Record decay event
            INSERT INTO task_decay_events (task_id, user_id, previous_decay_level, new_decay_level, xp_penalty)
            VALUES (NEW.id, NEW.user_id, COALESCE(OLD.decay_level, 0), new_decay, xp_penalty);
            
            -- Apply XP penalty to profile
            UPDATE profiles 
            SET total_xp = GREATEST(0, total_xp - xp_penalty)
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for task decay
DROP TRIGGER IF EXISTS check_task_decay ON public.tasks;
CREATE TRIGGER check_task_decay
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.apply_task_decay();