// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cnvjyogjvvaldyqmeqst.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudmp5b2dqdnZhbGR5cW1lcXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3OTAzOTIsImV4cCI6MjA2MTM2NjM5Mn0.uqq1H-GVpbUS-rnmzcmoLApAi2QCyyC2BWuiWggiDzg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);