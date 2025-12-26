import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard: Settings > API
const supabaseUrl = 'https://ivhjokefdwospalrqcmk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGpva2VmZHdvc3BhbHJxY21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjE2NDksImV4cCI6MjA4MTQzNzY0OX0.wliUal3dj0dGQ8fQT0TNPlu3rEY6TOccXNx27Wx4Lpg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);