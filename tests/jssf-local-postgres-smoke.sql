-- Local-only synthetic JSSF smoke test. NEVER run against hosted Supabase.
-- Invoke only in the Docker container named supabase_db_quickstroke-jssf-local.
-- All changes are rolled back even when the checks succeed.
\set ON_ERROR_STOP on
BEGIN;
DO $smoke$
DECLARE
  live_id uuid := gen_random_uuid();
  withdrawn_id uuid := gen_random_uuid();
  expired_id uuid := gen_random_uuid();
  wrong_hash text := repeat('b', 64);
  correct_hash text := repeat('a', 64);
  removed boolean;
  event_id uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.jssf_remote_sessions'::regclass AND relrowsecurity)
    OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.jssf_remote_events'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'JSSF row-level security is disabled';
  END IF;
  IF has_table_privilege('anon', 'public.jssf_remote_sessions', 'SELECT')
    OR has_table_privilege('authenticated', 'public.jssf_remote_events', 'INSERT')
    OR has_function_privilege('anon', 'public.withdraw_jssf_session(uuid,text)', 'EXECUTE')
    OR NOT has_function_privilege('service_role', 'public.withdraw_jssf_session(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'JSSF table/RPC permissions do not match expected policy';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job
    WHERE jobname = 'quickstroke-jssf-90-day-retention' AND schedule = '0 * * * *') THEN
    RAISE EXCEPTION 'Hourly JSSF retention cron was not installed';
  END IF;
  RAISE NOTICE 'PASS: RLS, service-role-only withdrawal, and hourly cron';

  INSERT INTO public.jssf_remote_sessions
    (id, study_id, client_session_id, upload_token_sha256, consent_version,
     consented_at, age_18_or_older, app_version, app_build_id, created_at)
  VALUES
    (withdrawn_id, 'QS-1111-2222-3333-4444-5555-6666',
     'S-LOCALSMOKEWITHDRAW001', correct_hash, 'local-test-1', now(), true,
     '1.0.21', 'jssf-local-postgres-test', now()),
    (expired_id, 'QS-7777-8888-9999-AAAA-BBBB-CCCC',
     'S-LOCALSMOKEEXPIRED0001', repeat('c',64), 'local-test-1', now(), true,
     '1.0.21', 'jssf-local-postgres-test', now() - interval '91 days'),
    (live_id, 'QS-DDDD-EEEE-FFFF-1111-2222-3333',
     'S-LOCALSMOKELIVE000001', repeat('d',64), 'local-test-1', now(), true,
     '1.0.21', 'jssf-local-postgres-test', now());

  INSERT INTO public.jssf_remote_events
    (session_id, client_event_id, event_type, module, occurred_at, payload)
  VALUES
    (withdrawn_id, event_id, 'module_run_completed', 'face', now(),
     '{"result":"synthetic"}'::jsonb),
    (expired_id, gen_random_uuid(), 'module_run_completed', 'arm', now(),
     '{"result":"synthetic"}'::jsonb),
    (live_id, gen_random_uuid(), 'module_run_completed', 'speech', now(),
     '{"result":"synthetic"}'::jsonb);

  removed := public.withdraw_jssf_session(withdrawn_id, wrong_hash);
  IF removed OR NOT EXISTS (SELECT 1 FROM public.jssf_remote_sessions WHERE id=withdrawn_id)
    OR NOT EXISTS (SELECT 1 FROM public.jssf_remote_events WHERE client_event_id=event_id) THEN
    RAISE EXCEPTION 'Incorrect withdrawal capability removed data';
  END IF;
  removed := public.withdraw_jssf_session(withdrawn_id, correct_hash);
  IF NOT removed OR EXISTS (SELECT 1 FROM public.jssf_remote_sessions WHERE id=withdrawn_id)
    OR EXISTS (SELECT 1 FROM public.jssf_remote_events WHERE client_event_id=event_id) THEN
    RAISE EXCEPTION 'Authenticated withdrawal failed to cascade-delete events';
  END IF;
  removed := public.withdraw_jssf_session(withdrawn_id, correct_hash);
  IF removed THEN
    RAISE EXCEPTION 'Repeated withdrawal should return false at SQL level';
  END IF;
  RAISE NOTICE 'PASS: wrong token is rejected; valid withdrawal atomically cascades; replay is safe';

  PERFORM quickstroke_private.purge_expired_jssf_sessions();
  IF EXISTS (SELECT 1 FROM public.jssf_remote_sessions WHERE id=expired_id)
    OR EXISTS (SELECT 1 FROM public.jssf_remote_events WHERE session_id=expired_id)
    OR NOT EXISTS (SELECT 1 FROM public.jssf_remote_sessions WHERE id=live_id)
    OR NOT EXISTS (SELECT 1 FROM public.jssf_remote_events WHERE session_id=live_id) THEN
    RAISE EXCEPTION '90-day retention failed to remove expired only';
  END IF;
  RAISE NOTICE 'PASS: 90-day retention cascades and preserves active session';
END;
$smoke$;
ROLLBACK;
\echo PASS: smoke transaction rolled back; no synthetic records persist
