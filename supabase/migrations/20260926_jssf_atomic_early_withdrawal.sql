-- Atomic early withdrawal for an opted-in nonclinical JSSF session.
-- Only the server-side service_role may invoke the exposed RPC.
-- Deletes the entire session (including consent metadata and all linked events)
-- atomically using the existing FK ON DELETE CASCADE.
-- Retention cron continues to handle sessions not withdrawn early.
CREATE OR REPLACE FUNCTION public.withdraw_jssf_session(
  p_session_id uuid,
  p_token_sha256 text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $withdraw$
DECLARE
  deleted_session_id uuid;
BEGIN
  IF p_session_id IS NULL OR
     p_token_sha256 IS NULL OR
     p_token_sha256 !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  DELETE FROM public.jssf_remote_sessions
  WHERE id = p_session_id
    AND upload_token_sha256 = p_token_sha256
  RETURNING id INTO deleted_session_id;

  RETURN deleted_session_id IS NOT NULL;
END;
$withdraw$;

COMMENT ON FUNCTION public.withdraw_jssf_session(uuid,text)
IS 'JSSF service-role-only atomic early withdrawal: remove session and CASCADE events; returns false on invalid token or missing session.';

REVOKE ALL ON FUNCTION public.withdraw_jssf_session(uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_jssf_session(uuid,text)
  TO service_role;
