-- JSSF nonclinical remote pilot: server-side primary database retention.
-- Agreed policy: 90 days from the SERVER-created session timestamp.
-- Does not change clinical research data or enable remote recruitment.
-- Hourly housekeeping removes expired parent sessions; FK ON DELETE CASCADE
-- removes all associated JSSF events in the same transaction.
-- Database backups, infrastructure request logs and browser IndexedDB
-- require separate lifecycle controls and are NOT covered by this migration.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE SCHEMA IF NOT EXISTS quickstroke_private;
REVOKE ALL ON SCHEMA quickstroke_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION quickstroke_private.purge_expired_jssf_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.jssf_remote_sessions
  WHERE created_at <= now() - interval '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

COMMENT ON FUNCTION quickstroke_private.purge_expired_jssf_sessions()
IS 'Purge nonclinical JSSF sessions 90 days after server creation, cascading to events. Hourly scheduled; browser storage/backups separately managed.';

REVOKE ALL ON FUNCTION quickstroke_private.purge_expired_jssf_sessions()
  FROM PUBLIC, anon, authenticated;

-- The job executes as its database owner; no anonymous client receives
-- direct DELETE or EXECUTE rights. Runs hourly at minute zero (UTC).
SELECT cron.schedule(
  'quickstroke-jssf-90-day-retention',
  '0 * * * *',
  'SELECT quickstroke_private.purge_expired_jssf_sessions();'
);
