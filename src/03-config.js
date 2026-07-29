/* Live-sync configuration. Empty values = sync off (device-local mode).
   The publishable/anon key is DESIGNED to ship in the app; the sb_secret_ key must never appear here. */
const SYNC_CONFIG = {
  url: '',   // e.g. 'https://abcdxxxx.supabase.co'
  anon: '',  // sb_publishable_... (or legacy eyJ... anon key)
};
