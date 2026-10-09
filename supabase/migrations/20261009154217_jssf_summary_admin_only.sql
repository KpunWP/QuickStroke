SET lock_timeout = '5s';
-- This dashboard view was created outside repository migrations and may be absent.
DO $$
BEGIN
  IF to_regclass('public.jssf_pilot_session_summary') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON TABLE public.jssf_pilot_session_summary FROM PUBLIC, anon, authenticated;
    ALTER VIEW public.jssf_pilot_session_summary SET (security_invoker = true);
  END IF;
END $$;
