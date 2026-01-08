# Production Deployment Guide

**Project:** FocusForge / Xecute  
**Supabase Project ID:** `ffznkoavgattsktydfaj`  
**Supabase URL:** `https://ffznkoavgattsktydfaj.supabase.co`

---

## ✅ Quick Deployment Checklist

- [ ] Deploy Database Schema (Option A or B below)
- [ ] Create Storage Buckets
- [ ] Deploy Edge Functions
- [ ] Configure Cron Jobs
- [ ] Test Production Environment

---

## 1. Deploy Database Schema

You have **11 migration files** in `supabase/migrations/` that need to be applied to production.

### Option A: SQL Editor (Recommended - Most Reliable)

1. Go to [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/sql/new)

2. Run each migration file in order:

**Migration 1:** `20240116000012_manifestation_features.sql`
```bash
# Copy contents from supabase/migrations/20240116000012_manifestation_features.sql
```

**Migration 2:** `20240116000013_fix_raid_rls_recursion.sql`
```bash
# Copy contents from supabase/migrations/20240116000013_fix_raid_rls_recursion.sql
```

**Continue for all 11 migrations in chronological order...**

3. After each migration:
   - Click "Run" (or Ctrl+Enter)
   - Check for errors in the output
   - If successful, green checkmark appears

### Option B: Supabase CLI (If Docker is Running)

```bash
# Navigate to project folder
cd C:\Users\PC\Documents\Code\FocusForge\forge-your-focus

# Login to Supabase (opens browser)
npx supabase login

# Link to production project
npx supabase link --project-ref ffznkoavgattsktydfaj

# Push all migrations
npx supabase db push

# Verify
npx supabase db pull --schema public
```

### Verify Database Deployment

After deploying, verify tables exist:

1. Go to [Table Editor](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/editor)
2. Check for these tables:
   - ✅ profiles
   - ✅ tasks
   - ✅ goals
   - ✅ focus_sessions
   - ✅ raids
   - ✅ raid_members
   - ✅ achievements
   - ✅ user_achievements
   - ✅ friendships
   - ✅ commitment_contracts
   - ✅ vision_boards
   - ✅ vision_board_items
   - ✅ daily_checkins
   - ✅ leagues
   - ✅ boss_battles

---

## 2. Create Storage Buckets

### Bucket 1: Avatars

1. Go to [Storage](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/storage/buckets)
2. Click **"New bucket"**
3. **Name:** `avatars`
4. **Public bucket:** ✅ Yes (checked)
5. Click **"Create bucket"**

6. Set RLS Policies:
   - Click on `avatars` bucket
   - Go to **"Policies"** tab
   - Click **"New policy"**

**Policy: Allow users to upload their own avatars**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: Allow users to update their own avatars**
```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: Allow users to delete their own avatars**
```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: Allow public read access**
```sql
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Bucket 2: Vision Boards

1. Click **"New bucket"** again
2. **Name:** `vision-boards`
3. **Public bucket:** ✅ Yes
4. Click **"Create bucket"**

5. Set RLS Policies (same as avatars):

**Policy: Allow users to upload vision board images**
```sql
CREATE POLICY "Users can upload vision board images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vision-boards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: Allow users to update their images**
```sql
CREATE POLICY "Users can update vision board images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vision-boards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: Allow users to delete their images**
```sql
CREATE POLICY "Users can delete vision board images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vision-boards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: Allow public read**
```sql
CREATE POLICY "Public vision board access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vision-boards');
```

---

## 3. Deploy Edge Functions

You have 4 Edge Functions to deploy:
- `achievement-processor`
- `streak-checker`
- `task-decay-processor`
- `weekly-league-reset`

### Option A: Supabase CLI

```bash
cd C:\Users\PC\Documents\Code\FocusForge\forge-your-focus

# Deploy all functions
npx supabase functions deploy achievement-processor
npx supabase functions deploy streak-checker
npx supabase functions deploy task-decay-processor
npx supabase functions deploy weekly-league-reset
```

### Option B: Manual Upload via Dashboard

1. Go to [Edge Functions](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/functions)
2. Click **"Create a new function"**
3. For each function:
   - **Name:** (e.g., `achievement-processor`)
   - **Copy code** from `supabase/functions/[function-name]/index.ts`
   - Click **"Deploy"**

### Verify Edge Functions

After deployment, test each function:

1. Go to [Edge Functions](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/functions)
2. Click on function name
3. Click **"Invoke"** to test
4. Check logs for errors

---

## 4. Configure Cron Jobs

Edge Functions need automated scheduling using `pg_cron` extension.

### Enable pg_cron Extension

1. Go to [Database → Extensions](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/database/extensions)
2. Search for `pg_cron`
3. Click **"Enable"**

### Create Cron Schedules

Go to [SQL Editor](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/sql/new) and run:

