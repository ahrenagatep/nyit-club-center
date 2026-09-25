// creates the Supabase client used for Auth (email signup, login, verification, etc.)
// replace the placeholder values later

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'SUPABASE_URL';
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
