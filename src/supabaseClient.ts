// console.log('VITE_SUPABASE_URL =', import.meta.env.VITE_SUPABASE_URL);
// console.log('VITE_SUPABASE_ANON_KEY =', import.meta.env.VITE_SUPABASE_ANON_KEY);

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase'; // optional, if you've generated types

// These must be set in your .env file as:
//   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// With generated types (recommended for full IntelliSense & type safety)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// If you haven’t generated types yet, you can use:
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
