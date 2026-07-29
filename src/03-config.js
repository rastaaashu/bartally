/* Live-sync configuration. Empty values = sync off (device-local mode).
   The publishable/anon key is DESIGNED to ship in the app; the sb_secret_ key must never appear here. */
const SYNC_CONFIG = {
  url: 'https://oayrdregspxgssfgehrb.supabase.co',
  anon: 'sb_publishable_HS42W6M7lE1iYrC1QAljQA_Ru3ApqiO', // publishable by design; RLS governs access
};
