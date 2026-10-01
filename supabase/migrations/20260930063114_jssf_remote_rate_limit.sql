CREATE SCHEMA IF NOT EXISTS quickstroke_private;
REVOKE ALL ON SCHEMA quickstroke_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS quickstroke_private.jssf_remote_rate_limits (
  bucket_key text NOT NULL CHECK (bucket_key ~ '^[0-9a-f]{64}$'),
  route text NOT NULL CHECK (route IN ('enroll','events','withdraw')),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_key, route)
);

REVOKE ALL ON quickstroke_private.jssf_remote_rate_limits
  FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA quickstroke_private TO service_role;

GRANT SELECT, INSERT, UPDATE
ON quickstroke_private.jssf_remote_rate_limits
TO service_role;

CREATE OR REPLACE FUNCTION public.consume_jssf_rate_limit(
  p_bucket_key text,
  p_route text
)
RETURNS TABLE (
  allowed boolean,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := now();
  v_window interval := interval '1 minute';
  v_limit integer;
  v_count integer;
  v_started timestamptz;
BEGIN
  IF p_bucket_key !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid rate-limit bucket';
  END IF;

  v_limit := CASE p_route
    WHEN 'enroll' THEN 10
    WHEN 'events' THEN 120
    WHEN 'withdraw' THEN 20
    ELSE NULL
  END;

  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'invalid rate-limit route';
  END IF;

  INSERT INTO quickstroke_private.jssf_remote_rate_limits (
    bucket_key,
    route,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (
    p_bucket_key,
    p_route,
    v_now,
    1,
    v_now
  )
  ON CONFLICT (bucket_key, route)
  DO UPDATE SET
    window_started_at = CASE
      WHEN quickstroke_private.jssf_remote_rate_limits.window_started_at <= v_now - v_window
      THEN v_now
      ELSE quickstroke_private.jssf_remote_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN quickstroke_private.jssf_remote_rate_limits.window_started_at <= v_now - v_window
      THEN 1
      ELSE quickstroke_private.jssf_remote_rate_limits.request_count + 1
    END,
    updated_at = v_now
  RETURNING request_count, window_started_at
  INTO v_count, v_started;

  allowed := v_count <= v_limit;

  IF allowed THEN
    retry_after_seconds := 0;
  ELSE
    retry_after_seconds := GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM ((v_started + v_window) - v_now)))::integer
    );
  END IF;

  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_jssf_rate_limit(text,text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_jssf_rate_limit(text,text)
  TO service_role;

CREATE OR REPLACE FUNCTION quickstroke_private.purge_jssf_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM quickstroke_private.jssf_remote_rate_limits
  WHERE updated_at <= now() - interval '1 day';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

REVOKE ALL ON FUNCTION quickstroke_private.purge_jssf_rate_limits()
  FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'quickstroke-jssf-rate-limit-cleanup',
  '17 * * * *',
  'SELECT quickstroke_private.purge_jssf_rate_limits();'
);