// Quick test file - run this in browser console at http://localhost:8081/

// Test 1: Check connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Project ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);

// Test 2: Try to fetch from a table
import { supabase } from '@/integrations/supabase/client';

// Check if profiles table exists
const testConnection = async () => {
  console.log('Testing Supabase connection...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
    
  if (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('Possible causes:');
    console.log('1. Migrations not applied yet');
    console.log('2. RLS policies blocking access');
    console.log('3. Table does not exist');
  } else {
    console.log('✅ Connection successful!');
    console.log('Profiles table exists');
  }
};

testConnection();
