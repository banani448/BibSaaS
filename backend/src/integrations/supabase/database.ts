import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
);

export default supabase;