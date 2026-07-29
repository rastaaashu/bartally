/* Live-sync configuration. Empty values = sync off (device-local mode).
   The publishable/anon key is DESIGNED to ship in the app; the sb_secret_ key must never appear here. */
const SYNC_CONFIG = {
  url: 'https://oayrdregspxgssfgehrb.supabase.co',
  anon: 'sb_publishable_HS42W6M7lE1iYrC1QAljQA_Ru3ApqiO', // publishable by design; RLS governs access
  // VAPID public key — identifies this app to the browser push services. Public by design.
  vapid: 'BJs8q6M1uBhqC_tCrkrU9VjBdMVg0zaj80lPnqcYj6TG2Wuo_867qmOgucNMg7SP0p8AVIur1O7iYALNPi1rO-Y',
};