```sql
-- Schedule 1: Task Decay Processor (Every 6 hours)
SELECT cron.schedule(
  'task-decay-check',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://ffznkoavgattsktydfaj.supabase.co/functions/v1/task-decay-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule 2: Daily Streak Check (Every day at 5am UTC)
SELECT cron.schedule(
  'daily-streak-check',
  '0 5 * * *', -- 5am daily
  $$
  SELECT net.http_post(
    url := 'https://ffznkoavgattsktydfaj.supabase.co/functions/v1/streak-checker',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule 3: Achievement Processor (Every hour)
SELECT cron.schedule(
  'achievement-processor',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://ffznkoavgattsktydfaj.supabase.co/functions/v1/achievement-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule 4: Weekly League Reset (Every Monday at 00:00 UTC)
SELECT cron.schedule(
  'weekly-league-reset',
  '0 0 * * 1', -- Monday midnight
  $$
  SELECT net.http_post(
    url := 'https://ffznkoavgattsktydfaj.supabase.co/functions/v1/weekly-league-reset',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Get Service Role Key

⚠️ **Important:** Replace `YOUR_SERVICE_ROLE_KEY` above

1. Go to [Settings → API](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/settings/api)
2. Copy **service_role** key (not anon key!)
3. **Never commit this to git** - it's secret!

### View Cron Jobs

Check scheduled jobs:
```sql
SELECT * FROM cron.job;
```

### Unschedule a Job (if needed)

```sql
SELECT cron.unschedule('task-decay-check');
```

---

## 5. Test Production Environment

### Test Checklist

#### Authentication
- [ ] Sign up with new email
- [ ] Sign in with existing account
- [ ] Sign out and back in
- [ ] Session persists after refresh

#### Data Persistence
- [ ] Create task → refresh → still there
- [ ] Create goal → refresh → still there
- [ ] Update profile → refresh → changes saved
- [ ] Upload avatar → refresh → image displays

#### Real-Time Sync
- [ ] Open app on two devices/browsers
- [ ] Create task on device 1 → appears on device 2 within 1-2 seconds
- [ ] Update goal on device 1 → updates on device 2
- [ ] Join raid on device 1 → reflects on device 2

#### Image Storage
- [ ] Upload avatar (under 2MB)
- [ ] Avatar displays in profile
- [ ] Upload vision board image
- [ ] Image displays in manifestation screen

#### Edge Functions (Manual Test)
- [ ] Invoke `task-decay-processor` → tasks decay
- [ ] Invoke `streak-checker` → streaks update
- [ ] Invoke `achievement-processor` → achievements unlock
- [ ] Invoke `weekly-league-reset` → leagues reset

---

## 6. Environment Variables

Ensure your `.env` file has production values:

```env
VITE_SUPABASE_URL=https://ffznkoavgattsktydfaj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyBHt1_AxumNpL2k2rKXagtRG-tyokOc8vE
```

✅ These are already correct in your `.env` file!

---

## 7. Monitoring & Logs

### Database Logs
- [Logs → Postgres](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/logs/postgres-logs)

### Edge Function Logs
- [Functions → Select Function → Logs](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/functions)

### API Logs
- [Logs → API](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/logs/api-logs)

### Storage Logs
- [Storage → Logs](https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/storage/logs)

---

## 8. Troubleshooting

### Database Deployment Issues

**Error: "relation already exists"**
- Some tables already exist
- Safe to ignore or use `CREATE TABLE IF NOT EXISTS`

**Error: "permission denied"**
- RLS policies blocking migration
- Temporarily disable RLS:
  ```sql
  ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
  -- Run migration
  ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
  ```

### Storage Bucket Issues

**Error: "Bucket already exists"**
- Bucket created, just add policies

**Images not loading**
- Check bucket is **public**
- Verify RLS policies allow SELECT for public

### Edge Function Issues

**Error: "Function not found"**
- Function not deployed
- Re-deploy: `npx supabase functions deploy [name]`

**Error: "Authorization header missing"**
- Cron job missing service role key
- Update cron schedule with correct key

### Cron Job Issues

**Jobs not running**
- Check `SELECT * FROM cron.job;`
- Check `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- Verify pg_cron extension enabled

---

## 9. Post-Deployment

### Update Documentation
- [ ] Update README with production URL
- [ ] Document any manual steps taken
- [ ] Note any migration issues

### Security Review
- [ ] Service role key not exposed
- [ ] RLS policies tested
- [ ] CORS configured correctly
- [ ] API keys rotated if committed to git

### Performance
- [ ] Database indexes created
- [ ] Query performance acceptable
- [ ] Edge function cold start time < 5s

---

## Quick Reference

| Resource | URL |
|----------|-----|
| Dashboard | https://supabase.com/dashboard/project/ffznkoavgattsktydfaj |
| Table Editor | https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/editor |
| SQL Editor | https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/sql/new |
| Storage | https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/storage/buckets |
| Edge Functions | https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/functions |
| API Settings | https://supabase.com/dashboard/project/ffznkoavgattsktydfaj/settings/api |

---

## Success! 🎉

Once all steps complete, your app is **fully deployed** and production-ready!

Test URL: `https://yourdomain.com` (or localhost with production Supabase)
