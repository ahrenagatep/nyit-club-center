// creates a short-lived Supabase client for flows that sign a user in on the
// server (e.g. password recovery). Unlike the shared client in supabase.js it
// never stores or refreshes a session, so one user's session can't leak into
// another request.

const { createClient } = require('@supabase/supabase-js');
require('./supabase'); // validates SUPABASE_URL / SUPABASE_ANON_KEY at startup

function createRequestClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

module.exports = { createRequestClient };
