/**
 * Supabase client — used by home.html reset handler.
 */
(function (global) {
  const SUPABASE_URL = 'https://ztedlnyeeodvdyxzqpiz.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_WFtrwdK97JIawHiQZyLELg_h08mZifP';

  const lib = global.supabase;
  if (SUPABASE_URL && SUPABASE_ANON_KEY && lib?.createClient) {
    global.supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
})(window);