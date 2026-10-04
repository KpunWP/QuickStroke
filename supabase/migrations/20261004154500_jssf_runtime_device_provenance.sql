-- JSSF pilot v2 device/runtime provenance.
-- These fields are consented coarse research metadata. Raw User-Agent and persistent device identifiers are not stored.
ALTER TABLE public.jssf_remote_sessions
  ADD COLUMN IF NOT EXISTS os_major_version smallint,
  ADD COLUMN IF NOT EXISTS browser_major_version smallint,
  ADD COLUMN IF NOT EXISTS device_class text,
  ADD COLUMN IF NOT EXISTS device_model text,
  ADD COLUMN IF NOT EXISTS runtime_provenance_version text;

ALTER TABLE public.jssf_remote_sessions
  DROP CONSTRAINT IF EXISTS jssf_remote_sessions_os_major_version_check,
  DROP CONSTRAINT IF EXISTS jssf_remote_sessions_browser_major_version_check,
  DROP CONSTRAINT IF EXISTS jssf_remote_sessions_device_class_check,
  DROP CONSTRAINT IF EXISTS jssf_remote_sessions_device_model_check;

ALTER TABLE public.jssf_remote_sessions
  ADD CONSTRAINT jssf_remote_sessions_os_major_version_check
    CHECK (os_major_version IS NULL OR os_major_version BETWEEN 1 AND 99),
  ADD CONSTRAINT jssf_remote_sessions_browser_major_version_check
    CHECK (browser_major_version IS NULL OR browser_major_version BETWEEN 1 AND 999),
  ADD CONSTRAINT jssf_remote_sessions_device_class_check
    CHECK (device_class IN ('phone','tablet','desktop')),
  ADD CONSTRAINT jssf_remote_sessions_device_model_check
    CHECK (device_model IS NULL OR char_length(device_model) BETWEEN 1 AND 80);

COMMENT ON COLUMN public.jssf_remote_sessions.device_model
IS 'Browser-exposed model string when available; no serial/IMEI/advertising ID or raw User-Agent.';
COMMENT ON COLUMN public.jssf_remote_sessions.runtime_provenance_version
IS 'Version of the client-side coarse runtime provenance contract.';
