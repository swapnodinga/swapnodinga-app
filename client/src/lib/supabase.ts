import { createClient } from '@supabase/supabase-js';

// This tells the app to use the Vercel variables in production 
// OR use your hardcoded ones as a backup.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ivhjokefdwospalrqcmk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjE2NDksImV4cCI6MjA4MTQzNzY0OX0.wliUal3dj0dGQ8fQT0TNPlu3rEY6TOccXNx27Wx4Lpg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);