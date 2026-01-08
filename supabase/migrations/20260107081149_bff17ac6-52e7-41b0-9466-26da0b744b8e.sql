-- Create raids table
CREATE TABLE public.raids (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    target_hours INTEGER NOT NULL DEFAULT 100,
    current_hours INTEGER NOT NULL DEFAULT 0,
    reward TEXT,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create raid_members table
CREATE TABLE public.raid_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    raid_id UUID NOT NULL REFERENCES public.raids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    xp_contributed INTEGER NOT NULL DEFAULT 0,
    focus_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(raid_id, user_id)
);

-- Enable RLS on raids
ALTER TABLE public.raids ENABLE ROW LEVEL SECURITY;

-- Enable RLS on raid_members
ALTER TABLE public.raid_members ENABLE ROW LEVEL SECURITY;

-- Raids RLS policies: Members can view raids they're part of
CREATE POLICY "Users can view raids they are members of"
ON public.raids
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.raid_members
        WHERE raid_members.raid_id = raids.id
        AND raid_members.user_id = auth.uid()
    )
    OR created_by = auth.uid()
);

-- Users can create raids
CREATE POLICY "Users can create raids"
ON public.raids
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Raid creators can update their raids
CREATE POLICY "Raid creators can update their raids"
ON public.raids
FOR UPDATE
USING (auth.uid() = created_by);

-- Raid creators can delete their raids
CREATE POLICY "Raid creators can delete their raids"
ON public.raids
FOR DELETE
USING (auth.uid() = created_by);

-- Raid members policies
CREATE POLICY "Users can view raid members of raids they belong to"
ON public.raid_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.raids r
        WHERE r.id = raid_members.raid_id
        AND (r.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM public.raid_members rm
            WHERE rm.raid_id = r.id AND rm.user_id = auth.uid()
        ))
    )
);

CREATE POLICY "Users can join raids"
ON public.raid_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
ON public.raid_members
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave raids"
ON public.raid_members
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger for raids
CREATE TRIGGER update_raids_updated_at
BEFORE UPDATE ON public.raids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();