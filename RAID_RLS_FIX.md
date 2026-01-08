# Raid RLS Infinite Recursion Fix

## Problem
The raids query is failing with error:
```
infinite recursion detected in policy for relation "raid_members"
```

This happens because:
1. The `raids` SELECT policy checks if user exists in `raid_members`
2. The `raid_members` SELECT policy checks if user exists in `raids`
3. This creates an infinite loop when Postgres tries to evaluate the policies

## Solution
Replace the recursive policies with non-recursive ones using `IN` clauses instead of `EXISTS` subqueries.

## How to Apply

Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Fix infinite recursion in raid RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view raids they are members of" ON public.raids;
DROP POLICY IF EXISTS "Users can view raid members of raids they belong to" ON public.raid_members;

-- Create non-recursive policy for raids
-- Users can view raids if they created them OR are members (without recursion)
CREATE POLICY "Users can view raids they are members of"
ON public.raids
FOR SELECT
USING (
    created_by = auth.uid()
    OR id IN (
        SELECT raid_id FROM public.raid_members
        WHERE user_id = auth.uid()
    )
);

-- Create non-recursive policy for raid_members
-- Users can view raid members if they created the raid OR are members themselves
CREATE POLICY "Users can view raid members of raids they belong to"
ON public.raid_members
FOR SELECT
USING (
    user_id = auth.uid()
    OR raid_id IN (
        SELECT id FROM public.raids
        WHERE created_by = auth.uid()
    )
    OR raid_id IN (
        SELECT raid_id FROM public.raid_members rm
        WHERE rm.user_id = auth.uid()
    )
);
```

## What Changed

**Before (Recursive):**
```sql
-- raids policy
USING (
    EXISTS (
        SELECT 1 FROM public.raid_members
        WHERE raid_members.raid_id = raids.id
        AND raid_members.user_id = auth.uid()
    )
)

-- raid_members policy
USING (
    EXISTS (
        SELECT 1 FROM public.raids r
        WHERE r.id = raid_members.raid_id
        AND EXISTS (
            SELECT 1 FROM public.raid_members rm  -- <-- RECURSION!
            WHERE rm.raid_id = r.id AND rm.user_id = auth.uid()
        )
    )
)
```

**After (Non-Recursive):**
```sql
-- raids policy
USING (
    created_by = auth.uid()
    OR id IN (
        SELECT raid_id FROM public.raid_members  -- Direct query, no recursion
        WHERE user_id = auth.uid()
    )
)

-- raid_members policy  
USING (
    user_id = auth.uid()
    OR raid_id IN (
        SELECT id FROM public.raids  -- Direct query
        WHERE created_by = auth.uid()
    )
    OR raid_id IN (
        SELECT raid_id FROM public.raid_members rm  -- Same table, but no policy cascade
        WHERE rm.user_id = auth.uid()
    )
)
```

## After Applying
1. Refresh your browser (the dev server is already running)
2. The raids query should now work without errors
3. All raid functionality will be operational

## Files Modified
- Created: `supabase/migrations/20240116000013_fix_raid_rls_recursion.sql`
