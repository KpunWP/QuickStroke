-- JSSF research provenance: distinguish engineering preflight from participant pilot data.
-- Existing rows were created before pilot freeze and are engineering/pre-pilot observations.
ALTER TABLE public.jssf_remote_sessions
  ADD COLUMN IF NOT EXISTS data_collection_phase text;

UPDATE public.jssf_remote_sessions
SET data_collection_phase = 'engineering_preflight'
WHERE data_collection_phase IS NULL;

ALTER TABLE public.jssf_remote_sessions
  ALTER COLUMN data_collection_phase SET DEFAULT 'engineering_preflight',
  ALTER COLUMN data_collection_phase SET NOT NULL;

ALTER TABLE public.jssf_remote_sessions
  DROP CONSTRAINT IF EXISTS jssf_remote_sessions_data_collection_phase_check;

ALTER TABLE public.jssf_remote_sessions
  ADD CONSTRAINT jssf_remote_sessions_data_collection_phase_check
  CHECK (data_collection_phase IN ('engineering_preflight','jssf_pilot'));

COMMENT ON COLUMN public.jssf_remote_sessions.data_collection_phase
IS 'Machine-readable cohort marker. engineering_preflight is excluded from participant outcome analysis; jssf_pilot is participant pilot data.';
