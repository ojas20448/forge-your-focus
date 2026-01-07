-- Add energy profile and weekly hours target to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS energy_profile TEXT DEFAULT 'balanced' CHECK (energy_profile IN ('morning_lark', 'night_owl', 'balanced')),
ADD COLUMN IF NOT EXISTS weekly_hours_target INTEGER DEFAULT 20 CHECK (weekly_hours_target >= 0);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_energy_profile ON profiles(energy_profile);

-- Update existing profiles to have default values
UPDATE profiles 
SET energy_profile = 'balanced', weekly_hours_target = 20 
WHERE energy_profile IS NULL OR weekly_hours_target IS NULL;
