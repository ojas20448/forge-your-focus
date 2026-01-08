# Database Migration Deployment Guide

## Overview
This guide explains how to verify the social features migration is deployed to your Supabase database.

**Note**: This project uses **Lovable Cloud**, which automatically deploys Supabase migrations.

## Migration File
**Location**: `supabase/migrations/20260107183412_0ddfb83a-6b6d-4071-a8ae-9624bf89e68d.sql`

**Contains**:
- Friendships table (user_id, friend_id, status)
- Challenges table
- Leaderboards functionality
- Profile enhancements (weekly_xp, league_tier, debt_score)
- Row Level Security policies

## Lovable Cloud Deployment (Automatic)

Since you're using Lovable Cloud, migrations are **automatically deployed** when:
1. You push code to your repository
2. Lovable detects changes in `supabase/migrations/` folder
3. Migrations are applied in chronological order

**No manual deployment needed!** ✅

### Check Deployment Status

1. **Open Lovable Dashboard**:
   - Go to your Lovable project dashboard
   - Check deployment logs for migration status

2. **Verify in Supabase Dashboard**:
   - Open your Supabase project (linked to Lovable)
   - Go to Table Editor
   - Check if tables exist: `friendships`, `challenges`

## Deployment Options (Manual - If Needed)

### Option 1: Supabase CLI (Recommended)

1. **Install Supabase CLI**:
   ```powershell
   # Windows (PowerShell)
   scoop install supabase
   # OR
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   cd c:\Users\PC\Documents\Code\FocusForge\forge-your-focus
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Push migration**:
   ```bash
   supabase db push
   ```

### Option 2: Supabase Dashboard (Manual)

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your FocusForge project
   - Navigate to SQL Editor

2. **Copy migration content**:
   - Open `supabase/migrations/20260107183412_0ddfb83a-6b6d-4071-a8ae-9624bf89e68d.sql`
   - Copy all contents (112 lines)

3. **Execute SQL**:
   - Paste into SQL Editor
   - Click "Run"
   - Verify no errors

4. **Verify tables created**:
   - Go to Table Editor
   - Check for: `friendships`, `challenges`, `leaderboard_entries`
   - Verify `profiles` table has new columns

### Option 3: Database URL (Direct Connection)

1. **Get database connection string**:
   - Supabase Dashboard → Settings → Database
   - Copy "Connection string"

2. **Use psql or any PostgreSQL client**:
   ```bash
   psql "YOUR_CONNECTION_STRING" -f supabase/migrations/20260107183412_0ddfb83a-6b6d-4071-a8ae-9624bf89e68d.sql
   ```

## Quick Verification (Lovable Cloud)

**Easiest Method**: Check your app directly!

1. **Open the app** at your Lovable deployment URL
2. **Open browser console** (F12)
3. **Run test query**:
   ```javascript
   // In browser console
   const { supabase } = window;
   
   // Check if friendships table exists
   supabase.from('friendships').select('*').limit(1)
     .then(({data, error}) => console.log(error ? 'Table missing' : 'Table exists!'));
   
   // Check profiles columns
   supabase.from('profiles').select('weekly_xp, current_league_tier, debt_score').limit(1)
     .then(({data, error}) => console.log(error ? 'Columns missing' : 'Columns exist!'));
   ```

## Detailed Verification (Supabase Dashboard)

After deployment, verify the migration was successful:

### Check Tables
```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('friendships', 'challenges', 'leaderboard_entries');
```

### Check Profile Columns
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('weekly_xp', 'current_league_tier', 'debt_score', 'last_activity_date');
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('friendships', 'challenges');
```

## Expected Results

After successful deployment:
- ✅ `friendships` table with 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ `challenges` table with policies
- ✅ `leaderboard_entries` table (if included)
- ✅ `profiles` table has: `weekly_xp`, `current_league_tier`, `debt_score`, `last_activity_date`
- ✅ All RLS policies using `auth.uid()` for security

## Test Social Features

Once deployed, test in the app:

1. **Friends**:
   - Navigate to Settings → Friends (if implemented)
   - Send friend request
   - Check database: `SELECT * FROM friendships WHERE user_id = 'YOUR_USER_ID';`

2. **Challenges**:
   - Create a challenge
   - Check database: `SELECT * FROM challenges;`

3. **Leaderboard**:
   - Complete focus sessions to earn XP
   - Check leaderboard updates
   - Verify `weekly_xp` column in `profiles` increments

## Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already deployed. Check if they exist in Table Editor.

### Error: "permission denied"
**Solution**: Ensure you're logged in as project owner. Check API keys in `.env`.

### Error: "column already exists"
**Solution**: Migration already partially applied. Comment out ALTER TABLE lines that succeeded.

### RLS policies blocking data
**Solution**: Verify `auth.uid()` matches logged-in user. Check browser console for auth errors.

## Lovable Cloud Troubleshooting

### If migrations aren't deploying automatically:

1. **Check Lovable deployment logs**:
   - Look for migration errors
   - Verify build succeeded

2. **Trigger manual deployment**:
   - Push a small change to trigger rebuild
   - Or use Lovable dashboard "Redeploy" button

3. **Check file paths**:
   - Ensure migrations are in `supabase/migrations/`
   - Filenames match pattern: `YYYYMMDDHHMMSS_description.sql`

4. **Contact Lovable Support**:
   - If migrations still not deploying
   - Provide migration filename and error logs

## Next Steps

After migration verification:
1. ✅ Test onboarding → verify goal creation
2. ✅ Test social features (friends, challenges)
3. ✅ Verify leaderboard updates
4. ✅ Check league tier calculations
5. ✅ Test on mobile device

## Quick Command Reference

```bash
# Check Supabase CLI version
supabase --version

# Login
supabase login

# Link project
supabase link --project-ref YOUR_REF

# Check migration status
supabase migration list

# Apply all pending migrations
supabase db push

# Reset database (WARNING: deletes all data)
supabase db reset
```

## Contact & Support

If you encounter issues:
- Check Supabase Dashboard logs
- Review migration SQL for syntax errors
- Verify API keys in `.env` file
- Check Supabase status page
