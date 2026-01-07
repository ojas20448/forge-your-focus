# Edge Functions Deployment Guide

This guide explains how to deploy and configure the Supabase Edge Functions for FocusForge automation.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project created
- Supabase credentials configured

## Edge Functions Overview

### 1. Task Decay Processor (`task-decay-processor`)
**Purpose:** Automatically calculates decay levels for overdue tasks
**Schedule:** Run daily (or every 6 hours)
**What it does:**
- Finds all incomplete tasks past their scheduled date
- Assigns decay levels (1=slightly overdue, 2=very overdue, 3=rotten)
- Updates user debt scores based on task decay

### 2. Streak Checker (`streak-checker`)
**Purpose:** Maintains user activity streaks
**Schedule:** Run daily at midnight
**What it does:**
- Checks if users were active yesterday (completed tasks or focus sessions)
- Updates or breaks streaks accordingly
- Updates longest streak records

### 3. Weekly League Reset (`weekly-league-reset`)
**Purpose:** Resets weekly competition data and adjusts league tiers
**Schedule:** Run weekly (e.g., every Monday at 00:00)
**What it does:**
- Resets weekly XP counters
- Adjusts user league tiers based on total XP
- Records league history
- Tracks promotions/demotions

### 4. Achievement Processor (`achievement-processor`)
**Purpose:** Checks and unlocks achievements for all users
**Schedule:** Run daily or hourly
**What it does:**
- Evaluates achievement requirements for all users
- Unlocks achievements when requirements met
- Awards XP for unlocked achievements
- Updates user levels

## Deployment Steps

### Step 1: Link to Your Supabase Project

```bash
cd forge-your-focus
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Deploy All Edge Functions

```bash
# Deploy task decay processor
supabase functions deploy task-decay-processor

# Deploy streak checker
supabase functions deploy streak-checker

# Deploy league reset
supabase functions deploy weekly-league-reset

# Deploy achievement processor
supabase functions deploy achievement-processor
```

### Step 3: Set Environment Variables

Edge functions need access to your Supabase credentials:

```bash
supabase secrets set SUPABASE_URL=your-project-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Apply Database Migrations

Make sure the leaderboard functions are deployed:

```bash
supabase db push
```

Or manually run the SQL migration:
```bash
psql -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f supabase/migrations/20260108000000_leaderboard_functions.sql
```

## Scheduling with Supabase Cron (pg_cron)

### Enable pg_cron Extension

In Supabase Dashboard → Database → Extensions:
- Enable `pg_cron`

### Create Cron Jobs

Run these SQL commands in Supabase SQL Editor:

```sql
-- Task decay processor (every 6 hours)
SELECT cron.schedule(
  'task-decay-processor',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/task-decay-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- Streak checker (daily at midnight)
SELECT cron.schedule(
  'streak-checker',
  '0 0 * * *',  -- Every day at 00:00
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/streak-checker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- Weekly league reset (Mondays at 00:00)
SELECT cron.schedule(
  'weekly-league-reset',
  '0 0 * * 1',  -- Every Monday at 00:00
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-league-reset',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- Achievement processor (hourly)
SELECT cron.schedule(
  'achievement-processor',
  '0 * * * *',  -- Every hour
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/achievement-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);
```

### View Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### Remove a Job (if needed)

```sql
SELECT cron.unschedule('job-name');
```

## Manual Testing

You can manually trigger functions for testing:

```bash
# Test task decay processor
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/task-decay-processor' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Test streak checker
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/streak-checker' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## Monitoring

Monitor function execution in:
- Supabase Dashboard → Edge Functions → Logs
- Check for errors and execution times

## Cost Considerations

Edge Functions pricing (as of 2024):
- **Free tier:** 500,000 invocations/month
- **Pro tier:** 2 million invocations/month

With the suggested schedules:
- Task decay: 4 calls/day = 120/month
- Streak checker: 1 call/day = 30/month
- League reset: 4 calls/month
- Achievement processor: 24 calls/day = 720/month

**Total:** ~874 invocations/month (well within free tier)

## Troubleshooting

### Function not executing
1. Check Edge Function logs in Supabase Dashboard
2. Verify environment variables are set
3. Ensure cron job is scheduled correctly

### Permission errors
- Make sure you're using the SERVICE_ROLE_KEY for Edge Functions
- Check Row Level Security policies

### Missing data
- Verify database migrations are applied
- Check that users have profiles created

## Next Steps

After deployment:
1. Test each function manually
2. Monitor logs for 24 hours
3. Verify cron jobs are running
4. Check user streaks and decay levels are updating

For more information, see the [Supabase Edge Functions documentation](https://supabase.com/docs/guides/functions).
