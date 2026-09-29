// creates the Supabase client used for Auth (email signup, login, verification, etc.)
// replace the placeholder values later

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// if (!DATABASE_URL || !SUPABASE_ANON_KEY) {
//   throw new Error('Missing DATABASE_URL or SUPABASE_ANON_KEY in .env');
// }

if (!SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_ANON_KEY in .env');
}

if  (!DATABASE_URL) {
    throw new Error('Missing DATABASE_URL in .env');
}

const supabase = createClient(DATABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
