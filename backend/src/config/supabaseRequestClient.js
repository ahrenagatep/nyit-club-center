// creates a short-lived Supabase client for flows that sign a user in on the
// server (e.g. password recovery). Unlike the shared client in supabase.js it
// never stores or refreshes a session, so one user's session can't leak into
// another request.
// pass the user's access token to act as that user, so Supabase's RLS policies
// (e.g. on the avatars Storage bucket) see who is calling

const { createClient } = require('@supabase/supabase-js');
require('./supabase'); // validates SUPABASE_URL / SUPABASE_ANON_KEY at startup

function createRequestClient(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

module.exports = { createRequestClient };
