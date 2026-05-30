import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin email list - add admin emails here or manage via DB role
export const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export const isAdmin = (email) => ADMIN_EMAILS.includes(email);
