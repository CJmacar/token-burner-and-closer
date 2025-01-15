import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://fneytolwkfswipmjwzge.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZXl0b2x3a2Zzd2lwbWp3emdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjYxNjcsImV4cCI6MjA1MjU0MjE2N30.NzIhhHkUYXDcW3nYpKVeJm33fh-aNYo-ORUI1aZJ7_o";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);